// Students.tsx (Updated with Edit Student functionality using the same modal)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StudentsService } from '../Services/students.service'; // Adjust path as needed (match folder casing)
import { Student, StudentCreatePayload } from '../types/student'; // Adjust path as needed
// Note: Assuming you have a useToast hook setup
// import { useToast } from '@/components/ui/use-toast'; 
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Search, Plus, Filter, Download, MoreVertical, Eye, Edit, Trash2, Bus, CreditCard, UserCheck,
    User, MapPin, Printer, FileText, Loader2, RefreshCw, XCircle, CheckCircle
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

// --- Static Data ---
// Map the display class names (1, 2, 3...) to the full backend string (1st Class, 2nd Class...)
const classNumberMap: { [key: string]: string } = {
    'LKG': 'LKG', 'UKG': 'UKG',
    '1': '1st Class', '2': '2nd Class', '3': '3rd Class', '4': '4th Class', '5': '5th Class',
    '6': '6th Class', '7': '7th Class', '8': '8th Class', '9': '9th Class', '10': '10th Class'
};
// Use the required list for the Class Dropdown (LKG, UKG, 1, 2, 3...)
const classDropdownValues: string[] = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const sectionValues: string[] = ['A', 'B', 'C', 'D']; // Section Dropdown values

// --- FEE CONFIGURATION (matches backend script) ---
const feeConfig: Record<string, { baseFee: number; transportFee: number; activityFee: number; examFee: number; otherFees: number }> = {
    "10th Class": { baseFee: 50000, transportFee: 25000, activityFee: 5000, examFee: 3000, otherFees: 2000 },
    "11th Class": { baseFee: 55000, transportFee: 25000, activityFee: 5500, examFee: 3500, otherFees: 2500 },
    "12th Class": { baseFee: 60000, transportFee: 25000, activityFee: 6000, examFee: 4000, otherFees: 3000 },
    "LKG": { baseFee: 20000, transportFee: 20000, activityFee: 3000, examFee: 1000, otherFees: 1000 },
    "UKG": { baseFee: 22000, transportFee: 20000, activityFee: 3500, examFee: 1500, otherFees: 1500 },
    "1st Class": { baseFee: 25000, transportFee: 22000, activityFee: 4000, examFee: 2000, otherFees: 2000 },
    "2nd Class": { baseFee: 27000, transportFee: 22000, activityFee: 4000, examFee: 2000, otherFees: 2000 },
    "3rd Class": { baseFee: 29000, transportFee: 23000, activityFee: 4500, examFee: 2500, otherFees: 2000 },
    "4th Class": { baseFee: 31000, transportFee: 23000, activityFee: 4500, examFee: 2500, otherFees: 2000 },
    "5th Class": { baseFee: 33000, transportFee: 24000, activityFee: 4500, examFee: 2500, otherFees: 2000 },
    "6th Class": { baseFee: 35000, transportFee: 24000, activityFee: 5000, examFee: 3000, otherFees: 2000 },
    "7th Class": { baseFee: 38000, transportFee: 24000, activityFee: 5000, examFee: 3000, otherFees: 2000 },
    "8th Class": { baseFee: 42000, transportFee: 25000, activityFee: 5000, examFee: 3000, otherFees: 2000 },
    "9th Class": { baseFee: 46000, transportFee: 25000, activityFee: 5000, examFee: 3000, otherFees: 2000 },
};

const statusStyles = {
    active: 'bg-success/10 text-success border-success/20',
    'at-risk': 'bg-destructive/10 text-destructive border-destructive/20',
    inactive: 'bg-muted text-muted-foreground',
};

// --- CORE EXPORT/PRINT FUNCTIONS ---
const exportToCSV = (data: Student[], fileName: string) => {
    const headers = [
        'ID', 'Admission No', 'Name', 'Roll No', 'Class', 'Section', 'Father Name',
        'Attendance (%)', 'Fee Balance', 'Transport', 'Status'
    ];

    const csvRows = data.map(student => {
        const feeDisplay = getFeeBalanceDisplay(student);

        return [
            student._id,
            student.admissionNumber,
            `${student.student.firstName} ${student.student.lastName}`,
            'N/A',
            student.class.className,
            student.class.section,
            student.parents.father.name,
            student.attendance,
            feeDisplay.amount ?? feeDisplay.label,
            normalizeTransportValue(student.transport) === 'yes' ? 'Enrolled' : 'Not Enrolled',
            student.status
        ].map(item => `"${String(item).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName + ".csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Print function that builds HTML directly from student data
const printStudentData = (students: Student[], title: string) => {
    if (!students || students.length === 0) {
        toast.error('No data to print', {
            description: 'Please ensure students are loaded before printing'
        });
        return;
    }

    console.log('Printing', students.length, 'students');

    // Build table rows from data
    const tableRows = students.map((student, index) => {
        const feeDisplay = getFeeBalanceDisplay(student);
        const statusColor = student.status === 'active' ? '#22c55e' : student.status === 'inactive' ? '#ef4444' : '#f59e0b';
        const transportStatus = normalizeTransportValue(student.transport) === 'yes' ? 'Enrolled' : 'Not Enrolled';
        
        return `<tr>
            <td style="border:1px solid #333;padding:4px 6px;">${index + 1}</td>
            <td style="border:1px solid #333;padding:4px 6px;">${student.admissionNumber || '-'}</td>
            <td style="border:1px solid #333;padding:4px 6px;">${student.student.firstName || ''} ${student.student.lastName || ''}</td>
            <td style="border:1px solid #333;padding:4px 6px;">${student.class.className || '-'}</td>
            <td style="border:1px solid #333;padding:4px 6px;">${student.class.section || '-'}</td>
            <td style="border:1px solid #333;padding:4px 6px;">${student.parents?.father?.name || '-'}</td>
            <td style="border:1px solid #333;padding:4px 6px;">${student.parents?.father?.phone || '-'}</td>
            <td style="border:1px solid #333;padding:4px 6px;">${student.attendance ?? '-'}%</td>
            <td style="border:1px solid #333;padding:4px 6px;">${feeDisplay.amount !== null ? 'Rs. ' + feeDisplay.amount.toLocaleString('en-IN') : feeDisplay.label}</td>
            <td style="border:1px solid #333;padding:4px 6px;">${transportStatus}</td>
            <td style="border:1px solid #333;padding:4px 6px;color:${statusColor};font-weight:bold;">${student.status}</td>
        </tr>`;
    }).join('');

    // Open new window for printing
    const printWin = window.open('', '_blank', 'width=1400,height=900');
    if (!printWin) {
        toast.error('Pop-up blocked', { description: 'Please allow pop-ups to print' });
        return;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
<style>
@page { size: landscape; margin: 10mm; }
body { font-family: Arial, sans-serif; margin: 0; padding: 15px; font-size: 10px; color: #000; }
h1 { text-align: center; margin: 0 0 8px 0; font-size: 18px; }
.info { font-size: 10px; color: #555; margin-bottom: 10px; display: flex; justify-content: space-between; }
table { width: 100%; border-collapse: collapse; }
th { background: #eee; font-weight: bold; padding: 5px 6px; border: 1px solid #333; font-size: 10px; text-align: left; }
td { border: 1px solid #333; padding: 4px 6px; font-size: 9px; }
tr:nth-child(even) { background: #f9f9f9; }
</style>
</head>
<body>
<h1>${title}</h1>
<div class="info"><span>Printed: ${new Date().toLocaleString('en-IN')}</span><span>Total Students: ${students.length}</span></div>
<table>
<thead><tr>
<th style="width:30px">#</th><th style="width:90px">Admission No</th><th>Name</th><th style="width:65px">Class</th><th style="width:50px">Section</th><th>Father Name</th><th style="width:85px">Phone</th><th style="width:65px">Attendance</th><th style="width:75px">Fee Balance</th><th style="width:65px">Transport</th><th style="width:55px">Status</th>
</tr></thead>
<tbody>
${tableRows}
</tbody>
</table>
</body>
</html>`;

    // Write to new window
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();

    // Wait for content to fully render then print
    setTimeout(() => {
        try {
            printWin.focus();
            printWin.print();
        } catch (e) {
            console.error('Print error:', e);
        }
    }, 1000);
};


// Helper to convert ISO date to yyyy-MM-dd format for HTML date input
const formatDateForInput = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0]; // Returns yyyy-MM-dd
    } catch {
        return '';
    }
};

// Helper to convert yyyy-MM-dd back to ISO format for API
const formatDateForAPI = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString + 'T00:00:00.000Z');
        if (isNaN(date.getTime())) return '';
        return date.toISOString();
    } catch {
        return '';
    }
};

const normalizeTransportValue = (value: unknown): 'yes' | 'no' => {
    if (typeof value === 'boolean') {
        return value ? 'yes' : 'no';
    }

    if (typeof value === 'number') {
        return value > 0 ? 'yes' : 'no';
    }

    const text = typeof value === 'string' ? value.toLowerCase().trim() : '';

    // If empty string or null/undefined, default to 'no'
    if (!text || value === null || value === undefined) {
        return 'no';
    }

    // Check for explicit "yes" values
    if (['yes', 'y', 'true', '1', 'active', 'enabled', 'enrolled'].includes(text)) {
        return 'yes';
    }

    // Check for explicit "no" values
    if (['no', 'n', 'false', '0', 'inactive', 'disabled', 'na', 'n/a', 'not enrolled', 'not opted'].includes(text)) {
        return 'no';
    }

    // Default to 'no' for any other value (safer default)
    console.warn('⚠️ Unknown transport value normalized to "no":', value);
    return 'no';
};


const getStudentDisplayName = (student: Student) => {
    return [student?.student?.firstName, student?.student?.lastName]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
        .join(' ')
        .trim() || 'Unnamed Student';
};

const getStudentInitials = (student: Student) => {
    const parts = [student?.student?.firstName, student?.student?.lastName]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0);

    if (parts.length === 0) return 'ST';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getFeeBalanceDisplay = (student: Student) => {
    if (typeof student.feeBalance !== 'number' || Number.isNaN(student.feeBalance)) {
        return {
            amount: null as number | null,
            label: 'Not Assigned',
        };
    }

    return {
        amount: student.feeBalance,
        label: student.feeBalance === 0 ? 'Paid' : 'Due',
    };
};

// --- Default Form State Creator ---
const createDefaultFormData = () => ({
    _id: undefined as string | undefined, // Added for edit mode identification
    firstName: '', lastName: '', gender: 'Male', dob: '',
    className: '10th Class', section: 'A', // Use full class name for internal state
    fatherName: '', fatherPhone: '', fatherEmail: '', fatherOccupation: '',
    motherName: '', motherPhone: '', motherEmail: '', motherOccupation: '',
    street: '', city: '', state: '', pincode: '',
    admissionNumber: '', // Added for display/update if needed
    transport: 'no' as 'yes' | 'no', // Transport opted flag
    password: 'Student@123', // Default password for new students
    confirmPassword: 'Student@123', // Confirm password field
});

// Helper to map Student object to Form Data structure
const mapStudentToFormData = (student: Student) => ({
    _id: student._id,
    firstName: student.student.firstName,
    lastName: student.student.lastName,
    gender: ((student as any).student?.gender ?? (student as any).gender ?? 'Male'),
    dob: formatDateForInput(student.student.dob), // Convert ISO to yyyy-MM-dd
    className: student.class.className,
    section: student.class.section,
    fatherName: student.parents.father.name,
    fatherPhone: student.parents.father.phone,
    fatherEmail: student.parents.father.email,
    password: '', // Don't prefill password in edit mode
    confirmPassword: '', // Don't prefill confirm password in edit mode
    fatherOccupation: student.parents.father.occupation,
    motherName: student.parents.mother.name,
    motherPhone: student.parents.mother.phone,
    motherEmail: student.parents.mother.email,
    motherOccupation: student.parents.mother.occupation,
    street: student.address.street,
    city: student.address.city,
    state: student.address.state,
    pincode: student.address.pincode,
    admissionNumber: student.admissionNumber,
    transport: normalizeTransportValue(student.transport),
});

// --- Function to create fee structure for a student ---
const createFeeStructure = async (student: Student, transport: 'yes' | 'no', feeBreakdown?: any) => {
    try {
        const className = student.class.className;
        const config = feeConfig[className] || feeConfig['10th Class'];
        
        // Use provided fee breakdown if available (for custom fees), otherwise use default config
        let baseFee, activityFee, examFee, otherFees, transportFeeAmount, totalFee;
        
        if (feeBreakdown) {
            // Use custom fees from the breakdown
            baseFee = feeBreakdown.baseFee;
            activityFee = feeBreakdown.activityFee;
            examFee = feeBreakdown.examFee;
            otherFees = feeBreakdown.otherFees;
            transportFeeAmount = feeBreakdown.transportFee;
            totalFee = feeBreakdown.totalFee;
        } else {
            // Use default config
            baseFee = config.baseFee;
            activityFee = config.activityFee;
            examFee = config.examFee;
            otherFees = config.otherFees;
            transportFeeAmount = transport === 'yes' ? config.transportFee : 0;
            totalFee = baseFee + transportFeeAmount + activityFee + examFee + otherFees;
        }
        
        // Prepare fee structure payload
        const feeStructurePayload = {
            admissionNumber: student.admissionNumber,
            studentId: student._id,
            studentName: `${student.student.firstName} ${student.student.lastName}`.trim(),
            className: student.class.className,
            section: student.class.section,
            academicYear: student.class.academicYear || '2025-2026',
            transportOpted: transport === 'yes',
            transportFee: transportFeeAmount,
            totalFee: totalFee,
            totalPaid: 0,
            totalDue: totalFee,
            feeComponents: [
                {
                    componentName: 'Base Fee',
                    amount: baseFee,
                    dueDate: new Date(new Date().getFullYear(), 5, 30).toISOString(),
                    isMandatory: true,
                    isRecurring: true,
                    frequency: 'yearly',
                    status: 'pending',
                    paidAmount: 0
                },
                {
                    componentName: 'Activity Fee',
                    amount: activityFee,
                    dueDate: new Date(new Date().getFullYear(), 5, 30).toISOString(),
                    isMandatory: true,
                    isRecurring: true,
                    frequency: 'yearly',
                    status: 'pending',
                    paidAmount: 0
                },
                {
                    componentName: 'Exam Fee',
                    amount: examFee,
                    dueDate: new Date(new Date().getFullYear(), 5, 30).toISOString(),
                    isMandatory: true,
                    isRecurring: true,
                    frequency: 'yearly',
                    status: 'pending',
                    paidAmount: 0
                },
                {
                    componentName: 'Other Fees',
                    amount: otherFees,
                    dueDate: new Date(new Date().getFullYear(), 5, 30).toISOString(),
                    isMandatory: false,
                    isRecurring: false,
                    frequency: 'one-time',
                    status: 'pending',
                    paidAmount: 0
                }
            ]
        };
        
        // Add transport fee component if opted
        if (transport === 'yes') {
            feeStructurePayload.feeComponents.push({
                componentName: 'Transport Fee',
                amount: transportFeeAmount,
                dueDate: new Date(new Date().getFullYear(), 5, 30).toISOString(),
                isMandatory: false,
                isRecurring: true,
                frequency: 'yearly',
                status: 'pending',
                paidAmount: 0
            });
        }
        
        // Make API call to create fee structure
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        
        // Construct the correct URL - remove duplicate /api if present
        const feeApiUrl = apiBaseUrl.endsWith('/api') 
            ? `${apiBaseUrl}/fees/structure` 
            : `${apiBaseUrl}/api/fees/structure`;
        
        const response = await fetch(feeApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(feeStructurePayload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create fee structure');
        }
        
        const result = await response.json();
        console.log('✅ Fee structure created:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Error creating fee structure:', error);
        throw error;
    }
};

// --- ADD/EDIT STUDENT MODAL COMPONENT (Re-used for both Add and Edit) ---
interface AddEditModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (isOpen: boolean) => void;
    initialStudent: Student | null;
    refreshStudents: () => void;
}

const AddEditStudentModal: React.FC<AddEditModalProps> = ({ 
    isModalOpen, 
    setIsModalOpen, 
    initialStudent, 
    refreshStudents 
}) => {
    
    const isEditMode = !!initialStudent;
    
    const [formData, setFormData] = useState(createDefaultFormData());
    const [passwordError, setPasswordError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feeError, setFeeError] = useState<string | null>(null);
    const [isEditingFees, setIsEditingFees] = useState(false);
    const [customFees, setCustomFees] = useState({
        baseFee: 0,
        activityFee: 0,
        examFee: 0,
        otherFees: 0,
        transportFee: 0
    });
    // Edit mode fee management states
    const [editModeFeeEnabled, setEditModeFeeEnabled] = useState(false);
    const [existingFeeStructure, setExistingFeeStructure] = useState<any>(null);
    const [editModeFees, setEditModeFees] = useState({
        baseFee: 0,
        activityFee: 0,
        examFee: 0,
        otherFees: 0,
        transportFee: 0
    });
    const [feeChangeReason, setFeeChangeReason] = useState('');
    const [feeChangeNotes, setFeeChangeNotes] = useState('');
    const [isSavingFees, setIsSavingFees] = useState(false);
    // const { toast } = useToast();
    
    // Calculate fee breakdown based on selected class and transport
    const calculateFeeBreakdown = useMemo(() => {
        const config = feeConfig[formData.className] || feeConfig['10th Class'];
        const transportFeeAmount = formData.transport === 'yes' ? config.transportFee : 0;
        
        // Use custom fees if in edit mode, otherwise use default config
        if (isEditingFees) {
            const totalFee = customFees.baseFee + customFees.activityFee + customFees.examFee + customFees.otherFees + customFees.transportFee;
            return {
                baseFee: customFees.baseFee,
                activityFee: customFees.activityFee,
                examFee: customFees.examFee,
                otherFees: customFees.otherFees,
                transportFee: customFees.transportFee,
                totalFee: totalFee
            };
        }
        
        const totalFee = config.baseFee + transportFeeAmount + config.activityFee + config.examFee + config.otherFees;
        return {
            baseFee: config.baseFee,
            activityFee: config.activityFee,
            examFee: config.examFee,
            otherFees: config.otherFees,
            transportFee: transportFeeAmount,
            totalFee: totalFee
        };
    }, [formData.className, formData.transport, isEditingFees, customFees]);

    // Effect to initialize/reset form data when modal opens or initialStudent changes
    useEffect(() => {
        if (isModalOpen) {
            if (initialStudent) {
                // Edit Mode: Load existing student data
                setFormData(mapStudentToFormData(initialStudent));
            } else {
                // Add Mode: Use default empty form
                const defaultData = createDefaultFormData();
                setFormData(defaultData);
                
                // Initialize custom fees with default values
                const config = feeConfig[defaultData.className] || feeConfig['10th Class'];
                setCustomFees({
                    baseFee: config.baseFee,
                    activityFee: config.activityFee,
                    examFee: config.examFee,
                    otherFees: config.otherFees,
                    transportFee: defaultData.transport === 'yes' ? config.transportFee : 0
                });
            }
            setFeeError(null); // Reset fee error
            setIsEditingFees(false); // Reset edit mode
        }
    }, [isModalOpen, initialStudent]);
    
    // Effect to fetch existing fee structure in edit mode
    useEffect(() => {
        const fetchFeeStructure = async () => {
            if (isEditMode && initialStudent && initialStudent.admissionNumber) {
                try {
                    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
                    const feeApiBase = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
                    
                    const response = await fetch(
                        `${feeApiBase}/fees/structure/${initialStudent._id}`, 
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                            setExistingFeeStructure(result.data);
                            // Initialize edit mode fees with existing values
                            const feeComponents = result.data.feeComponents || [];
                            setEditModeFees({
                                baseFee: feeComponents.find((c: any) => c.componentName === 'Base Fee')?.amount || 0,
                                activityFee: feeComponents.find((c: any) => c.componentName === 'Activity Fee')?.amount || 0,
                                examFee: feeComponents.find((c: any) => c.componentName === 'Exam Fee')?.amount || 0,
                                otherFees: feeComponents.find((c: any) => c.componentName === 'Other Fees')?.amount || 0,
                                transportFee: feeComponents.find((c: any) => c.componentName === 'Transport Fee')?.amount || 0,
                            });
                            console.log('✅ Fetched fee structure:', result.data);
                        }
                    } else {
                        // Fee structure not found - this is okay, student may not have fees yet
                        console.log('ℹ️ No fee structure found for student');
                        setExistingFeeStructure(null);
                    }
                } catch (error) {
                    console.error('Error fetching fee structure:', error);
                    setExistingFeeStructure(null);
                }
            }
        };
        
        if (isEditMode) {
            fetchFeeStructure();
        }
    }, [isEditMode, initialStudent]);
    
    // Effect to update custom fees when class or transport changes (only if not manually editing)
    useEffect(() => {
        if (!isEditingFees) {
            const config = feeConfig[formData.className] || feeConfig['10th Class'];
            setCustomFees({
                baseFee: config.baseFee,
                activityFee: config.activityFee,
                examFee: config.examFee,
                otherFees: config.otherFees,
                transportFee: formData.transport === 'yes' ? config.transportFee : 0
            });
        }
    }, [formData.className, formData.transport, isEditingFees]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear password error when user types
        if ((e.target.name === 'password' || e.target.name === 'confirmPassword') && passwordError) {
            setPasswordError('');
        }
    };

    const handleSelectChange = (key: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };
    
    const handleFeeChange = (feeType: keyof typeof customFees, value: string) => {
        const numValue = parseInt(value) || 0;
        setCustomFees(prev => ({ ...prev, [feeType]: numValue }));
    };
    
    const handleEditFeesToggle = () => {
        if (!isEditingFees) {
            // Entering edit mode - ensure custom fees are initialized
            const config = feeConfig[formData.className] || feeConfig['10th Class'];
            setCustomFees({
                baseFee: config.baseFee,
                activityFee: config.activityFee,
                examFee: config.examFee,
                otherFees: config.otherFees,
                transportFee: formData.transport === 'yes' ? config.transportFee : 0
            });
        }
        setIsEditingFees(!isEditingFees);
    };
    
    // Edit mode fee handlers
    const handleEditModeFeeChange = (feeType: keyof typeof editModeFees, value: string) => {
        const numValue = parseInt(value) || 0;
        setEditModeFees(prev => ({ ...prev, [feeType]: numValue }));
    };
    
    const handleEditModeFeeToggle = () => {
        if (!editModeFeeEnabled && existingFeeStructure) {
            // Initialize with existing fees
            const feeComponents = existingFeeStructure.feeComponents || [];
            setEditModeFees({
                baseFee: feeComponents.find((c: any) => c.componentName === 'Base Fee')?.amount || 0,
                activityFee: feeComponents.find((c: any) => c.componentName === 'Activity Fee')?.amount || 0,
                examFee: feeComponents.find((c: any) => c.componentName === 'Exam Fee')?.amount || 0,
                otherFees: feeComponents.find((c: any) => c.componentName === 'Other Fees')?.amount || 0,
                transportFee: feeComponents.find((c: any) => c.componentName === 'Transport Fee')?.amount || 0,
            });
        }
        setEditModeFeeEnabled(!editModeFeeEnabled);
        if (editModeFeeEnabled) {
            // Reset reason and notes when canceling
            setFeeChangeReason('');
            setFeeChangeNotes('');
        }
    };
    
    const handleSaveFeeChanges = async () => {
        if (!initialStudent?.admissionNumber) {
            setFeeError('Student admission number not found');
            return;
        }
        
        if (!feeChangeReason.trim()) {
            setFeeError('Please provide a reason for the fee change');
            return;
        }
        
        setIsSavingFees(true);
        setFeeError(null);
        
        try {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            const feeApiBase = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
            
            // Prepare fee components
            const feeComponents = [
                { componentName: 'Base Fee', amount: editModeFees.baseFee },
                { componentName: 'Activity Fee', amount: editModeFees.activityFee },
                { componentName: 'Exam Fee', amount: editModeFees.examFee },
                { componentName: 'Other Fees', amount: editModeFees.otherFees },
                { componentName: 'Transport Fee', amount: editModeFees.transportFee },
            ];
            
            const response = await fetch(
                `${feeApiBase}/fees/update-student-fees/${initialStudent.admissionNumber}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        feeComponents,
                        reason: feeChangeReason,
                        notes: feeChangeNotes,
                        actionType: 'update'
                    })
                }
            );
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to update fees');
            }
            
            console.log('✅ Fees updated successfully with audit trail');
            
            // Update local state
            setExistingFeeStructure(result.data.feeStructure);
            setEditModeFeeEnabled(false);
            setFeeChangeReason('');
            setFeeChangeNotes('');
            
            // Show success message
            const totalFeeChange = result.data?.changes?.totalFeeChange ?? 0;
            const componentsChanged = result.data?.changes?.componentsChanged ?? [];
            toast.success('Fee structure updated successfully', {
                description: `Total change: ₹${totalFeeChange.toLocaleString()} | Components: ${componentsChanged.length ? componentsChanged.join(', ') : 'None'} | Audit trail logged.`
            });
            
            // Refresh student list to show updated fee balance
            refreshStudents();
            
        } catch (error: any) {
            console.error('Error updating fees:', error);
            setFeeError(error.message || 'Failed to update fees');
        } finally {
            setIsSavingFees(false);
        }
    };
    
    // Helper to extract the core payload common to both POST and PUT
    // Always return a full StudentCreatePayload so both create and update calls receive the expected shape.
    const getPayload = (currentFormData: typeof formData): StudentCreatePayload => {
        // Map short class names (e.g., '10') to full names (e.g., '10th Class') for backend compatibility
        const mappedClassName = classNumberMap[currentFormData.className] || currentFormData.className;
        
        return {
            // Note: For Add (POST), we omit _id. For Edit (PUT), we still send the same payload shape.
            admissionNumber: currentFormData.admissionNumber || `ADM-${Date.now()}`,
            status: currentFormData._id ? 'active' : 'active', // Assuming we maintain 'active' status on creation/edit unless status field is added
            transport: currentFormData.transport, // Include transport
            // Note: Password is validated on frontend but NOT sent to backend
            // Backend auto-generates passwords: Student@123
            student: {
                firstName: currentFormData.firstName,
                lastName: currentFormData.lastName,
                gender: currentFormData.gender as 'Male' | 'Female' | 'Other',
                dob: formatDateForAPI(currentFormData.dob), // Convert yyyy-MM-dd back to ISO format
            },
            class: {
                className: mappedClassName, // Use mapped class name for backend compatibility
                section: currentFormData.section,
                academicYear: initialStudent?.class.academicYear || '2025-2026', // Keep existing year in edit mode or default
            },
            parents: {
                father: {
                    name: currentFormData.fatherName,
                    phone: currentFormData.fatherPhone,
                    email: currentFormData.fatherEmail,
                    occupation: currentFormData.fatherOccupation,
                },
                mother: {
                    name: currentFormData.motherName,
                    phone: currentFormData.motherPhone,
                    email: currentFormData.motherEmail,
                    occupation: currentFormData.motherOccupation,
                },
            },
            address: {
                street: currentFormData.street,
                city: currentFormData.city,
                state: currentFormData.state,
                pincode: currentFormData.pincode,
            },
        };
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setFeeError(null);

        // CRITICAL: Validate required fields
        const requiredFields = [
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
            { key: 'className', label: 'Class' },
            { key: 'section', label: 'Section' },
            { key: 'fatherName', label: 'Father Name' },
            { key: 'fatherPhone', label: 'Father Phone' },
        ];

        for (const field of requiredFields) {
            if (!formData[field.key as keyof typeof formData] || (formData[field.key as keyof typeof formData] as string).trim() === '') {
                toast.error('Validation Error', {
                    description: `${field.label} is required`
                });
                setIsSubmitting(false);
                return;
            }
        }

        // Validate phone format
        const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
        if (!phoneRegex.test(formData.fatherPhone)) {
            toast.error('Validation Error', {
                description: 'Please enter a valid phone number (10-15 digits)'
            });
            setIsSubmitting(false);
            return;
        }

        if (formData.motherPhone && !phoneRegex.test(formData.motherPhone)) {
            toast.error('Validation Error', {
                description: 'Please enter a valid mother phone number'
            });
            setIsSubmitting(false);
            return;
        }

        // Validate PIN code
        if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
            toast.error('Validation Error', {
                description: 'Please enter a valid 6-digit PIN code'
            });
            setIsSubmitting(false);
            return;
        }

        // Validate passwords for new students
        if (!isEditMode) {
            if (!formData.password || !formData.confirmPassword) {
                setPasswordError('Password fields are required');
                setIsSubmitting(false);
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setPasswordError('Passwords do not match');
                setIsSubmitting(false);
                return;
            }
            if (formData.password.length < 6) {
                setPasswordError('Password must be at least 6 characters');
                setIsSubmitting(false);
                return;
            }
        }
        
        const payload = getPayload(formData);
        
        try {
            if (isEditMode && formData._id) {
                // EDIT MODE: Call PUT
                await StudentsService.update(formData._id, payload as Partial<StudentCreatePayload>);
                console.log('✅ Student updated successfully');
                // toast({ title: "Success", description: "Student updated successfully." });
                refreshStudents();
                setIsModalOpen(false);
            } else {
                // ADD MODE: student creation already creates the default fee structure on the backend
                const createdStudent = await StudentsService.create(payload as StudentCreatePayload);
                console.log('✅ Student created successfully:', createdStudent);
                
                if (isEditingFees) {
                    try {
                        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
                        const feeApiBase = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;

                        const feeComponents = [
                            { componentName: 'Base Fee', amount: customFees.baseFee },
                            { componentName: 'Activity Fee', amount: customFees.activityFee },
                            { componentName: 'Exam Fee', amount: customFees.examFee },
                            { componentName: 'Other Fees', amount: customFees.otherFees },
                            ...(formData.transport === 'yes' ? [{ componentName: 'Transport Fee', amount: customFees.transportFee }] : []),
                        ];

                        const response = await fetch(
                            `${feeApiBase}/fees/update-student-fees/${createdStudent.admissionNumber}`,
                            {
                                method: 'PUT',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    feeComponents,
                                    reason: 'Custom fee values entered during student creation',
                                    notes: 'Applied automatically after student creation',
                                    actionType: 'update'
                                })
                            }
                        );

                        const result = await response.json();

                        if (!response.ok || !result.success) {
                            throw new Error(result.message || 'Failed to apply custom fees');
                        }
                    } catch (feeError) {
                        console.error('Student created but custom fee update failed:', feeError);
                        setFeeError('Student created successfully, but the custom fee update failed. Please review fees from Finance.');
                        refreshStudents();
                        return;
                    }
                }

                toast.success('Student created successfully');
                refreshStudents();
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} student:`, error);
            setFeeError(`Failed to ${isEditMode ? 'update' : 'add'} student. Please try again.`);
            // toast({ 
            //     title: "Error", 
            //     description: `Failed to ${isEditMode ? 'update' : 'add'} student. Please try again.`, 
            //     variant: "destructive" 
            // });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Utility to map the full backend class name back to the display value (e.g., '1st Class' -> '1')
    const getDisplayClassFromBackend = (backendClass: string) => {
        if (backendClass === 'LKG' || backendClass === 'UKG') return backendClass;
        const mapped = Object.entries(classNumberMap).find(([, value]) => value === backendClass);
        return mapped ? mapped[0] : backendClass;
    };
    
    // Get the display value for the class select
    const displayClassName = getDisplayClassFromBackend(formData.className);

    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            {/* DialogTrigger for the "Add Student" button is handled externally in the parent component */}
            <DialogContent className="max-w-4xl flex flex-col h-[90vh]">
                
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-2xl">{isEditMode ? 'Edit Student Details' : 'Add New Student'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? `Updating enrollment details for ${formData.firstName} ${formData.lastName}.` : 'Enter the enrollment details for the new student.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    
                    {/* SECTION 1: STUDENT DETAILS & CLASS */}
                    <div className="space-y-4 form-section">
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center text-primary/80"><User className="h-4 w-4 mr-2"/> Student Details</h3>
                        
                        {/* PASSWORD FIELDS (Only for new students) */}
                        {!isEditMode && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Login Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="password" className="flex items-center gap-2">
                                            Password <span className="text-red-500">*</span>
                                            <span className="text-xs text-muted-foreground font-normal">Default: Student@123</span>
                                        </Label>
                                        <Input 
                                            id="password" 
                                            name="password" 
                                            type="password"
                                            value={formData.password} 
                                            onChange={handleInputChange} 
                                            placeholder="Student@123"
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                                            Confirm Password <span className="text-red-500">*</span>
                                        </Label>
                                        <Input 
                                            id="confirmPassword" 
                                            name="confirmPassword" 
                                            type="password"
                                            value={formData.confirmPassword} 
                                            onChange={handleInputChange} 
                                            placeholder="Confirm password"
                                            required 
                                        />
                                        {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">❌ Passwords do not match</p>
                                        )}
                                        {formData.password === formData.confirmPassword && formData.password && (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">✅ Passwords match</p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/50 p-2 rounded">
                                    💡 Students will use their <strong>Admission Number</strong> as username and this password to login
                                </p>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* Admission Number (Show in Edit mode) */}
                            {isEditMode && (
                                <div>
                                    <Label htmlFor="admissionNumber">Admission No.</Label>
                                    <Input 
                                        id="admissionNumber" 
                                        name="admissionNumber" 
                                        value={formData.admissionNumber} 
                                        onChange={handleInputChange} 
                                        readOnly 
                                        className="bg-muted/30"
                                    />
                                </div>
                            )}

                            {/* Student Info */}
                            <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="dob">Date of Birth</Label><Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required /></div>
                            <div>
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Class Info */}
                            <div className="md:col-span-2 lg:col-span-1 grid grid-cols-2 gap-2">
                                <div>
                                    <Label htmlFor="className">Class</Label>
                                    <Select 
                                        value={displayClassName} 
                                        onValueChange={(displayValue) => handleSelectChange('className', displayValue)}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                                        <SelectContent>
                                            {classDropdownValues.map(c => (
                                                <SelectItem key={c} value={c}>
                                                    {`Class ${c}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="section">Section</Label>
                                    <Select value={formData.section} onValueChange={(value) => handleSelectChange('section', value)}>
                                        <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                                        <SelectContent>
                                            {sectionValues.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Transport Option */}
                            <div className="md:col-span-1">
                                <Label htmlFor="transport" className="flex items-center gap-2">
                                    <Bus className="h-4 w-4 text-blue-600" />
                                    Transport Enrollment
                                </Label>
                                <Select value={formData.transport} onValueChange={(value) => handleSelectChange('transport', value)}>
                                    <SelectTrigger className={formData.transport === 'yes' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : ''}>
                                        <SelectValue placeholder="Select transport status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no">
                                            <span className="flex items-center gap-2">Not Enrolled</span>
                                        </SelectItem>
                                        <SelectItem value="yes">
                                            <span className="flex items-center gap-2">Enrolled in Transport</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {formData.transport === 'yes' && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">✓ Transport fee will be included in the total fee</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: PARENT DETAILS */}
                    <div className="space-y-4 form-section">
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center text-primary/80"><User className="h-4 w-4 mr-2"/> Parent/Guardian Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            
                            {/* Father's Details */}
                            <div className="lg:col-span-2 space-y-3 p-3 border rounded-lg bg-muted/50">
                                <h4 className="font-medium flex items-center text-sm"><User className="h-4 w-4 mr-2"/> Father's Details</h4>
                                <div><Label htmlFor="fatherName">Name</Label><Input id="fatherName" name="fatherName" value={formData.fatherName} onChange={handleInputChange} required /></div>
                                <div><Label htmlFor="fatherPhone">Phone</Label><Input id="fatherPhone" name="fatherPhone" type="tel" value={formData.fatherPhone} onChange={handleInputChange} required /></div>
                                <div><Label htmlFor="fatherEmail">Email</Label><Input id="fatherEmail" name="fatherEmail" type="email" value={formData.fatherEmail} onChange={handleInputChange} /></div>
                                <div><Label htmlFor="fatherOccupation">Occupation</Label><Input id="fatherOccupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} /></div>
                            </div>

                            {/* Mother's Details */}
                            <div className="lg:col-span-2 space-y-3 p-3 border rounded-lg bg-muted/50">
                                <h4 className="font-medium flex items-center text-sm"><User className="h-4 w-4 mr-2"/> Mother's Details</h4>
                                <div><Label htmlFor="motherName">Name</Label><Input id="motherName" name="motherName" value={formData.motherName} onChange={handleInputChange} /></div>
                                <div><Label htmlFor="motherPhone">Phone</Label><Input id="motherPhone" name="motherPhone" type="tel" value={formData.motherPhone} onChange={handleInputChange} /></div>
                                <div><Label htmlFor="motherEmail">Email</Label><Input id="motherEmail" name="motherEmail" type="email" value={formData.motherEmail} onChange={handleInputChange} /></div>
                                <div><Label htmlFor="motherOccupation">Occupation</Label><Input id="motherOccupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} /></div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: ADDRESS */}
                    <div className="space-y-4 form-section">
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center text-primary/80"><MapPin className="h-4 w-4 mr-2"/> Address Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div><Label htmlFor="street">Street/Area</Label><Input id="street" name="street" value={formData.street} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="city">City</Label><Input id="city" name="city" value={formData.city} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="state">State</Label><Input id="state" name="state" value={formData.state} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="pincode">Pincode</Label><Input id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} required /></div>
                        </div>
                    </div>

                    {/* SECTION 3.5: FEE MANAGEMENT (Only in Edit Mode) */}
                    {isEditMode && (
                        <div className="space-y-4 form-section">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-base font-semibold flex items-center text-primary/80">
                                    <CreditCard className="h-4 w-4 mr-2"/> Fee Structure Management
                                </h3>
                                {existingFeeStructure && (
                                    <Button 
                                        type="button"
                                        variant={editModeFeeEnabled ? "default" : "outline"}
                                        size="sm"
                                        onClick={handleEditModeFeeToggle}
                                        className="text-xs"
                                    >
                                        {editModeFeeEnabled ? (
                                            <>
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Cancel
                                            </>
                                        ) : (
                                            <>
                                                <Edit className="h-3 w-3 mr-1" />
                                                Edit Fees
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>

                            {existingFeeStructure ? (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                        {/* Base Fee */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Base Fee</p>
                                            {editModeFeeEnabled ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm">₹</span>
                                                    <Input
                                                        type="number"
                                                        value={editModeFees.baseFee}
                                                        onChange={(e) => handleEditModeFeeChange('baseFee', e.target.value)}
                                                        className="h-8 text-sm font-semibold"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-lg font-semibold">₹{editModeFees.baseFee.toLocaleString()}</p>
                                            )}
                                        </div>
                                        
                                        {/* Activity Fee */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Activity Fee</p>
                                            {editModeFeeEnabled ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm">₹</span>
                                                    <Input
                                                        type="number"
                                                        value={editModeFees.activityFee}
                                                        onChange={(e) => handleEditModeFeeChange('activityFee', e.target.value)}
                                                        className="h-8 text-sm font-semibold"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-lg font-semibold">₹{editModeFees.activityFee.toLocaleString()}</p>
                                            )}
                                        </div>
                                        
                                        {/* Exam Fee */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Exam Fee</p>
                                            {editModeFeeEnabled ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm">₹</span>
                                                    <Input
                                                        type="number"
                                                        value={editModeFees.examFee}
                                                        onChange={(e) => handleEditModeFeeChange('examFee', e.target.value)}
                                                        className="h-8 text-sm font-semibold"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-lg font-semibold">₹{editModeFees.examFee.toLocaleString()}</p>
                                            )}
                                        </div>
                                        
                                        {/* Transport Fee */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Transport Fee</p>
                                            {editModeFeeEnabled ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm">₹</span>
                                                    <Input
                                                        type="number"
                                                        value={editModeFees.transportFee}
                                                        onChange={(e) => handleEditModeFeeChange('transportFee', e.target.value)}
                                                        className="h-8 text-sm font-semibold"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-lg font-semibold">₹{editModeFees.transportFee.toLocaleString()}</p>
                                            )}
                                        </div>
                                        
                                        {/* Other Fees */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Other Fees</p>
                                            {editModeFeeEnabled ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm">₹</span>
                                                    <Input
                                                        type="number"
                                                        value={editModeFees.otherFees}
                                                        onChange={(e) => handleEditModeFeeChange('otherFees', e.target.value)}
                                                        className="h-8 text-sm font-semibold"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-lg font-semibold">₹{editModeFees.otherFees.toLocaleString()}</p>
                                            )}
                                        </div>
                                        
                                        {/* Total Fee */}
                                        <div className="space-y-1 col-span-2 md:col-span-1">
                                            <p className="text-xs text-muted-foreground font-semibold">Total Fee</p>
                                            <p className="text-xl font-bold text-green-700 dark:text-green-400">
                                                ₹{(editModeFees.baseFee + editModeFees.activityFee + editModeFees.examFee + editModeFees.transportFee + editModeFees.otherFees).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Edit Mode: Reason & Notes Fields */}
                                    {editModeFeeEnabled && (
                                        <div className="space-y-3 mt-4 pt-4 border-t border-green-300 dark:border-green-700">
                                            <div>
                                                <Label htmlFor="feeChangeReason" className="text-sm font-semibold">
                                                    Reason for Change <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="feeChangeReason"
                                                    placeholder="e.g., Scholarship, Concession, Fee correction..."
                                                    value={feeChangeReason}
                                                    onChange={(e) => setFeeChangeReason(e.target.value)}
                                                    className="mt-1"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="feeChangeNotes" className="text-sm font-semibold">
                                                    Additional Notes (Optional)
                                                </Label>
                                                <Input
                                                    id="feeChangeNotes"
                                                    placeholder="Any additional details..."
                                                    value={feeChangeNotes}
                                                    onChange={(e) => setFeeChangeNotes(e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={handleSaveFeeChanges}
                                                disabled={isSavingFees || !feeChangeReason.trim()}
                                                className="w-full"
                                            >
                                                {isSavingFees ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving Changes...
                                                    </>
                                                ) : (
                                                    'Save Fee Changes with Audit Trail'
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 p-2 rounded flex items-center gap-1 mt-3">
                                        {editModeFeeEnabled ? (
                                            <p>⚠️ Changes will be logged in audit trail with your reason and timestamp</p>
                                        ) : (
                                            <p>💡 Current fee structure • Total Paid: ₹{existingFeeStructure.totalPaid?.toLocaleString() || 0} • Due: ₹{existingFeeStructure.totalDue?.toLocaleString() || 0}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        ⚠️ No fee structure found for this student. Fees can be assigned from the Finance section.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION 4: FEE BREAKDOWN (Only in Add Mode) */}
                    {!isEditMode && (
                        <div className="space-y-4 form-section">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-base font-semibold flex items-center text-primary/80">
                                    <CreditCard className="h-4 w-4 mr-2"/> Fee Structure Preview
                                </h3>
                                <Button 
                                    type="button"
                                    variant={isEditingFees ? "default" : "outline"}
                                    size="sm"
                                    onClick={handleEditFeesToggle}
                                    className="text-xs"
                                >
                                    {isEditingFees ? (
                                        <>
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Cancel Edit
                                        </>
                                    ) : (
                                        <>
                                            <Edit className="h-3 w-3 mr-1" />
                                            Edit Fees
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    {/* Base Fee */}
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Base Fee</p>
                                        {isEditingFees ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm">₹</span>
                                                <Input
                                                    type="number"
                                                    value={customFees.baseFee}
                                                    onChange={(e) => handleFeeChange('baseFee', e.target.value)}
                                                    className="h-8 text-sm font-semibold"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-lg font-semibold">₹{calculateFeeBreakdown.baseFee.toLocaleString()}</p>
                                        )}
                                    </div>
                                    
                                    {/* Activity Fee */}
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Activity Fee</p>
                                        {isEditingFees ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm">₹</span>
                                                <Input
                                                    type="number"
                                                    value={customFees.activityFee}
                                                    onChange={(e) => handleFeeChange('activityFee', e.target.value)}
                                                    className="h-8 text-sm font-semibold"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-lg font-semibold">₹{calculateFeeBreakdown.activityFee.toLocaleString()}</p>
                                        )}
                                    </div>
                                    
                                    {/* Exam Fee */}
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Exam Fee</p>
                                        {isEditingFees ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm">₹</span>
                                                <Input
                                                    type="number"
                                                    value={customFees.examFee}
                                                    onChange={(e) => handleFeeChange('examFee', e.target.value)}
                                                    className="h-8 text-sm font-semibold"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-lg font-semibold">₹{calculateFeeBreakdown.examFee.toLocaleString()}</p>
                                        )}
                                    </div>
                                    
                                    {/* Other Fees */}
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Other Fees</p>
                                        {isEditingFees ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm">₹</span>
                                                <Input
                                                    type="number"
                                                    value={customFees.otherFees}
                                                    onChange={(e) => handleFeeChange('otherFees', e.target.value)}
                                                    className="h-8 text-sm font-semibold"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-lg font-semibold">₹{calculateFeeBreakdown.otherFees.toLocaleString()}</p>
                                        )}
                                    </div>
                                    
                                    {/* Transport Fee */}
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Transport Fee</p>
                                        {isEditingFees && formData.transport === 'yes' ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm">₹</span>
                                                <Input
                                                    type="number"
                                                    value={customFees.transportFee}
                                                    onChange={(e) => handleFeeChange('transportFee', e.target.value)}
                                                    className="h-8 text-sm font-semibold text-blue-600 dark:text-blue-400"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                                {formData.transport === 'yes' ? `₹${calculateFeeBreakdown.transportFee.toLocaleString()}` : '₹0'}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Total Fee */}
                                    <div className="space-y-1 col-span-2 md:col-span-1">
                                        <p className="text-xs text-muted-foreground font-semibold">Total Annual Fee</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            ₹{calculateFeeBreakdown.totalFee.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 p-2 rounded flex items-center gap-1">
                                    {isEditingFees ? (
                                        <p>✏️ Custom fees enabled - You can adjust amounts for concessions/scholarships</p>
                                    ) : (
                                        <p>💡 Fee structure will be automatically created for Class {formData.className.replace(' Class', '')} - Section {formData.section}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <DialogFooter className="p-4 border-t bg-background/95 flex-col gap-2">
                    {/* Password Error Message Display */}
                    {passwordError && (
                        <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">Password Error</p>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{passwordError}</p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setPasswordError('')}
                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                                Dismiss
                            </Button>
                        </div>
                    )}
                    
                    {/* Fee Error Message Display */}
                    {feeError && (
                        <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                            <XCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warning</p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{feeError}</p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsModalOpen(false)}
                                className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
                            >
                                Close
                            </Button>
                        </div>
                    )}
                    
                    {/* Submit Button */}
                    <div className="w-full flex justify-end">
                        <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || (!isEditMode && formData.password !== formData.confirmPassword)}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? 'Save Changes' : 'Save Student'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// --- MAIN STUDENTS COMPONENT (Refactored to manage Add/Edit state) ---
export default function Students() {
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState<string>('all'); 
    const [selectedSection, setSelectedSection] = useState<string>('all'); 
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [otherFilters, setOtherFilters] = useState({
        transport: 'all',
        feeStatus: 'all',
        attendance: 'all',
    });
    
    // Edit/Add Modal States (New)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null); // Holds data for editing

    // Bulk Import States
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState<any>(null);

    // 1. DATA FETCHING LOGIC
    const fetchStudents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await StudentsService.getAll();
            setStudents(data);
        } catch (err) {
            console.error("Failed to fetch students:", err);
            setError("Failed to load student data. Please check the network.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'student') {
            setStudents([]);
            setError('You are not authorized to view student management data.');
            setIsLoading(false);
            return;
        }

        fetchStudents();
    }, [user?.role]);

    // 2. MODAL HANDLERS (New/Updated)
    const handleOpenAdd = () => {
        setSelectedStudent(null); // Clear selected student for Add mode
        setIsModalOpen(true);
    };

    const handleOpenEdit = (student: Student) => {
        setSelectedStudent(student); // Set student data for Edit mode
        setIsModalOpen(true);
    };
    
    const handleCloseModal = (isOpen: boolean) => {
        if (!isOpen) {
             // Reset student data and close
            setSelectedStudent(null);
        }
        setIsModalOpen(isOpen);
    };

    // 3. ACTION HANDLERS (Delete, Status Update - Unchanged logic, moved open edit handler)
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;
        try {
            await StudentsService.remove(id);
            // toast({ title: "Success", description: "Student deleted." });
            fetchStudents(); // Refresh data
        } catch (error) {
            console.error("Error deleting student:", error);
            // toast({ title: "Error", description: "Failed to delete student.", variant: "destructive" });
        }
    };

    const handleUpdateStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await StudentsService.updateStatus(id, newStatus as 'active' | 'inactive' | 'at-risk');
            // toast({ title: "Success", description: `Status changed to ${newStatus}.` });
            fetchStudents(); // Refresh data
        } catch (error) {
            console.error("Error updating status:", error);
            // toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
        }
    };

    // 4. SUMMARY STATS
    const summaryStats = useMemo(() => {
        const totalStudents = students.length;
        const activeStudents = students.filter((student) => student.status === 'active').length;
        const inactiveStudents = students.filter((student) => student.status === 'inactive').length;
        const totalClasses = new Set(students.map((student) => student.class.className)).size;

        return {
            totalStudents,
            activeStudents,
            inactiveStudents,
            totalClasses,
        };
    }, [students]);

    // 5. FILTERING LOGIC (Client-Side - Fixed class mapping)
    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const fullName = `${student.student.firstName} ${student.student.lastName}`.toLowerCase();

            const matchesSearch =
                searchQuery.length === 0 ||
                fullName.includes(searchQuery.toLowerCase()) ||
                student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (student.student.phone && student.student.phone.includes(searchQuery)) ||
                (student.parents.father.phone && student.parents.father.phone.includes(searchQuery));

            // FIXED: Map display class (1, 2, 10...) to backend class (1st Class, 2nd Class, 10th Class...)
            const backendClass = classNumberMap[selectedClass] || selectedClass;
            const matchesClass = selectedClass === 'all' || student.class.className === backendClass;
            const matchesSection = selectedSection === 'all' || student.class.section === selectedSection;
            const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;

            const matchesClassAndSection = matchesClass && matchesSection;

            const normalizedTransport = normalizeTransportValue(student.transport);

            const matchesTransport =
                otherFilters.transport === 'all' ||
                normalizedTransport === otherFilters.transport;

            const matchesFee =
                otherFilters.feeStatus === 'all' ||
                student.feeStatus === otherFilters.feeStatus;

            const matchesAttendance =
                otherFilters.attendance === 'all' ||
                (otherFilters.attendance === 'high' && (student.attendance ?? 0) >= 90) ||
                (otherFilters.attendance === 'low' && (student.attendance ?? 0) < 75);

            return matchesSearch && matchesClassAndSection && matchesStatus && matchesTransport && matchesFee && matchesAttendance;
        });
    }, [students, searchQuery, selectedClass, selectedSection, selectedStatus, otherFilters]);

    // 6. CLEAR/RESET HANDLER
    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedClass('all');
        setSelectedSection('all');
        setSelectedStatus('all');
        setOtherFilters({
            transport: 'all',
            feeStatus: 'all',
            attendance: 'all',
        });
    }, []);

    // 7. BULK IMPORT HANDLERS
    // Helper function to parse CSV line properly (handles quoted values)
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip escaped quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const handleBulkImport = async () => {
        if (!bulkImportFile) {
            toast.error('Please select a file to import');
            return;
        }

        setIsImporting(true);
        setImportResults(null);

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split(/\r?\n/).filter(line => line.trim());

                    if (lines.length < 2) {
                        toast.error('File must have at least a header row and one data row');
                        setIsImporting(false);
                        return;
                    }

                    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''));
                    const requiredHeaders = ['firstname', 'classname', 'section', 'fathername', 'fatherphone'];
                    const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));

                    if (missingHeaders.length > 0) {
                        toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
                        setIsImporting(false);
                        return;
                    }

                    const students = [];
                    const seenAdmissionNumbers = new Set<string>();

                    for (let i = 1; i < lines.length; i++) {
                        const values = parseCSVLine(lines[i]);
                        if (values.length < headers.length) continue; // Skip incomplete rows
                        
                        const student: any = {};
                        headers.forEach((header, index) => {
                            student[header] = values[index] || '';
                        });

                        // Skip if admission number is duplicate within file
                        if (student.admissionnumber && seenAdmissionNumbers.has(student.admissionnumber)) {
                            continue;
                        }
                        if (student.admissionnumber) {
                            seenAdmissionNumbers.add(student.admissionnumber);
                        }

                        // Map headers to expected format
                        students.push({
                            firstName: student.firstname || '',
                            lastName: student.lastname || '',
                            className: student.classname || '',
                            section: student.section || 'A',
                            fatherName: student.fathername || '',
                            fatherPhone: student.fatherphone || '',
                            fatherEmail: student.fatheremail || '',
                            fatherOccupation: student.fatheroccupation || '',
                            motherName: student.mothername || '',
                            motherPhone: student.motherphone || '',
                            motherEmail: student.motheremail || '',
                            motherOccupation: student.motheroccupation || '',
                            street: student.street || '',
                            city: student.city || '',
                            state: student.state || '',
                            pincode: student.pincode || '',
                            gender: student.gender || 'Male',
                            transport: student.transport === 'yes' ? 'yes' : 'no',
                            admissionNumber: student.admissionnumber || undefined,
                            academicYear: student.academicyear || '2025-2026'
                        });
                    }

                    if (students.length === 0) {
                        toast.error('No valid student data found in file');
                        setIsImporting(false);
                        return;
                    }

                    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
                    const importApiUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;

                    const response = await fetch(`${importApiUrl}/students/import`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ students })
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        setImportResults(result.data);
                        toast.success('Import Successful', {
                            description: `Imported ${result.data.imported} students, ${result.data.failed} failed`
                        });
                        fetchStudents();
                    } else {
                        toast.error('Import Failed', {
                            description: result.message || 'Unknown error'
                        });
                    }
                } catch (error: any) {
                    console.error('Import error:', error);
                    toast.error('Import Failed', {
                        description: error.message || 'Failed to process file'
                    });
                } finally {
                    setIsImporting(false);
                }
            };

            reader.onerror = () => {
                toast.error('Failed to read file');
                setIsImporting(false);
            };

            reader.readAsText(bulkImportFile);
        } catch (error: any) {
            console.error('Import error:', error);
            toast.error('Import Failed', {
                description: error.message || 'Failed to import students'
            });
            setIsImporting(false);
        }
    };

    const downloadSampleCSV = () => {
        const headers = 'firstname,lastname,gender,classname,section,fathername,fatherphone,fatheremail,mothername,motherphone,transport,street,city,state,pincode';
        const sampleRow = 'John,Doe,Male,10,A,John Doe Sr,9876543210,john@example.com,Jane Doe,9876543211,no,123 Main St,City,State,123456';
        const csvContent = `${headers}\n${sampleRow}`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'sample_students_import.csv';
        link.click();
    };

    // 7. EXPORT/PRINT HANDLERS
    const handleExportCSV = (exportType: 'filtered' | 'all') => {
        let dataToExport = students;
        if (exportType === 'filtered') {
            dataToExport = filteredStudents;
        }
        exportToCSV(dataToExport, `Student_Data_${exportType}_${new Date().toLocaleDateString('en-CA')}`);
    };

    const handlePrintData = () => {
        printStudentData(filteredStudents, 'Student Directory Report');
    };

    // 8. RENDER STATES
    const renderTableContent = () => {
        if (isLoading) {
            return (
                <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-lg text-primary">
                        <Loader2 className="h-6 w-6 inline-block mr-2 animate-spin" />
                        Loading student data...
                    </TableCell>
                </TableRow>
            );
        }
        if (error) {
            return (
                <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-lg text-destructive">
                        Error: {error}
                        <Button variant="ghost" className="ml-4 text-sm" onClick={fetchStudents}>
                            <RefreshCw className="h-4 w-4 mr-1" /> Retry
                        </Button>
                    </TableCell>
                </TableRow>
            );
        }
        if (filteredStudents.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-lg text-muted-foreground">
                        No students found matching the current filters.
                    </TableCell>
                </TableRow>
            );
        }

        // RENDER ACTUAL DATA
        return filteredStudents.map((student) => (
            <TableRow key={student._id} className="hover:bg-muted/30">
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {getStudentInitials(student)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{getStudentDisplayName(student)}</p>
                            <p className="text-xs text-muted-foreground">Adm No. {student.admissionNumber}</p>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    {/* Display uses the correct, full class name + section */}
                    <Badge variant="outline">{`${student.class.className.replace(' Class', '')}-${student.class.section}`}</Badge>
                </TableCell>
                <TableCell>
                    <div>
                        <p className="text-sm">{student.parents.father.name}</p>
                        <p className="text-xs text-muted-foreground">{student.parents.father.phone}</p>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        {/* Attendance is mocked from service */}
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${
                                    (student.attendance ?? 0) >= 90
                                        ? 'bg-success'
                                        : (student.attendance ?? 0) >= 75
                                        ? 'bg-warning'
                                        : 'bg-destructive'
                                }`}
                                style={{ width: `${student.attendance}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium">{student.attendance}%</span>
                    </div>
                </TableCell>
                <TableCell>
                    {/* Fee Balance Display */}
                    {(() => {
                        const feeDisplay = getFeeBalanceDisplay(student);
                        return (
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                            {feeDisplay.amount == null ? 'Not Assigned' : `₹${feeDisplay.amount.toLocaleString('en-IN')}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {feeDisplay.label}
                        </span>
                    </div>
                        );
                    })()}
                </TableCell>
                <TableCell>
                    {/* Transport status is mocked from service */}
                    {(() => {
                        const normalizedTransport = normalizeTransportValue(student.transport);
                        const isEnrolled = normalizedTransport === 'yes';

                        return (
                            <div className="flex items-center gap-2">
                                <Bus className={`h-4 w-4 ${isEnrolled ? 'text-blue-600' : 'text-muted-foreground'}`} />
                                <Badge 
                                    variant={isEnrolled ? 'default' : 'outline'}
                                    className={isEnrolled ? 'bg-blue-600 text-white' : ''}
                                >
                                    {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                                </Badge>
                            </div>
                        );
                    })()}
                </TableCell>
                <TableCell>
                    <Badge className={statusStyles[student.status as keyof typeof statusStyles]}>
                        {student.status}
                    </Badge>
                </TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(student)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Student
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(student._id, student.status)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Toggle Status (Current: {student.status})
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(student._id)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        ));
    };

    // Determine if any filter is active for the Reset button
    const isFilterActive = searchQuery !== '' || selectedClass !== 'all' || selectedSection !== 'all' || selectedStatus !== 'all' ||
                         otherFilters.transport !== 'all' || otherFilters.feeStatus !== 'all' || 
                         otherFilters.attendance !== 'all';

    return (
        <div className="space-y-6">
            
            {/* -------------------- ADD/EDIT MODAL -------------------- */}
            <AddEditStudentModal
                isModalOpen={isModalOpen}
                setIsModalOpen={handleCloseModal}
                initialStudent={selectedStudent}
                refreshStudents={fetchStudents}
            />
            {/* -------------------------------------------------------- */}

            {/* -------------------- BULK IMPORT MODAL -------------------- */}
            <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Bulk Import Students</DialogTitle>
                        <DialogDescription>
                            Import multiple students from a CSV file. Download the sample file to see the required format.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Download Sample */}
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div>
                                <p className="text-sm font-medium">Need a template?</p>
                                <p className="text-xs text-muted-foreground">Download the sample CSV file with correct format</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                Sample CSV
                            </Button>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="csvFile">Upload CSV File</Label>
                            <Input
                                id="csvFile"
                                type="file"
                                accept=".csv"
                                onChange={(e) => setBulkImportFile(e.target.files?.[0] || null)}
                                disabled={isImporting}
                            />
                            {bulkImportFile && (
                                <p className="text-xs text-muted-foreground">
                                    Selected: {bulkImportFile.name} ({(bulkImportFile.size / 1024).toFixed(1)} KB)
                                </p>
                            )}
                        </div>

                        {/* Import Results */}
                        {importResults && (
                            <div className="p-3 rounded-lg border">
                                <div className="flex items-center gap-2 mb-2">
                                    {importResults.failed === 0 ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-yellow-600" />
                                    )}
                                    <p className="font-medium">
                                        Imported: {importResults.imported} | Failed: {importResults.failed}
                                    </p>
                                </div>
                                {importResults.errors && importResults.errors.length > 0 && (
                                    <div className="mt-2 max-h-40 overflow-y-auto">
                                        <p className="text-xs font-medium mb-1">Errors:</p>
                                        <ul className="text-xs space-y-1">
                                            {importResults.errors.map((err: any, idx: number) => (
                                                <li key={idx} className="text-red-600">
                                                    Row {err.row}: {err.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Required Fields Info */}
                        <div className="text-xs text-muted-foreground">
                            <p className="font-medium mb-1">Required columns:</p>
                            <p>firstname, classname, section, fathername, fatherphone</p>
                            <p className="mt-1">Optional: lastname, gender, fatheremail, mothername, motherphone, transport, street, city, state, pincode</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkImportOpen(false)} disabled={isImporting}>
                            Cancel
                        </Button>
                        <Button onClick={handleBulkImport} disabled={isImporting || !bulkImportFile}>
                            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {importResults ? 'Import Again' : 'Import Students'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* -------------------------------------------------------- */}


            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Student Management</h1>
                    <p className="text-muted-foreground">Manage and view all student information</p>
                </div>

                <div className="flex gap-2">
                    {/* Import Students Button */}
                    <Button variant="outline" onClick={() => {
                        setIsBulkImportOpen(true);
                        setBulkImportFile(null);
                        setImportResults(null);
                    }}>
                        <Download className="h-4 w-4 mr-2" />
                        Import Students
                    </Button>

                    {/* ADD STUDENT BUTTON */}
                    <Button onClick={handleOpenAdd}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Student
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Students</p>
                                <p className="text-2xl font-bold">{summaryStats.totalStudents}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <User className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Active Students</p>
                                <p className="text-2xl font-bold text-green-600">{summaryStats.activeStudents}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                <UserCheck className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Inactive Students</p>
                                <p className="text-2xl font-bold text-destructive">{summaryStats.inactiveStudents}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                                <XCircle className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Classes</p>
                                <p className="text-2xl font-bold">{summaryStats.totalClasses}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <MapPin className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Card */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px] sm:min-w-[250px] order-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, Adm No..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        {/* A) Class Dropdown (Order 2) */}
                        <Select 
                            value={selectedClass} 
                            onValueChange={setSelectedClass}
                        >
                            <SelectTrigger className="w-full sm:w-[120px] order-2">
                                <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classDropdownValues.map(c => (
                                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* B) Section Dropdown (Order 3) */}
                        <Select 
                            value={selectedSection} 
                            onValueChange={setSelectedSection}
                        >
                            <SelectTrigger className="w-full sm:w-[100px] order-3">
                                <SelectValue placeholder="Section" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {sectionValues.map(s => (
                                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* C) Status Dropdown (Order 4) */}
                        <Select
                            value={selectedStatus}
                            onValueChange={setSelectedStatus}
                        >
                            <SelectTrigger className="w-full sm:w-[130px] order-4">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        {/* More Filters Dropdown (Order 5) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="order-5">
                                    <Filter className="h-4 w-4 mr-2" />
                                    More Filters
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <div className="p-2 space-y-2">
                                    <p className="text-sm font-semibold text-muted-foreground">Additional Filters</p>
                                    
                                    {/* Transport Filter */}
                                    <Select 
                                        value={otherFilters.transport} 
                                        onValueChange={(val) => setOtherFilters({...otherFilters, transport: val})}
                                    >
                                        <SelectTrigger className="h-8">
                                            <Bus className="h-3 w-3 mr-2" />
                                            <SelectValue placeholder="Transport" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Transport</SelectItem>
                                            <SelectItem value="yes">Using Transport</SelectItem>
                                            <SelectItem value="no">No Transport</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    
                                    {/* Fee Status Filter */}
                                    <Select 
                                        value={otherFilters.feeStatus} 
                                        onValueChange={(val) => setOtherFilters({...otherFilters, feeStatus: val})}
                                    >
                                        <SelectTrigger className="h-8">
                                            <CreditCard className="h-3 w-3 mr-2" />
                                            <SelectValue placeholder="Fee Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Fee Status</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Attendance Filter */}
                                    <Select 
                                        value={otherFilters.attendance} 
                                        onValueChange={(val) => setOtherFilters({...otherFilters, attendance: val})}
                                    >
                                        <SelectTrigger className="h-8">
                                            <UserCheck className="h-3 w-3 mr-2" />
                                            <SelectValue placeholder="Attendance" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Attendance</SelectItem>
                                            <SelectItem value="high">High (&ge; 90%)</SelectItem>
                                            <SelectItem value="low">Low (&lt; 75%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {/* CLEAR / RESET Button (Order 6) */}
                        {isFilterActive && (
                            <Button 
                                variant="outline" 
                                className="text-destructive border-destructive hover:bg-destructive/10 order-6" 
                                onClick={handleResetFilters}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reset Filters
                            </Button>
                        )}


                        {/* EXPORT DROPDOWN MENU (Order 7 - Pushed to end) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="default" 
                                    className="bg-purple-600 hover:bg-purple-700 text-white ml-auto order-7"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={handlePrintData}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Data
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportCSV('filtered')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Download CSV (Filtered)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportCSV('all')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Download CSV (All)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                </CardContent>
            </Card>

            {/* Students Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">All Students</CardTitle>
                        <Badge variant="secondary">{filteredStudents.length} students</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-x-auto">
                        <Table id="students-data-table">
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Student</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Parent/Guardian</TableHead>
                                    <TableHead>Attendance</TableHead>
                                    <TableHead>Fee Balance</TableHead>
                                    <TableHead>Transport</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderTableContent()}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div> 
    );
}
