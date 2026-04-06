import { useState, useMemo, useEffect, useCallback } from 'react';
import { StudentsService } from '../Services/students.service'; 
import { attendanceApi } from '../Services/attendanceApi'; 
import { Student } from '../types/student';
import { format, isSunday, parseISO } from 'date-fns';
import apiClient from '../Services/apiClient';
import jsPDF from 'jspdf';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    Users, UserCheck, UserX, Clock, Calendar, 
    Search, Save, MoreVertical, Edit2, Lock, 
    RotateCcw, Eye, AlertCircle, CheckCircle2, 
    XCircle, ChevronLeft, ChevronRight, Filter,
    CalendarDays, Download,
    RefreshCw, Bell, TrendingUp,
    Printer, FileText, FileDown, Info
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { StatCard } from '@/components/dashboard/StatCard';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIG ---
const CLASS_LEVELS = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];
const WORKING_HOURS = {
    morning: { start: '09:00', end: '12:30' },
    afternoon: { start: '13:30', end: '16:00' }
};

interface AttendanceState {
    morning: boolean | null;
    afternoon: boolean | null;
    morningFrozen: boolean;
    afternoonFrozen: boolean;
    markedAt?: string;
    markedBy?: string;
}

type StudentWithAttendance = Omit<Student, 'attendance'> & {
    attendance: AttendanceState;
    attendanceScore?: number;
};

type AttendanceSession = 'morning' | 'afternoon' | 'full-day';
type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'holiday' | 'pending';

interface AttendanceStats {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    pending: number;
    presentPercentage: number;
    absentPercentage: number;
    attendanceRate: number;
}

export default function Attendance() {
    const { toast } = useToast();
    const todayStr = new Date().toISOString().split('T')[0];
    const [currentTime, setCurrentTime] = useState(new Date());

    // Core States
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSession, setActiveSession] = useState<AttendanceSession>('full-day');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    // Export Date Range States
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportType, setExportType] = useState<'csv' | 'pdf' | 'print'>('csv');
    const [dateRangeType, setDateRangeType] = useState<'single' | 'week' | 'month' | 'custom' | '6months' | 'year'>('single');
    const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
    const [customEndDate, setCustomEndDate] = useState<string>(todayStr);
    
    // Attendance States
    const [isHoliday, setIsHoliday] = useState(false);
    const [holidayReason, setHolidayReason] = useState("");
    const [workingDaysCount, setWorkingDaysCount] = useState(0);
    const [yearlyWorkingDays, setYearlyWorkingDays] = useState(0);
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [holidayNote, setHolidayNote] = useState("");
    const [autoSave, setAutoSave] = useState(false);
    const [showLateMarking, setShowLateMarking] = useState(false);
    const [lateThreshold, setLateThreshold] = useState(15); // minutes

    // Filter States
    const [statusFilters, setStatusFilters] = useState<Record<AttendanceStatus, boolean>>({
        present: false,
        absent: false,
        late: false,
        leave: false,
        holiday: false,
        pending: false
    });

    // Data States
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [displayedStudents, setDisplayedStudents] = useState<StudentWithAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [syncInProgress, setSyncInProgress] = useState(false);

    // Real-time clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    // 1. Load Initial Student List
    useEffect(() => {
        const loadStudents = async () => {
            setLoading(true);
            try {
                const data = await StudentsService.getAll();
                setAllStudents(data);
                toast({
                    title: "Students Loaded",
                    description: `${data.length} students loaded successfully`,
                });
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Load Failed",
                    description: "Failed to load student data",
                });
            } finally {
                setLoading(false);
            }
        };
        loadStudents();
    }, [toast]);

    // 2. Fetch Calendar Information
    const fetchCalendarInfo = useCallback(async () => {
        const dateObj = parseISO(selectedDate);
        
        // Check for Sunday
        if (isSunday(dateObj)) {
            setIsHoliday(true);
            setHolidayReason("Sunday (Weekly Holiday)");
            return;
        }

        try {
            // Check holiday status from API
            const holidayRes = await attendanceApi.getHolidayStatus(selectedDate);
            if (holidayRes.isHoliday) {
                setIsHoliday(true);
                setHolidayReason(holidayRes.reason);
            } else {
                setIsHoliday(false);
                setHolidayReason("");
            }

            // Fetch working days
            const month = dateObj.getMonth() + 1;
            const year = dateObj.getFullYear();
            
            const monthRes = await attendanceApi.getWorkingDaysCount(month, year);
            setWorkingDaysCount(monthRes.workingDays);

            // Calculate yearly total
            let yearlyTotal = 0;
            for (let m = 1; m <= 12; m++) {
                const res = await attendanceApi.getWorkingDaysCount(m, year);
                yearlyTotal += res.workingDays;
            }
            setYearlyWorkingDays(yearlyTotal);
        } catch (error) {
            console.error("Calendar info error:", error);
            setIsHoliday(false);
        }
    }, [selectedDate]);

    // 3. Sync Attendance Data
    const syncAttendanceData = useCallback(async () => {
        if (allStudents.length === 0) return;
        
        setSyncInProgress(true);
        try {
            const records = await attendanceApi.getRecords(selectedClass, selectedSection, selectedDate);
            const attendanceMap: Record<string, any> = {};
            
            if (Array.isArray(records)) {
                records.forEach((record: any) => {
                    const studentId = record.studentId?._id || record.studentId || record._id;
                    if (studentId) {
                        attendanceMap[studentId.toString()] = record;
                    }
                });
            }

            const mergedStudents = allStudents
                .filter(student => {
                    const matchesClass = selectedClass === 'all' || 
                        student.class.className.includes(selectedClass);
                    const matchesSection = selectedSection === 'all' || 
                        student.class.section === selectedSection;
                    return matchesClass && matchesSection;
                })
                .map(student => {
                    const record = attendanceMap[student._id];
                    
                    const parseAttendance = (value: any) => {
                        if (value === "present") return true;
                        if (value === "absent") return false;
                        if (value === "true" || value === true) return true;
                        if (value === "false" || value === false) return false;
                        return null;
                    };

                    const morningValue = record?.sessions?.morning;
                    const afternoonValue = record?.sessions?.afternoon;

                    // Calculate attendance score (0-100)
                    const attendanceScore = record?.attendanceScore || 
                        calculateAttendanceScore(morningValue, afternoonValue);

                    return {
                        ...student,
                        attendance: {
                            morning: parseAttendance(morningValue),
                            afternoon: parseAttendance(afternoonValue),
                            morningFrozen: morningValue !== undefined && morningValue !== null,
                            afternoonFrozen: afternoonValue !== undefined && afternoonValue !== null,
                            markedAt: record?.markedAt,
                            markedBy: record?.markedBy
                        },
                        attendanceScore
                    };
                });

            setDisplayedStudents(mergedStudents);
            await fetchCalendarInfo();
            
        } catch (error) {
            console.error("Sync error:", error);
            toast({
                variant: "destructive",
                title: "Sync Failed",
                description: "Could not sync attendance data",
            });
        } finally {
            setSyncInProgress(false);
        }
    }, [allStudents, selectedClass, selectedSection, selectedDate, fetchCalendarInfo, toast]);

    // Calculate attendance score
    const calculateAttendanceScore = (morning: any, afternoon: any) => {
        let score = 0;
        if (morning === true || morning === 'present') score += 50;
        if (afternoon === true || afternoon === 'present') score += 50;
        return score;
    };

    // Auto-save effect
    useEffect(() => {
        if (autoSave && !isHoliday) {
            const timeout = setTimeout(() => {
                handleSave();
            }, 30000); // Auto-save every 30 seconds
            return () => clearTimeout(timeout);
        }
    }, [autoSave, displayedStudents, selectedDate, isHoliday]);

    // Sync when dependencies change
    useEffect(() => {
        syncAttendanceData();
    }, [syncAttendanceData]);

    // 4. Statistics Calculation
    const stats = useMemo<AttendanceStats>(() => {
        const total = displayedStudents.length;
        if (total === 0) {
            return {
                total: 0,
                present: 0,
                absent: 0,
                late: 0,
                leave: 0,
                pending: 0,
                presentPercentage: 0,
                absentPercentage: 0,
                attendanceRate: 0
            };
        }

        let present = 0, absent = 0, late = 0, leave = 0, pending = 0;

        displayedStudents.forEach(student => {
            const morning = student.attendance.morning;
            const afternoon = student.attendance.afternoon;

            if (activeSession === 'full-day') {
                // Count as present if AT LEAST ONE session is marked present
                const morningPresent = morning === true;
                const afternoonPresent = afternoon === true;
                const morningAbsent = morning === false;
                const afternoonAbsent = afternoon === false;
                
                // If both sessions are marked and both are present, count as present
                if (morningPresent && afternoonPresent) {
                    present++;
                }
                // If only one session is marked as present, count as present
                else if ((morningPresent && afternoon === null) || (morning === null && afternoonPresent)) {
                    present++;
                }
                // If both sessions are marked and both are absent, count as absent
                else if (morningAbsent && afternoonAbsent) {
                    absent++;
                }
                // If only one session is marked as absent, count as absent
                else if ((morningAbsent && afternoon === null) || (morning === null && afternoonAbsent)) {
                    absent++;
                }
                // Otherwise count as pending (both null or mixed marked/unmarked)
                else {
                    pending++;
                }
            } else if (activeSession === 'morning') {
                if (morning === true) present++;
                else if (morning === false) absent++;
                else pending++;
            } else if (activeSession === 'afternoon') {
                if (afternoon === true) present++;
                else if (afternoon === false) absent++;
                else pending++;
            }
        });

        const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;
        const absentPercentage = total > 0 ? Math.round((absent / total) * 100) : 0;
        const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        return {
            total,
            present,
            absent,
            late,
            leave,
            pending,
            presentPercentage,
            absentPercentage,
            attendanceRate
        };
    }, [displayedStudents, activeSession]);

    // 5. Handlers
    const handleMarkAsHoliday = async () => {
        if (!holidayNote.trim()) {
            toast({
                variant: "destructive",
                title: "Reason Required",
                description: "Please provide a reason for the holiday",
            });
            return;
        }

        try {
            await attendanceApi.markHoliday({
                date: selectedDate,
                reason: holidayNote.trim()
            });
            
            toast({
                title: "Holiday Confirmed",
                description: `${format(parseISO(selectedDate), 'MMM dd, yyyy')} has been marked as a holiday.`,
            });
            
            setIsHolidayModalOpen(false);
            setHolidayNote("");
            syncAttendanceData();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Action Failed",
                description: "Could not mark holiday. Please try again.",
            });
        }
    };

    const resetAllAttendance = () => {
        setDisplayedStudents(prev => prev.map(student => {
            if (isHoliday) return student;
            
            const newAttendance = { ...student.attendance };
            
            if (activeSession === 'full-day') {
                if (!student.attendance.morningFrozen) newAttendance.morning = null;
                if (!student.attendance.afternoonFrozen) newAttendance.afternoon = null;
            } else if (activeSession === 'morning' && !student.attendance.morningFrozen) {
                newAttendance.morning = null;
            } else if (activeSession === 'afternoon' && !student.attendance.afternoonFrozen) {
                newAttendance.afternoon = null;
            }
            
            return { ...student, attendance: newAttendance };
        }));
        
        toast({
            title: "Attendance Reset",
            description: "All unlocked attendance has been reset",
        });
    };

    const markAllStudents = (status: boolean) => {
        if (isHoliday) return;
        
        setDisplayedStudents(prev => prev.map(student => {
            const newAttendance = { ...student.attendance };
            
            if (activeSession === 'full-day') {
                if (!student.attendance.morningFrozen) newAttendance.morning = status;
                if (!student.attendance.afternoonFrozen) newAttendance.afternoon = status;
            } else if (activeSession === 'morning' && !student.attendance.morningFrozen) {
                newAttendance.morning = status;
            } else if (activeSession === 'afternoon' && !student.attendance.afternoonFrozen) {
                newAttendance.afternoon = status;
            }
            
            return { ...student, attendance: newAttendance };
        }));
        
        toast({
            title: status ? "All Marked Present" : "All Marked Absent",
            description: `All unlocked students marked as ${status ? 'present' : 'absent'}`,
        });
    };

    const handleAttendanceClick = (studentId: string, status: boolean) => {
        if (isHoliday) return;
        
        setDisplayedStudents(prev => prev.map(student => {
            if (student._id !== studentId) return student;
            
            const newAttendance = { ...student.attendance };
            
            if (activeSession === 'full-day') {
                if (!student.attendance.morningFrozen) newAttendance.morning = status;
                if (!student.attendance.afternoonFrozen) newAttendance.afternoon = status;
            } else if (activeSession === 'morning' && !student.attendance.morningFrozen) {
                newAttendance.morning = status;
            } else if (activeSession === 'afternoon' && !student.attendance.afternoonFrozen) {
                newAttendance.afternoon = status;
            }
            
            return { ...student, attendance: newAttendance };
        }));
    };

    const unlockAttendance = (studentId: string) => {
        setDisplayedStudents(prev => prev.map(student => {
            if (student._id !== studentId) return student;
            
            const newAttendance = { ...student.attendance };
            
            if (activeSession === 'morning') {
                newAttendance.morningFrozen = false;
            } else if (activeSession === 'afternoon') {
                newAttendance.afternoonFrozen = false;
            }
            
            return { ...student, attendance: newAttendance };
        }));
        
        toast({
            title: "Session Unlocked",
            description: "You can now modify this attendance record",
        });
    };

    const handleSave = async () => {
        if (isHoliday) {
            toast({
                title: "Cannot Save",
                description: "Attendance is locked due to holiday",
                variant: "destructive",
            });
            return;
        }

        const studentsToSave = displayedStudents.filter(student => {
            const morningChanged = student.attendance.morning !== null;
            const afternoonChanged = student.attendance.afternoon !== null;
            
            if (activeSession === 'full-day') return morningChanged || afternoonChanged;
            if (activeSession === 'morning') return morningChanged;
            return afternoonChanged;
        });

        if (studentsToSave.length === 0) {
            toast({
                title: "No Changes",
                description: "No attendance changes detected",
            });
            return;
        }

            setSaving(true);
        try {
            const payload = {
                date: selectedDate,
                className: selectedClass === 'all' ? '' : selectedClass,
                section: selectedSection === 'all' ? '' : selectedSection,
                attendance: studentsToSave.map(student => ({
                    studentId: student._id,
                    className: student.class.className,
                    section: student.class.section,
                    ...(activeSession === 'full-day' && {
                        morning: student.attendance.morning === true ? 'present' : 'absent',
                        afternoon: student.attendance.afternoon === true ? 'present' : 'absent'
                    }),
                    ...(activeSession === 'morning' && {
                        morning: student.attendance.morning === true ? 'present' : 'absent'
                    }),
                    ...(activeSession === 'afternoon' && {
                        afternoon: student.attendance.afternoon === true ? 'present' : 'absent'
                    })
                }))
            };

            await attendanceApi.markAttendance(payload);
            
            toast({
                title: "Attendance Saved",
                description: `${studentsToSave.length} records saved successfully`,
            });
            
            syncAttendanceData();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: "Could not save attendance. Please try again.",
            });
        } finally {
            setSaving(false);
        }
    };

    const calculateStats = () => {
        const total = filteredStudents.length;
        if (total === 0) {
            return { total: 0, present: 0, absent: 0, pending: 0, attendanceRate: 0 };
        }

        let present = 0, absent = 0, pending = 0;

        filteredStudents.forEach(student => {
            const morning = student.attendance.morning;
            const afternoon = student.attendance.afternoon;

            if (activeSession === 'full-day') {
                const morningPresent = morning === true;
                const afternoonPresent = afternoon === true;
                const morningAbsent = morning === false;
                const afternoonAbsent = afternoon === false;
                
                if (morningPresent && afternoonPresent) {
                    present++;
                } else if ((morningPresent && afternoon === null) || (morning === null && afternoonPresent)) {
                    present++;
                } else if (morningAbsent && afternoonAbsent) {
                    absent++;
                } else if ((morningAbsent && afternoon === null) || (morning === null && afternoonAbsent)) {
                    absent++;
                } else {
                    pending++;
                }
            } else if (activeSession === 'morning') {
                if (morning === true) present++;
                else if (morning === false) absent++;
                else pending++;
            } else if (activeSession === 'afternoon') {
                if (afternoon === true) present++;
                else if (afternoon === false) absent++;
                else pending++;
            }
        });

        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

        return { total, present, absent, pending, attendanceRate };
    };

    const getDateRange = (): { startDate: string; endDate: string } => {
        const today = parseISO(todayStr);
        let startDate = '';
        let endDate = todayStr;

        switch (dateRangeType) {
            case 'single':
                startDate = selectedDate;
                endDate = selectedDate;
                break;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 6);
                startDate = format(weekAgo, 'yyyy-MM-dd');
                break;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setDate(today.getDate() - 29);
                startDate = format(monthAgo, 'yyyy-MM-dd');
                break;
            case '6months':
                const sixMonthsAgo = new Date(today);
                sixMonthsAgo.setMonth(today.getMonth() - 6);
                startDate = format(sixMonthsAgo, 'yyyy-MM-dd');
                break;
            case 'year':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(today.getFullYear() - 1);
                startDate = format(yearAgo, 'yyyy-MM-dd');
                break;
            case 'custom':
                startDate = customStartDate;
                endDate = customEndDate;
                break;
            default:
                startDate = selectedDate;
                endDate = selectedDate;
        }

        return { startDate, endDate };
    };

    const fetchAttendanceForDateRange = async (startDate: string, endDate: string) => {
        try {
            // Call the new professional report API - single call, all aggregation done on backend
            const response = await apiClient.get(`/admin/attendance/report`, {
                params: {
                    class: selectedClass === 'all' ? 'LKG' : selectedClass, // Default to first class if 'all' to get data
                    section: selectedSection === 'all' ? 'A' : selectedSection,
                    reportType: dateRangeType === 'single' ? 'day' : dateRangeType === 'week' ? 'week' : dateRangeType === 'month' ? 'month' : 'year',
                    startDate: startDate,
                    endDate: endDate
                }
            });

            if (response.data.success) {
                return response.data.data;
            }

            return null;
        } catch (error) {
            console.error('Error fetching attendance report:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not fetch attendance data. Please try again.",
            });
            return null;
        }
    };

    const handleExportWithDateRange = async () => {
        try {
            const { startDate, endDate } = getDateRange();
            
            console.log('📊 Starting export:', { dateRangeType, exportType, startDate, endDate, selectedClass, selectedSection });
            
            toast({
                title: "Preparing Export",
                description: "Generating attendance report...",
            });

            const reportData = await fetchAttendanceForDateRange(startDate, endDate);

            if (!reportData) {
                console.error('No report data returned');
                toast({
                    variant: "destructive",
                    title: "Failed",
                    description: "Could not generate report. Please try again.",
                });
                return;
            }

            console.log('✅ Report data received:', reportData);
            setExportDialogOpen(false);

            // Call appropriate export function based on format and report type
            if (exportType === 'csv') {
                console.log('📄 Exporting to CSV...');
                exportReportToCSV(reportData);
            } else if (exportType === 'pdf') {
                console.log('🖨️ Exporting to PDF...');
                await exportReportToPDF(reportData);
            } else if (exportType === 'print') {
                console.log('🖨️ Opening print preview...');
                exportReportToPrint(reportData);
            }

            toast({
                title: "Export Ready",
                description: `${dateRangeType} report generated successfully`,
            });

        } catch (error) {
            console.error('Export error:', error);
            toast({
                variant: "destructive",
                title: "Export Failed",
                description: "Could not export attendance data: " + (error as any).message,
            });
        }
    };

    const exportReportToCSV = (reportData: any) => {
        try {
            console.log('📥 CSV Export - Input data:', reportData);
            
            let csvContent = '';
            const { startDate, endDate } = getDateRange();
            
            // Header comment
            csvContent += `Attendance Report\n`;
            csvContent += `Type: ${dateRangeType.toUpperCase()}\n`;
            csvContent += `Date Range: ${startDate} to ${endDate}\n`;
            csvContent += `Class: ${selectedClass}\n`;
            csvContent += `Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm a')}\n\n`;

            // Different CSV format based on report type
            if (dateRangeType === 'single' || dateRangeType === 'week') {
                // Detailed format with student rows
                csvContent += `ID,Name,Class,Section,Morning,Afternoon,Status,Percentage\n`;
                
                const students = reportData.students || [];
                console.log('Students array length:', students.length);
                
                students.forEach((student: any) => {
                    csvContent += `"${student.id}","${student.name}","${student.class || ''}","${student.section || ''}","${student.morning || '--'}","${student.afternoon || '--'}","${student.fullDay || student.percentage}"\n`;
                });
            } else if (dateRangeType === 'month') {
                // Summary format
                csvContent += `ID,Name,Present,Absent,Leave,Attendance Rate\n`;
                
                const students = reportData.students || [];
                console.log('Students array length:', students.length);
                
                students.forEach((student: any) => {
                    csvContent += `"${student.id}","${student.name}","${student.present || 0}","${student.absent || 0}","${student.leave || 0}","${student.rate || 0}%"\n`;
                });
            } else if (dateRangeType === 'year') {
                // Yearly summary
                csvContent += `ID,Name,Total Days,Total Present,Total Absent,Total Leave,Annual Rate\n`;
                
                const students = reportData.studentSummary || [];
                console.log('Student summary array length:', students.length);
                
                students.forEach((student: any) => {
                    csvContent += `"${student.id}","${student.name}","${student.totalDays || 0}","${student.totalPresent || 0}","${student.totalAbsent || 0}","${student.totalLeave || 0}","${student.rate || 0}%"\n`;
                });
            }

            console.log('📊 CSV Content Length:', csvContent.length);
            console.log('📊 CSV Preview (first 500 chars):',  csvContent.substring(0, 500));

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `attendance_${dateRangeType}_${startDate}_to_${endDate}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ CSV file downloaded');

        } catch (error) {
            console.error('CSV export error:', error);
            toast({
                variant: "destructive",
                title: "CSV Export Failed",
                description: "Could not create CSV file: " + (error as any).message,
            });
        }
    };

    const generateReportHTML = (reportData: any) => {
        if (dateRangeType === 'single') return generateDayReportHTML(reportData);
        if (dateRangeType === 'week') return generateWeekReportHTML(reportData);
        if (dateRangeType === 'month') return generateMonthReportHTML(reportData);

        // Custom, 6-month and yearly views use aggregated/year-style structure.
        return generateYearReportHTML(reportData);
    };

    const exportReportToPDF = async (reportData: any) => {
        try {
            console.log('Starting PDF export with reportData:', reportData);

            const htmlContent = generateReportHTML(reportData);

            console.log('Generated HTML length:', htmlContent.length);

            if (!htmlContent || htmlContent.trim().length === 0) {
                throw new Error('No printable content generated for the selected date range.');
            }

            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-99999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '1000px';
            tempContainer.innerHTML = htmlContent;
            document.body.appendChild(tempContainer);

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            await pdf.html(tempContainer, {
                margin: [8, 8, 8, 8],
                autoPaging: 'text',
                html2canvas: {
                    scale: 0.5,
                    useCORS: true,
                    allowTaint: true
                }
            });

            const { startDate, endDate } = getDateRange();
            pdf.save(`attendance_${dateRangeType}_${startDate}_to_${endDate}.pdf`);
            document.body.removeChild(tempContainer);

            toast({
                title: 'PDF Downloaded',
                description: 'Attendance report has been downloaded as PDF.'
            });

        } catch (error) {
            console.error('PDF export error:', error);
            toast({
                variant: 'destructive',
                title: 'PDF Export Failed',
                description: 'Could not generate PDF: ' + (error as any).message,
            });
        }
    };

    const exportReportToPrint = (reportData: any) => {
        try {
            const htmlContent = generateReportHTML(reportData);

            if (!htmlContent || htmlContent.trim().length === 0) {
                throw new Error('No printable content generated for the selected date range.');
            }

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank', 'width=1200,height=800');
            
            if (!printWindow) {
                toast({
                    variant: "destructive",
                    title: "Export Failed",
                    description: "Please allow popups to export PDF/Print",
                });
                return;
            }

            // Wait for window to load before printing
            setTimeout(() => {
                try {
                    printWindow.focus();
                    printWindow.print();
                    console.log('Print dialog opened');
                } catch (printError) {
                    console.error('Print error:', printError);
                }
            }, 500);

        } catch (error) {
            console.error('Print export error:', error);
            toast({
                variant: "destructive",
                title: "Print Failed",
                description: "Could not prepare print preview: " + (error as any).message,
            });
        }
    };

    const generateDayReportHTML = (reportData: any) => {
        const { startDate } = getDateRange();
        const stats = reportData.stats || {};
        const students = reportData.students || [];

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Daily Attendance Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
                    .header h1 { margin: 0; color: #2563eb; font-size: 24px; }
                    .header p { margin: 5px 0; color: #666; }
                    .stats { display: flex; gap: 30px; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; }
                    .stat { flex: 1; text-align: center; }
                    .stat-label { font-size: 12px; color: #666; font-weight: bold; }
                    .stat-value { font-size: 28px; font-weight: bold; color: #1f2937; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #2563eb; color: white; padding: 10px; text-align: left; font-size: 13px; }
                    td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
                    tr:nth-child(even) { background: #f9fafb; }
                    .present { color: #10b981; font-weight: bold; }
                    .absent { color: #ef4444; font-weight: bold; }
                    .partial { color: #f59e0b; font-weight: bold; }
                    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Daily Attendance Report</h1>
                    <p><strong>Date:</strong> ${format(parseISO(startDate), 'EEEE, MMMM dd, yyyy')}</p>
                    <p><strong>Class:</strong> ${selectedClass} | <strong>Section:</strong> ${selectedSection}</p>
                </div>

                <div class="stats">
                    <div class="stat">
                        <div class="stat-label">Total Students</div>
                        <div class="stat-value">${stats.total || 0}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Present</div>
                        <div class="stat-value" style="color: #10b981;">${stats.present || 0}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Absent</div>
                        <div class="stat-value" style="color: #ef4444;">${stats.absent || 0}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Pending</div>
                        <div class="stat-value" style="color: #f59e0b;">${stats.pending || 0}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Attendance Rate</div>
                        <div class="stat-value" style="color: #2563eb;">${stats.rate || 0}%</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Section</th>
                            <th>Morning</th>
                            <th>Afternoon</th>
                            <th>Full Day Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((s: any) => {
                            const statusClass = s.fullDay === 'Present' ? 'present' : s.fullDay === 'Absent' ? 'absent' : 'partial';
                            return `
                                <tr>
                                    <td>${s.id}</td>
                                    <td>${s.name}</td>
                                    <td>${s.class}</td>
                                    <td>${s.section}</td>
                                    <td>${s.morning}</td>
                                    <td>${s.afternoon}</td>
                                    <td class="${statusClass}">${s.fullDay}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm a')} | School ERP Management System</p>
                </div>
            </body>
            </html>
        `;
    };

    const generateWeekReportHTML = (reportData: any) => {
        const { startDate, endDate } = getDateRange();
        const stats = reportData.stats || {};
        const students = reportData.students || [];
        const dayHeaders = reportData.dayHeaders || [];

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Weekly Attendance Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
                    .header h1 { margin: 0; color: #2563eb; font-size: 24px; }
                    .header p { margin: 5px 0; color: #666; }
                    .stats { display: flex; gap: 30px; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; }
                    .stat { flex: 1; text-align: center; }
                    .stat-label { font-size: 12px; color: #666; font-weight: bold; }
                    .stat-value { font-size: 28px; font-weight: bold; color: #1f2937; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th { background: #2563eb; color: white; padding: 8px; text-align: center; }
                    td { padding: 8px; border: 1px solid #e5e7eb; text-align: center; }
                    .name-col { text-align: left; background: #f9fafb; }
                    .day-cell { width: 40px; }
                    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Weekly Attendance Report</h1>
                    <p><strong>Week:</strong> ${startDate} to ${endDate}</p>
                    <p><strong>Working Days:</strong> ${reportData.totalWorkingDays || 0} days</p>
                </div>

                <div class="stats">
                    <div class="stat">
                        <div class="stat-label">Total Students</div>
                        <div class="stat-value">${reportData.totalRecords || 0}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Overall Attendance</div>
                        <div class="stat-value" style="color: #10b981;">${stats.rate || 0}%</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            ${dayHeaders.map((day: string) => `<th class="day-cell">${day}</th>`).join('')}
                            <th style="width: 50px;">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((s: any) => {
                            const dayValues = Object.values(s.days as Record<string, string>).map((d: any) => `<td class="day-cell">${d}</td>`).join('');
                            return `
                                <tr>
                                    <td class="name-col">${s.name}</td>
                                    ${dayValues}
                                    <td style="font-weight: bold; color: #2563eb;">${s.percentage}%</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>P = Present | A = Absent | L = Leave/Partial | - = Pending</p>
                    <p>Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm a')} | School ERP Management System</p>
                </div>
            </body>
            </html>
        `;
    };

    const generateMonthReportHTML = (reportData: any) => {
        const { startDate, endDate } = getDateRange();
        const stats = reportData.stats || {};
        const students = reportData.students || [];

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Monthly Attendance Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
                    .header h1 { margin: 0; color: #2563eb; font-size: 24px; }
                    .header p { margin: 5px 0; color: #666; }
                    .stats { display: flex; gap: 30px; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; }
                    .stat { flex: 1; text-align: center; }
                    .stat-label { font-size: 12px; color: #666; font-weight: bold; }
                    .stat-value { font-size: 28px; font-weight: bold; color: #1f2937; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th { background: #2563eb; color: white; padding: 10px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
                    tr:nth-child(even) { background: #f9fafb; }
                    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Monthly Attendance Report</h1>
                    <p><strong>Month:</strong> ${startDate} to ${endDate}</p>
                    <p><strong>Working Days:</strong> ${stats.workingDays || 0} days</p>
                </div>

                <div class="stats">
                    <div class="stat">
                        <div class="stat-label">Total Students</div>
                        <div class="stat-value">${reportData.totalRecords || 0}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Total Present</div>
                        <div class="stat-value" style="color: #10b981;">${stats.totalPresent || 0}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Total Absent</div>
                        <div class="stat-value" style="color: #ef4444;">${stats.totalAbsent || 0}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Overall %</div>
                        <div class="stat-value" style="color: #2563eb;">${stats.overallRate || 0}%</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Leave</th>
                            <th>Attendance %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((s: any) => `
                            <tr>
                                <td>${s.id}</td>
                                <td>${s.name}</td>
                                <td style="color: #10b981; font-weight: bold;">${s.present}</td>
                                <td style="color: #ef4444; font-weight: bold;">${s.absent}</td>
                                <td style="color: #f59e0b; font-weight: bold;">${s.leave}</td>
                                <td style="color: #2563eb; font-weight: bold;">${s.rate}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm a')} | School ERP Management System</p>
                </div>
            </body>
            </html>
        `;
    };

    const generateYearReportHTML = (reportData: any) => {
        const { startDate, endDate } = getDateRange();
        const stats = reportData.stats || {};
        const monthSummary = reportData.monthSummary || [];
        const studentSummary = reportData.studentSummary || [];

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Yearly Attendance Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
                    .header h1 { margin: 0; color: #2563eb; font-size: 24px; }
                    .header p { margin: 5px 0; color: #666; }
                    .section-title { font-size: 16px; font-weight: bold; color: #2563eb; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #2563eb; color: white; padding: 10px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
                    tr:nth-child(even) { background: #f9fafb; }
                    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Yearly Attendance Report</h1>
                    <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
                    <p><strong>Total Working Days:</strong> ${stats.totalWorkingDays || 0}</p>
                </div>

                <div class="section-title">📅 Monthly Summary</div>
                <table>
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Working Days</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Leave</th>
                            <th>Attendance %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${monthSummary.map((m: any) => `
                            <tr>
                                <td>${m.month}</td>
                                <td>${m.workingDays}</td>
                                <td style="color: #10b981; font-weight: bold;">${m.present}</td>
                                <td style="color: #ef4444; font-weight: bold;">${m.absent}</td>
                                <td style="color: #f59e0b; font-weight: bold;">${m.leave}</td>
                                <td style="color: #2563eb; font-weight: bold;">${m.rate}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="section-title">👨‍🎓 Student-wise Yearly Summary</div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Total Days</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Leave</th>
                            <th>Annual Attendance %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentSummary.slice(0, 30).map((s: any) => `
                            <tr>
                                <td>${s.id}</td>
                                <td>${s.name}</td>
                                <td>${s.totalDays}</td>
                                <td style="color: #10b981; font-weight: bold;">${s.totalPresent}</td>
                                <td style="color: #ef4444; font-weight: bold;">${s.totalAbsent}</td>
                                <td style="color: #f59e0b; font-weight: bold;">${s.totalLeave}</td>
                                <td style="color: #2563eb; font-weight: bold;">${s.rate}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${studentSummary.length > 30 ? `<p style="color: #999; margin-top: 10px;">... and ${studentSummary.length - 30} more students</p>` : ''}

                <div class="footer">
                    <p>Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm a')} | School ERP Management System</p>
                </div>
            </body>
            </html>
        `;
    };

    const handlePrintAttendance = () => {
        setExportType('print');
        setExportDialogOpen(true);
    };

    const exportToCSV = () => {
        setExportType('csv');
        setExportDialogOpen(true);
    };

    const exportToPDF = () => {
        setExportType('pdf');
        setExportDialogOpen(true);
    };

    // Filter students based on search and filters
    const filteredStudents = useMemo(() => {
        return displayedStudents.filter(student => {
            // Search filter
            const name = `${student.student.firstName} ${student.student.lastName}`.toLowerCase();
            const searchMatch = name.includes(searchQuery.toLowerCase()) || 
                student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (!searchMatch) return false;

            // Status filter
            const anyFilterActive = Object.values(statusFilters).some(v => v);
            if (!anyFilterActive) return true;

            const morning = student.attendance.morning;
            const afternoon = student.attendance.afternoon;
            let statusMatch = false;

            if (activeSession === 'full-day') {
                // Determine student's actual full-day status
                const morningPresent = morning === true;
                const afternoonPresent = afternoon === true;
                const morningAbsent = morning === false;
                const afternoonAbsent = afternoon === false;
                
                let studentStatus = 'pending';
                if ((morningPresent && afternoonPresent) || 
                    (morningPresent && afternoon === null) || 
                    (morning === null && afternoonPresent)) {
                    studentStatus = 'present';
                } else if ((morningAbsent && afternoonAbsent) || 
                           (morningAbsent && afternoon === null) || 
                           (morning === null && afternoonAbsent)) {
                    studentStatus = 'absent';
                }
                
                if (statusFilters.present && studentStatus === 'present') statusMatch = true;
                if (statusFilters.absent && studentStatus === 'absent') statusMatch = true;
                if (statusFilters.pending && studentStatus === 'pending') statusMatch = true;
            } else if (activeSession === 'morning') {
                if (statusFilters.present && morning === true) statusMatch = true;
                if (statusFilters.absent && morning === false) statusMatch = true;
                if (statusFilters.pending && morning === null) statusMatch = true;
            } else if (activeSession === 'afternoon') {
                if (statusFilters.present && afternoon === true) statusMatch = true;
                if (statusFilters.absent && afternoon === false) statusMatch = true;
                if (statusFilters.pending && afternoon === null) statusMatch = true;
            }

            return statusMatch;
        });
    }, [displayedStudents, searchQuery, statusFilters, activeSession]);

    // Navigation
    const navigateDate = (direction: 'prev' | 'next') => {
        const date = parseISO(selectedDate);
        const newDate = new Date(date);
        
        if (direction === 'prev') {
            newDate.setDate(date.getDate() - 1);
        } else {
            newDate.setDate(date.getDate() + 1);
        }
        
        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-600 text-white">
                            <CalendarDays className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Attendance Management</h1>
                            <p className="text-slate-600 text-sm">
                                Real-time attendance tracking for {selectedClass !== 'all' ? `Class ${selectedClass}` : 'all classes'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Current Time Display */}
                    <div className="flex items-center gap-3 text-sm">
                        <Badge variant="outline" className="font-mono">
                            {format(currentTime, 'hh:mm a')}
                        </Badge>
                        <span className="text-slate-500">
                            {format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => { setExportType('print'); setExportDialogOpen(true); }}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Attendance
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setExportType('csv'); setExportDialogOpen(true); }}>
                                <FileText className="h-4 w-4 mr-2" />
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setExportType('pdf'); setExportDialogOpen(true); }}>
                                <FileDown className="h-4 w-4 mr-2" />
                                Export as PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {!isHoliday && (
                        <Button
                            variant="outline"
                            onClick={() => setIsHolidayModalOpen(true)}
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Declare Holiday
                        </Button>
                    )}

                    <Button
                        onClick={handleSave}
                        disabled={saving || isHoliday || syncInProgress}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        {saving ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </Button>
                </div>
            </div>

            {/* Holiday Banner */}
            {isHoliday && (
                <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-rose-100">
                                <AlertCircle className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Holiday: {holidayReason}</h3>
                                <p className="text-sm text-slate-600">Attendance is locked for this date</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="border-rose-300 text-rose-700">
                            Non-Working Day
                        </Badge>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <StatCard
                    title="Total Students"
                    value={stats.total.toString()}
                    subtitle={`${selectedClass === 'all' ? 'All Classes' : `Class ${selectedClass}`}`}
                    icon={Users}
                    variant="primary"
                    trend={{ value: stats.total, isPositive: stats.total > 0 }}
                />
                
                <StatCard
                    title="Present"
                    value={stats.present.toString()}
                    subtitle={`${stats.presentPercentage}%`}
                    icon={UserCheck}
                    variant="success"
                    trend={{ value: stats.presentPercentage, isPositive: stats.presentPercentage > 80 }}
                />
                
                <StatCard
                    title="Absent"
                    value={stats.absent.toString()}
                    subtitle={`${stats.absentPercentage}%`}
                    icon={UserX}
                    variant="danger"
                    trend={{ value: stats.absentPercentage, isPositive: stats.absentPercentage > 20 }}
                />
                
                <StatCard
                    title="Pending"
                    value={stats.pending.toString()}
                    subtitle={`${activeSession.toUpperCase()}`}
                    icon={Clock}
                    variant="warning"
                />
                
                <StatCard
                    title="Working Days"
                    value={workingDaysCount.toString()}
                    subtitle={`Year: ${yearlyWorkingDays}`}
                    icon={Calendar}
                    variant="primary"
                />
                
                <StatCard
                    title="Attendance Rate"
                    value={`${stats.attendanceRate}%`}
                    subtitle="Overall"
                    icon={TrendingUp}
                    variant="success"
                    trend={{ value: stats.attendanceRate, isPositive: stats.attendanceRate > 85 }}
                />
            </div>

            {/* Control Panel */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Date Navigation */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-700">Date Selection</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => navigateDate('prev')}
                                    className="h-10 w-10"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                
                                <div className="flex-1">
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="h-10"
                                        max={todayStr}
                                    />
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => navigateDate('next')}
                                    className="h-10 w-10"
                                    disabled={selectedDate >= todayStr}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedDate(todayStr)}
                                    className="text-blue-600"
                                >
                                    Today
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={syncAttendanceData}
                                    disabled={syncInProgress}
                                    className="text-slate-600"
                                >
                                    <RefreshCw className={`h-3 w-3 mr-1 ${syncInProgress ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        {/* Class & Section Selection */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-700">Class & Section</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {CLASS_LEVELS.map(level => (
                                            <SelectItem key={level} value={level}>
                                                Class {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        {SECTIONS.map(section => (
                                            <SelectItem key={section} value={section}>
                                                Section {section}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search students..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-10"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSearchQuery('')}
                                    className="h-10 w-10"
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Session & Settings */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-700">Session & Settings</Label>
                            
                            <Tabs value={activeSession} onValueChange={(v) => setActiveSession(v as AttendanceSession)}>
                                <TabsList className="grid grid-cols-3 w-full">
                                    <TabsTrigger value="morning" className="text-xs">
                                        Morning
                                        <span className="ml-1 text-[10px] opacity-60">{WORKING_HOURS.morning.start}</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="afternoon" className="text-xs">
                                        Afternoon
                                        <span className="ml-1 text-[10px] opacity-60">{WORKING_HOURS.afternoon.start}</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="full-day" className="text-xs">Full Day</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="auto-save" className="text-sm font-medium">
                                        Auto-save
                                    </Label>
                                    <Switch
                                        id="auto-save"
                                        checked={autoSave}
                                        onCheckedChange={setAutoSave}
                                    />
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => markAllStudents(true)}
                                        disabled={isHoliday}
                                        className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Mark All Present
                                    </Button>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => markAllStudents(false)}
                                        disabled={isHoliday}
                                        className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                                    >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Mark All Absent
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Filter by Status:</span>
                </div>
                
                {Object.entries(statusFilters).map(([status, isActive]) => (
                    <Button
                        key={status}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilters(prev => ({
                            ...prev,
                            [status]: !isActive
                        }))}
                        className={`capitalize ${
                            status === 'present' ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' :
                            status === 'absent' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' :
                            'border-slate-200 text-slate-600'
                        }`}
                    >
                        {status}
                    </Button>
                ))}
                
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilters({
                        present: false,
                        absent: false,
                        late: false,
                        leave: false,
                        holiday: false,
                        pending: false
                    })}
                    className="ml-auto text-slate-500"
                >
                    Clear Filters
                </Button>
            </div>

            {/* Students List */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">
                            Student Attendance
                            <span className="ml-2 text-sm font-normal text-slate-500">
                                ({filteredStudents.length} students)
                            </span>
                        </CardTitle>
                        
                        <div className="flex items-center gap-3">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="h-8 w-8 p-0"
                            >
                                <div className="grid grid-cols-2 gap-0.5">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 bg-current rounded" />
                                    ))}
                                </div>
                            </Button>
                            
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="h-8 w-8 p-0"
                            >
                                <div className="space-y-0.5">
                                    <div className="w-4 h-0.5 bg-current rounded" />
                                    <div className="w-4 h-0.5 bg-current rounded" />
                                    <div className="w-4 h-0.5 bg-current rounded" />
                                </div>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-slate-500">Loading student data...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <Users className="h-12 w-12 mx-auto text-slate-300" />
                            <p className="text-slate-500">No students found</p>
                            <p className="text-sm text-slate-400">
                                Try changing your filters or search term
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredStudents.map((student) => {
                                const isMorningLocked = student.attendance.morningFrozen || isHoliday;
                                const isAfternoonLocked = student.attendance.afternoonFrozen || isHoliday;
                                const isLocked = activeSession === 'morning' ? isMorningLocked :
                                               activeSession === 'afternoon' ? isAfternoonLocked :
                                               isMorningLocked && isAfternoonLocked;

                                const getStatusColor = (status: boolean | null) => {
                                    if (status === true) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                    if (status === false) return 'bg-rose-100 text-rose-700 border-rose-200';
                                    return 'bg-amber-100 text-amber-700 border-amber-200';
                                };

                                // Safely resolve profile picture from either shape to avoid TS error
                                const profilePic = (student as any).profilePic || (student.student as any).profilePic;

                                return (
                                    <div
                                        key={student._id}
                                        className={`p-4 rounded-xl border transition-all duration-200 ${
                                            isLocked ? 'bg-slate-50 opacity-80' : 'bg-white hover:shadow-md'
                                        }`}
                                    >
                                        {/* Student Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border shadow-sm">
                                                    {profilePic ? (
                                                        <AvatarImage 
                                                            src={profilePic}
                                                            alt={student.student.firstName}
                                                        />
                                                    ) : null}
                                                    <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                                                        {student.student.firstName[0]}{student.student.lastName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800">
                                                        {student.student.firstName} {student.student.lastName}
                                                    </h4>
                                                    <p className="text-xs text-slate-500">
                                                        {student.class.className} - {student.class.section}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {!isHoliday && (
                                                        <DropdownMenuItem onClick={() => unlockAttendance(student._id)}>
                                                            <Edit2 className="h-4 w-4 mr-2" />
                                                            Edit Attendance
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-rose-600">
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Report Issue
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Attendance Status */}
                                        <div className="space-y-3">
                                            {activeSession === 'full-day' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className={`px-3 py-2 rounded-lg border ${getStatusColor(student.attendance.morning)}`}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-medium">Morning</span>
                                                            {isMorningLocked && <Lock className="h-3 w-3" />}
                                                        </div>
                                                        <p className="text-sm font-bold mt-1">
                                                            {student.attendance.morning === null ? 'Pending' :
                                                             student.attendance.morning ? 'Present' : 'Absent'}
                                                        </p>
                                                    </div>
                                                    <div className={`px-3 py-2 rounded-lg border ${getStatusColor(student.attendance.afternoon)}`}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-medium">Afternoon</span>
                                                            {isAfternoonLocked && <Lock className="h-3 w-3" />}
                                                        </div>
                                                        <p className="text-sm font-bold mt-1">
                                                            {student.attendance.afternoon === null ? 'Pending' :
                                                             student.attendance.afternoon ? 'Present' : 'Absent'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {(activeSession === 'morning' || activeSession === 'afternoon') && (
                                                <div className={`px-4 py-3 rounded-lg border ${getStatusColor(
                                                    activeSession === 'morning' ? student.attendance.morning : student.attendance.afternoon
                                                )}`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium capitalize">{activeSession}</span>
                                                        {isLocked && <Lock className="h-4 w-4" />}
                                                    </div>
                                                    <p className="text-lg font-bold mt-1">
                                                        {(
                                                            activeSession === 'morning' ? student.attendance.morning :
                                                            student.attendance.afternoon
                                                        ) === null ? 'Pending' : (
                                                            activeSession === 'morning' ? student.attendance.morning :
                                                            student.attendance.afternoon
                                                        ) ? 'Present' : 'Absent'}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            {!isLocked && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={`h-9 ${
                                                            (activeSession === 'morning' ? student.attendance.morning :
                                                             activeSession === 'afternoon' ? student.attendance.afternoon :
                                                             student.attendance.morning && student.attendance.afternoon) === true ?
                                                            'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500' :
                                                            'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                                        }`}
                                                        onClick={() => handleAttendanceClick(student._id, true)}
                                                    >
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Present
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={`h-9 ${
                                                            (activeSession === 'morning' ? student.attendance.morning :
                                                             activeSession === 'afternoon' ? student.attendance.afternoon :
                                                             student.attendance.morning === false && student.attendance.afternoon === false) === false ?
                                                            'bg-rose-500 text-white hover:bg-rose-600 border-rose-500' :
                                                            'border-rose-200 text-rose-600 hover:bg-rose-50'
                                                        }`}
                                                        onClick={() => handleAttendanceClick(student._id, false)}
                                                    >
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Absent
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Additional Info */}
                                            <div className="pt-2 border-t border-slate-100">
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>ID: {student.admissionNumber.split('-').pop()}</span>
                                                    {student.attendanceScore !== undefined && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            Score: {student.attendanceScore}%
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* List View */
                        <div className="space-y-3">
                            {filteredStudents.map((student) => {
                                const isMorningLocked = student.attendance.morningFrozen || isHoliday;
                                const isAfternoonLocked = student.attendance.afternoonFrozen || isHoliday;
                                const isLocked = activeSession === 'morning' ? isMorningLocked :
                                               activeSession === 'afternoon' ? isAfternoonLocked :
                                               isMorningLocked && isAfternoonLocked;

                                return (
                                    <div
                                        key={student._id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                                    {student.student.firstName[0]}{student.student.lastName[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="font-semibold">
                                                    {student.student.firstName} {student.student.lastName}
                                                </h4>
                                                <p className="text-sm text-slate-500">
                                                    {student.class.className} - {student.class.section} • ID: {student.admissionNumber.split('-').pop()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Attendance Status Display */}
                                            <div className="flex items-center gap-4">
                                                {activeSession === 'full-day' && (
                                                    <>
                                                        <div className="text-center">
                                                            <div className="text-sm font-medium text-slate-600">Morning</div>
                                                            <div className={`text-sm font-bold ${
                                                                student.attendance.morning === true ? 'text-emerald-600' :
                                                                student.attendance.morning === false ? 'text-rose-600' :
                                                                'text-amber-600'
                                                            }`}>
                                                                {student.attendance.morning === null ? 'Pending' :
                                                                 student.attendance.morning ? 'Present' : 'Absent'}
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-sm font-medium text-slate-600">Afternoon</div>
                                                            <div className={`text-sm font-bold ${
                                                                student.attendance.afternoon === true ? 'text-emerald-600' :
                                                                student.attendance.afternoon === false ? 'text-rose-600' :
                                                                'text-amber-600'
                                                            }`}>
                                                                {student.attendance.afternoon === null ? 'Pending' :
                                                                 student.attendance.afternoon ? 'Present' : 'Absent'}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                                
                                                {(activeSession === 'morning' || activeSession === 'afternoon') && (
                                                    <div className="text-center">
                                                        <div className="text-sm font-medium text-slate-600 capitalize">{activeSession}</div>
                                                        <div className={`text-lg font-bold ${
                                                            (activeSession === 'morning' ? student.attendance.morning :
                                                             student.attendance.afternoon) === true ? 'text-emerald-600' :
                                                            (activeSession === 'morning' ? student.attendance.morning :
                                                             student.attendance.afternoon) === false ? 'text-rose-600' :
                                                            'text-amber-600'
                                                        }`}>
                                                            {(
                                                                activeSession === 'morning' ? student.attendance.morning :
                                                                student.attendance.afternoon
                                                            ) === null ? 'Pending' : (
                                                                activeSession === 'morning' ? student.attendance.morning :
                                                                student.attendance.afternoon
                                                            ) ? 'Present' : 'Absent'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {!isLocked && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={`h-8 w-20 ${
                                                            (activeSession === 'morning' ? student.attendance.morning :
                                                             activeSession === 'afternoon' ? student.attendance.afternoon :
                                                             student.attendance.morning && student.attendance.afternoon) === true ?
                                                            'bg-emerald-500 text-white border-emerald-500' :
                                                            'border-emerald-200 text-emerald-600'
                                                        }`}
                                                        onClick={() => handleAttendanceClick(student._id, true)}
                                                    >
                                                        Present
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={`h-8 w-20 ${
                                                            (activeSession === 'morning' ? student.attendance.morning :
                                                             activeSession === 'afternoon' ? student.attendance.afternoon :
                                                             student.attendance.morning === false && student.attendance.afternoon === false) === false ?
                                                            'bg-rose-500 text-white border-rose-500' :
                                                            'border-rose-200 text-rose-600'
                                                        }`}
                                                        onClick={() => handleAttendanceClick(student._id, false)}
                                                    >
                                                        Absent
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Lock Indicator */}
                                            {isLocked && (
                                                <Lock className="h-4 w-4 text-slate-400" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={resetAllAttendance}
                        disabled={isHoliday}
                        className="text-slate-600"
                    >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset All
                    </Button>
                    
                    <div className="text-sm text-slate-500">
                        <span className="font-medium">Tip:</span> Use Present/Absent buttons to mark attendance quickly
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                        Auto-save: {autoSave ? 'ON' : 'OFF'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        Session: {activeSession.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* Holiday Declaration Modal */}
            <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-rose-600" />
                            Declare School Holiday
                        </DialogTitle>
                        <DialogDescription>
                            Mark {format(parseISO(selectedDate), 'MMMM dd, yyyy')} as a non-working day.
                            This will lock attendance for all students.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="holiday-reason">Holiday Reason *</Label>
                            <Textarea
                                id="holiday-reason"
                                placeholder="e.g., Christmas Day, Summer Break, National Holiday..."
                                value={holidayNote}
                                onChange={(e) => setHolidayNote(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <p className="text-xs text-slate-500">
                                Provide a clear reason for the holiday declaration
                            </p>
                        </div>
                        
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                            <div className="flex items-start gap-3">
                                <Bell className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">
                                        Important Notice
                                    </p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Once declared as a holiday, attendance for this date cannot be modified.
                                        This action affects all classes and sections.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsHolidayModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleMarkAsHoliday}
                            className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700"
                        >
                            Confirm Holiday
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Date Range Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Export Attendance Data</DialogTitle>
                        <DialogDescription>
                            Select the date range for exporting attendance records
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <Label>Date Range</Label>
                            <RadioGroup value={dateRangeType} onValueChange={(value: any) => setDateRangeType(value)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="single" id="single" />
                                    <Label htmlFor="single" className="font-normal cursor-pointer">
                                        Current Date ({format(parseISO(selectedDate), 'MMM dd, yyyy')})
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="week" id="week" />
                                    <Label htmlFor="week" className="font-normal cursor-pointer">
                                        This Week (Last 7 days)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="month" id="month" />
                                    <Label htmlFor="month" className="font-normal cursor-pointer">
                                        This Month (Last 30 days)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="6months" id="6months" />
                                    <Label htmlFor="6months" className="font-normal cursor-pointer">
                                        Last 6 Months
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="year" id="year" />
                                    <Label htmlFor="year" className="font-normal cursor-pointer">
                                        This Year (Last 365 days)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="custom" id="custom" />
                                    <Label htmlFor="custom" className="font-normal cursor-pointer">
                                        Custom Date Range
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {dateRangeType === 'custom' && (
                            <div className="space-y-4 pl-6">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Start Date</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        max={todayStr}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date">End Date</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        min={customStartDate}
                                        max={todayStr}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">
                                        Export Information
                                    </p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        {exportType === 'csv' && 'Attendance data will be exported as a CSV file with detailed records for each date.'}
                                        {exportType === 'pdf' && 'Attendance data will be formatted for PDF printing with summary statistics.'}
                                        {exportType === 'print' && 'Attendance data will be formatted for direct printing.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setExportDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExportWithDateRange}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}