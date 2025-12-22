// Students.tsx (Updated with Edit Student functionality using the same modal)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StudentsService } from '../Services/students.service'; // Adjust path as needed (match folder casing)
import { Student, StudentCreatePayload } from '../types/student'; // Adjust path as needed
// Note: Assuming you have a useToast hook setup
// import { useToast } from '@/components/ui/use-toast'; 

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
    User, MapPin, Printer, FileText, Loader2, RefreshCw, XCircle
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// --- Static Data ---
const classValues: string[] = ['LKG', 'UKG', '1st Class', '2nd Class', '3rd Class', '4th Class', '5th Class', '6th Class', '7th Class', '8th Class', '9th Class', '10th Class'];
// Map the display class names (1, 2, 3...) to the full backend string (1st Class, 2nd Class...)
const classNumberMap: { [key: string]: string } = {
    '1': '1st Class', '2': '2nd Class', '3': '3rd Class', '4': '4th Class', '5': '5th Class',
    '6': '6th Class', '7': '7th Class', '8': '8th Class', '9': '9th Class', '10': '10th Class'
};
// Use the required list for the Class Dropdown (LKG, UKG, 1, 2, 3...)
const classDropdownValues: string[] = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const sectionValues: string[] = ['A', 'B', 'C', 'D']; // Section Dropdown values

const statusStyles = {
    active: 'bg-success/10 text-success border-success/20',
    'at-risk': 'bg-destructive/10 text-destructive border-destructive/20',
    inactive: 'bg-muted text-muted-foreground',
};

const feeStyles = {
    paid: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    overdue: 'bg-destructive/10 text-destructive',
};

// --- CORE EXPORT/PRINT FUNCTIONS (Remain the same) ---
const exportToCSV = (data: Student[], fileName: string) => {
    const headers = [
        'ID', 'Admission No', 'Name', 'Roll No', 'Class', 'Section', 'Father Name', 
        'Attendance (%)', 'Fee Status', 'Transport', 'Status'
    ];
    
    const csvRows = data.map(student => [
        student._id,
        student.admissionNumber,
        `${student.student.firstName} ${student.student.lastName}`,
        'N/A', // Assuming Roll No is not directly available or needs calculation
        student.class.className,
        student.class.section,
        student.parents.father.name,
        student.attendance,
        student.feeStatus,
        student.transport === 'yes' ? 'Enrolled' : 'N/A',
        student.status
    ].map(item => `"${String(item).replace(/"/g, '""')}"`).join(','));
    
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

const handlePrint = (tableId: string, title: string) => {
    const tableToPrint = document.getElementById(tableId);

    if (!tableToPrint) {
        console.error("Print Error: Table element not found.");
        return;
    }

    const originalBody = document.body.innerHTML;

    const printContent = `
        <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { margin-bottom: 20px; font-size: 1.5em; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 0.85em; }
                    th { background-color: #f0f0f0; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                ${tableToPrint.outerHTML}
            </body>
        </html>
    `;

    document.body.innerHTML = printContent;
    
    window.print();
    
    document.body.innerHTML = originalBody;
    
    window.location.reload(); 
};


// Helper to convert the dropdown value (e.g., '1') to the backend class name (e.g., '1st Class')
const getBackendClassName = (displayClass: string): string => {
    if (classNumberMap[displayClass]) {
        return classNumberMap[displayClass];
    }
    return displayClass; // For LKG, UKG, or if already full name
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
});

// Helper to map Student object to Form Data structure
const mapStudentToFormData = (student: Student) => ({
    _id: student._id,
    firstName: student.student.firstName,
    lastName: student.student.lastName,
    gender: ((student as any).student?.gender ?? (student as any).gender ?? 'Male'),
    dob: student.student.dob,
    className: student.class.className,
    section: student.class.section,
    fatherName: student.parents.father.name,
    fatherPhone: student.parents.father.phone,
    fatherEmail: student.parents.father.email,
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
});

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const { toast } = useToast();

    // Effect to initialize/reset form data when modal opens or initialStudent changes
    useEffect(() => {
        if (isModalOpen) {
            if (initialStudent) {
                // Edit Mode: Load existing student data
                setFormData(mapStudentToFormData(initialStudent));
            } else {
                // Add Mode: Use default empty form
                setFormData(createDefaultFormData());
            }
        }
    }, [isModalOpen, initialStudent]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (key: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };
    
    // Helper to extract the core payload common to both POST and PUT
    // Always return a full StudentCreatePayload so both create and update calls receive the expected shape.
    const getPayload = (currentFormData: typeof formData): StudentCreatePayload => ({
        // Note: For Add (POST), we omit _id. For Edit (PUT), we still send the same payload shape.
        admissionNumber: currentFormData.admissionNumber || `ADM-${Date.now()}`,
        status: currentFormData._id ? 'active' : 'active', // Assuming we maintain 'active' status on creation/edit unless status field is added
        student: {
            firstName: currentFormData.firstName,
            lastName: currentFormData.lastName,
            gender: currentFormData.gender as 'Male' | 'Female' | 'Other',
            dob: currentFormData.dob,
        },
        class: {
            className: currentFormData.className,
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
    });

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const payload = getPayload(formData);
        
        try {
            if (isEditMode && formData._id) {
                // EDIT MODE: Call PUT
                await StudentsService.update(formData._id, payload as Partial<StudentCreatePayload>);
                // toast({ title: "Success", description: "Student updated successfully." });
            } else {
                // ADD MODE: Call POST
                await StudentsService.create(payload as StudentCreatePayload);
                // toast({ title: "Success", description: "Student added successfully." });
            }
            refreshStudents(); // Refresh the main table data
            setIsModalOpen(false); // Close modal on success
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} student:`, error);
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
                                        onValueChange={(displayValue) => handleSelectChange('className', getBackendClassName(displayValue))} 
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

                </div>

                <DialogFooter className="p-4 border-t bg-background/95">
                    <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Save Changes' : 'Save Student'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// --- MAIN STUDENTS COMPONENT (Refactored to manage Add/Edit state) ---
export default function Students() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState<string>('all'); 
    const [selectedSection, setSelectedSection] = useState<string>('all'); 
    const [otherFilters, setOtherFilters] = useState({
        transport: 'all',
        feeStatus: 'all',
        attendance: 'all',
    });
    
    // Edit/Add Modal States (New)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null); // Holds data for editing

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
        fetchStudents();
    }, []);

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

    // 4. FILTERING LOGIC (Client-Side - Re-written for separate class/section)
    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const fullName = `${student.student.firstName} ${student.student.lastName}`.toLowerCase();
            
            const matchesSearch = 
                searchQuery.length === 0 || 
                fullName.includes(searchQuery.toLowerCase()) ||
                student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());

            const backendClassName = getBackendClassName(selectedClass);
            
            const matchesClass = selectedClass === 'all' || student.class.className === backendClassName;
            const matchesSection = selectedSection === 'all' || student.class.section === selectedSection;
            
            const matchesClassAndSection = matchesClass && matchesSection;
            
            const matchesTransport = 
                otherFilters.transport === 'all' || 
                student.transport === otherFilters.transport;
                
            const matchesFee = 
                otherFilters.feeStatus === 'all' || 
                student.feeStatus === otherFilters.feeStatus;
                
            const matchesAttendance = 
                otherFilters.attendance === 'all' || 
                (otherFilters.attendance === 'high' && (student.attendance ?? 0) >= 90) ||
                (otherFilters.attendance === 'low' && (student.attendance ?? 0) < 75);
                
            return matchesSearch && matchesClassAndSection && matchesTransport && matchesFee && matchesAttendance;
        });
    }, [students, searchQuery, selectedClass, selectedSection, otherFilters]);

    // 5. CLEAR/RESET HANDLER
    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedClass('all');
        setSelectedSection('all');
        setOtherFilters({
            transport: 'all',
            feeStatus: 'all',
            attendance: 'all',
        });
    }, []);

    // 6. EXPORT/PRINT HANDLERS
    const handleExportCSV = (exportType: 'filtered' | 'all') => {
        let dataToExport = students;
        if (exportType === 'filtered') {
            dataToExport = filteredStudents;
        }
        exportToCSV(dataToExport, `Student_Data_${exportType}_${new Date().toLocaleDateString('en-CA')}`);
    };

    const handlePrintData = () => {
        handlePrint('students-data-table', 'Student Directory Report');
    };

    // 7. RENDER STATES
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
                                {`${student.student.firstName[0]}${student.student.lastName[0]}`}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{`${student.student.firstName} ${student.student.lastName}`}</p>
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
                    {/* Fee status is mocked from service */}
                    <Badge className={feeStyles[student.feeStatus as keyof typeof feeStyles]}>
                        {student.feeStatus}
                    </Badge>
                </TableCell>
                <TableCell>
                    {/* Transport status is mocked from service */}
                    <Badge variant={student.transport === 'yes' ? 'success' : 'outline'} className="text-xs">
                        {student.transport === 'yes' ? 'Enrolled' : 'N/A'}
                    </Badge>
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
    const isFilterActive = searchQuery !== '' || selectedClass !== 'all' || selectedSection !== 'all' || 
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


            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Student Management</h1>
                    <p className="text-muted-foreground">Manage and view all student information</p>
                </div>
                
                {/* ADD STUDENT BUTTON - Now triggers the open function */}
                <Button onClick={handleOpenAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                </Button>
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
                        
                        {/* More Filters Dropdown (Order 4) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="order-4">
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
                        
                        {/* CLEAR / RESET Button (Order 5) */}
                        {isFilterActive && (
                            <Button 
                                variant="outline" 
                                className="text-destructive border-destructive hover:bg-destructive/10 order-5" 
                                onClick={handleResetFilters}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reset Filters
                            </Button>
                        )}


                        {/* EXPORT DROPDOWN MENU (Order 6 - Pushed to end) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="default" 
                                    className="bg-purple-600 hover:bg-purple-700 text-white ml-auto order-6"
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
                                    <TableHead>Fee Status</TableHead>
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