import { useState, useMemo, useEffect, useCallback } from 'react';
import { StudentsService } from '../Services/students.service'; 
import { attendanceApi } from '../services/attendanceApi'; 
import { Student } from '../types/student';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    Users, UserCheck, UserX, Clock, Save, Search, Sun, Moon,
    Loader2, MoreVertical, Edit2, Lock, RotateCcw, HelpCircle, Eye
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useToast } from '@/components/ui/use-toast';

// --- CONFIG ---
const classDropdownValues = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const sectionValues = ['A', 'B', 'C', 'D'];

interface AttendanceState {
    morning: boolean | null;
    afternoon: boolean | null;
    morningFrozen: boolean;   // Lock status for Morning
    afternoonFrozen: boolean; // Lock status for Afternoon
}

type StudentWithAttendance = Omit<Student, 'attendance'> & {
    attendance: AttendanceState;
};

export default function Attendance() {
    const { toast } = useToast();
    const todayStr = new Date().toISOString().split('T')[0];

    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    // Track which statuses are "ticked"
const [statusFilters, setStatusFilters] = useState({
  present: false,
  absent: false,
  notSelected: false
});
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [displayedStudents, setDisplayedStudents] = useState<StudentWithAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [targetSession, setTargetSession] = useState<'morning' | 'afternoon'>('morning');

    // 1. Load Initial Data
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await StudentsService.getAll();
                setAllStudents(data);
            } catch (error) {
                toast({ variant: "destructive", title: "Load Failed" });
            } finally { setLoading(false); }
        };
        load();
    }, [toast]);

    // 2. Sync Logic - Handles separate locking for each session
    const syncAttendanceData = useCallback(async () => {
        if (allStudents.length === 0) return;
        setLoading(true);
        try {
            const records = await attendanceApi.getRecords(selectedClass, selectedSection, selectedDate);
            const attendanceMap: Record<string, any> = {};
            if (Array.isArray(records)) {
                records.forEach((r: any) => {
                    const id = r.studentId || r._id;
                    attendanceMap[id.toString()] = r;
                });
            }

            const merged = allStudents
                .filter(s => (selectedClass === 'all' || s.class.className.includes(selectedClass)) && (selectedSection === 'all' || s.class.section === selectedSection))
                .map(student => {
                    const record = attendanceMap[student._id];
                    const parse = (v: any) => (v === "true" || v === true) ? true : (v === "false" || v === false ? false : null);
                    
                    // Logic: A session is frozen ONLY if it has a saved value (true or false) in the DB
                    const mVal = record?.sessions?.morning;
                    const aVal = record?.sessions?.afternoon;

                    return {
                        ...student,
                        attendance: {
                            morning: parse(mVal),
                            afternoon: parse(aVal),
                            morningFrozen: mVal !== undefined && mVal !== null,
                            afternoonFrozen: aVal !== undefined && aVal !== null,
                        }
                    };
                });
            setDisplayedStudents(merged);
        } catch (error) {
            console.error(error);
        } finally { setLoading(false); }
    }, [allStudents, selectedClass, selectedSection, selectedDate]);

    useEffect(() => { syncAttendanceData(); }, [syncAttendanceData]);

    // 3. Stats Calculation
    const stats = useMemo(() => {
        const total = displayedStudents.length;
        if (total === 0) return { total: 0, fullDay: 0, halfDay: 0, absent: 0, noResponse: 0, presentPct: 0, absentPct: 0 };
        
        let fullDay = 0, halfDay = 0, absent = 0, noResponse = 0;

        displayedStudents.forEach(s => {
            const m = s.attendance.morning;
            const a = s.attendance.afternoon;
            const currentVal = targetSession === 'morning' ? m : a;

            if (currentVal === null) noResponse++;
            if (m === true && a === true) fullDay++;
            else if (m === false && a === false) absent++;
            else if (m !== null || a !== null) halfDay++;
        });

        return {
            total, fullDay, halfDay, absent, noResponse,
            presentPct: Math.round(((fullDay + halfDay) / total) * 100) || 0,
            absentPct: Math.round((absent / total) * 100) || 0
        };
    }, [displayedStudents, targetSession]);

    // 4. Handlers
    const resetAllUnlocked = () => {
        setDisplayedStudents(prev => prev.map(s => {
            const isLocked = targetSession === 'morning' ? s.attendance.morningFrozen : s.attendance.afternoonFrozen;
            return isLocked ? s : { ...s, attendance: { ...s.attendance, [targetSession]: null } };
        }));
    };

    const resetIndividual = (id: string) => {
        setDisplayedStudents(prev => prev.map(s => {
            const isLocked = targetSession === 'morning' ? s.attendance.morningFrozen : s.attendance.afternoonFrozen;
            return (s._id === id && !isLocked) 
                ? { ...s, attendance: { ...s.attendance, [targetSession]: null } } 
                : s;
        }));
    };

    const markAllVisible = (isPresent: boolean) => {
        setDisplayedStudents(prev => prev.map(s => {
            const isLocked = targetSession === 'morning' ? s.attendance.morningFrozen : s.attendance.afternoonFrozen;
            return isLocked ? s : { ...s, attendance: { ...s.attendance, [targetSession]: isPresent } };
        }));
    };

    const handleEditToggle = (id: string) => {
        setDisplayedStudents(prev => prev.map(s => 
            s._id === id ? { 
                ...s, 
                attendance: { 
                    ...s.attendance, 
                    [targetSession + 'Frozen']: false // Only unlock the session we are looking at
                } 
            } : s
        ));
    };

    const setStatus = (id: string, val: boolean) => {
        setDisplayedStudents(prev => prev.map(s => {
            const isLocked = targetSession === 'morning' ? s.attendance.morningFrozen : s.attendance.afternoonFrozen;
            return (s._id === id && !isLocked) 
                ? { ...s, attendance: { ...s.attendance, [targetSession]: val } } 
                : s;
        }));
    };

    const handleSave = async () => {
        // Only get students where the current viewed session has a mark
        const marked = displayedStudents.filter(s => s.attendance[targetSession] !== null);
        
        if (marked.length === 0) {
            toast({ title: "No changes", description: `Please mark ${targetSession} first.` });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                date: selectedDate,
                className: selectedClass,
                section: selectedSection,
                attendance: marked.map(s => {
                    const obj: any = { studentId: s._id };
                    // Only send the field for the session we are currently marking
                    if (targetSession === 'morning') obj.morning = String(s.attendance.morning);
                    else obj.afternoon = String(s.attendance.afternoon);
                    return obj;
                })
            };
            await attendanceApi.markAttendance(payload);
            toast({ title: "Saved Successfully" });
            await syncAttendanceData();
        } catch (err) {
            toast({ variant: "destructive", title: "Error Saving" });
        } finally { setSaving(false); }
    };
    const filteredList = useMemo(() => {
      return displayedStudents.filter(s => {
          // 1. Search Match
          const nameMatch = `${s.student.firstName} ${s.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
          
          // 2. Status Match
          const currentVal = targetSession === 'morning' ? s.attendance.morning : s.attendance.afternoon;
          
          // If nothing is ticked, show everyone
          const noFilterSelected = !statusFilters.present && !statusFilters.absent && !statusFilters.notSelected;
          if (noFilterSelected) return nameMatch;
  
          // Check if current student matches any ticked box
          const isPresentMatch = statusFilters.present && currentVal === true;
          const isAbsentMatch = statusFilters.absent && currentVal === false;
          const isNotSelectedMatch = statusFilters.notSelected && currentVal === null;
  
          return nameMatch && (isPresentMatch || isAbsentMatch || isNotSelectedMatch);
      });
  }, [displayedStudents, searchQuery, statusFilters, targetSession]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Attendance Management</h1>
                    <p className="text-muted-foreground text-sm">Track presence for FN and AF separately</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    Save {targetSession === 'morning' ? 'FN' : 'AF'} Attendance
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input type="date" max={todayStr} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classDropdownValues.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sections</SelectItem>
                            {sectionValues.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input className="pl-10" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                <StatCard title="Total Found" value={stats.total} subtitle="Filtered" icon={Users} variant="primary" />
                <StatCard title="Full Day" value={stats.fullDay} subtitle={`${stats.presentPct}%`} icon={UserCheck} variant="success" />
                <StatCard title="Half Day" value={stats.halfDay} subtitle="Partial" icon={Clock} variant="warning" />
                <StatCard title="Absent" value={stats.absent} subtitle={`${stats.absentPct}%`} icon={UserX} variant="danger" />
                <StatCard title="Not Responded" value={stats.noResponse} subtitle={`Pending ${targetSession === 'morning' ? 'FN' : 'AF'}`} icon={HelpCircle} variant="default" />
            </div>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-col md:flex-row items-center justify-between border-b bg-slate-50/50 py-3 gap-4">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-md font-bold">Marking: {targetSession === 'morning' ? 'FN (Morning)' : 'AF (Afternoon)'}</CardTitle>
                        <div className="flex border rounded-lg p-1 bg-white">
                            <Button variant={targetSession === 'morning' ? 'default' : 'ghost'} size="sm" onClick={() => setTargetSession('morning')} className="h-7 text-[10px] px-4">FN</Button>
                            <Button variant={targetSession === 'afternoon' ? 'default' : 'ghost'} size="sm" onClick={() => setTargetSession('afternoon')} className="h-7 text-[10px] px-4">AF</Button>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-2 col-span-1 md:col-span-4 border-t pt-4 mt-2">
    <label className="text-[11px] font-bold uppercase text-muted-foreground">Quick Filters</label>
    <div className="flex gap-6 items-center">
        {/* Who are Present */}
        <label className="flex items-center gap-2 cursor-pointer group">
            <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                checked={statusFilters.present}
                onChange={(e) => setStatusFilters({...statusFilters, present: e.target.checked})}
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-600 transition-colors">Who are present</span>
        </label>

        {/* Who are Absent */}
        <label className="flex items-center gap-2 cursor-pointer group">
            <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={statusFilters.absent}
                onChange={(e) => setStatusFilters({...statusFilters, absent: e.target.checked})}
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-rose-600 transition-colors">Who are absent</span>
        </label>

        {/* Not Selected */}
        <label className="flex items-center gap-2 cursor-pointer group">
            <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                checked={statusFilters.notSelected}
                onChange={(e) => setStatusFilters({...statusFilters, notSelected: e.target.checked})}
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-amber-600 transition-colors">Not selected</span>
        </label>

        {/* Clear All Link */}
        {(statusFilters.present || statusFilters.absent || statusFilters.notSelected) && (
            <button 
                onClick={() => setStatusFilters({present: false, absent: false, notSelected: false})}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase underline underline-offset-4"
            >
                Clear Ticks
            </button>
        )}
    </div>
</div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => markAllVisible(true)} className="text-emerald-600 text-[10px] font-bold">MARK ALL PRESENT</Button>
                        <Button variant="outline" size="sm" onClick={() => markAllVisible(false)} className="text-rose-600 text-[10px] font-bold">MARK ALL ABSENT</Button>
                        <Button variant="outline" size="sm" onClick={resetAllUnlocked} className="text-slate-600 text-[10px] font-bold uppercase flex gap-1 items-center">
                            <RotateCcw className="h-3 w-3"/> Reset All
                        </Button>
                    </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredList.map(student => {
                            const currentVal = targetSession === 'morning' ? student.attendance.morning : student.attendance.afternoon;
                            const isLocked = targetSession === 'morning' ? student.attendance.morningFrozen : student.attendance.afternoonFrozen;
                            const isNotResponded = currentVal === null;

                            return (
                                <div key={student._id} className={`p-4 rounded-xl border relative transition-all duration-200
                                    ${isLocked ? 'bg-slate-50 opacity-80' : 'bg-white shadow-sm hover:shadow-md'}
                                    ${isNotResponded ? 'bg-amber-50/50 border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'} 
                                `}>
                                    <div className="absolute top-2 right-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditToggle(student._id)} className="text-blue-600 font-bold"><Edit2 className="mr-2 h-4 w-4" /> Edit {targetSession === 'morning' ? 'FN' : 'AF'}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => resetIndividual(student._id)} disabled={isLocked} className="text-amber-600 font-bold"><RotateCcw className="mr-2 h-4 w-4" /> Reset Attend.</DropdownMenuItem>
                                                <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex items-center gap-3 mb-4">
                                        <Avatar className="h-10 w-10 border shadow-sm">
                                            <AvatarFallback className="bg-primary/5 text-primary font-bold uppercase">{student.student.firstName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold truncate leading-none text-slate-800">{student.student.firstName} {student.student.lastName}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-tight">Sec {student.class.section} | ID: {student.admissionNumber.split('-').pop()}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                                        <Button 
                                            size="sm" disabled={isLocked}
                                            variant={currentVal === true ? 'default' : 'outline'}
                                            className={`flex-1 h-8 text-[10px] font-bold ${currentVal === true ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                                            onClick={() => setStatus(student._id, true)}
                                        >
                                            {isLocked && currentVal === true && <Lock className="mr-1 h-3 w-3" />}
                                            PRESENT
                                        </Button>
                                        <Button 
                                            size="sm" disabled={isLocked}
                                            variant={currentVal === false ? 'default' : 'outline'}
                                            className={`flex-1 h-8 text-[10px] font-bold ${currentVal === false ? 'bg-rose-500 hover:bg-rose-600' : ''}`}
                                            onClick={() => setStatus(student._id, false)}
                                        >
                                            {isLocked && currentVal === false && <Lock className="mr-1 h-3 w-3" />}
                                            ABSENT
                                        </Button>
                                    </div>
                                    {isLocked && <div className="text-[8px] text-center mt-2 font-bold text-slate-400 uppercase tracking-widest">{targetSession === 'morning' ? 'FN' : 'AF'} Locked</div>}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}