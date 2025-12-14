import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { 
    Search, Plus, GraduationCap, Users, Clock, BookOpen, Mail, Phone, MoreVertical, 
    Trash2, Eye, Edit, RefreshCw, Loader2, XCircle, Calendar, ChevronsUpDown, User, MapPin, CreditCard 
} from 'lucide-react';
// Note: StatCard is mocked below as requested, assuming it was available
// import { StatCard } from '@/components/dashboard/StatCard'; 
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Used for Qualification input
import { Toggle } from '@/components/ui/toggle'; // Used for multi-select

// --- TypeScript Data Interfaces (Matching Requirement) ---

interface AssignedClass {
    className: string; // e.g., "10", "LKG"
    section: string; // e.g., "A", "B"
}

// User account details required for POST /api/admin/teachers (A)
interface UserCreationPayload {
    role: 'teacher';
    username: string; // Using email as username for simplicity
    temporaryPassword: string; // Allow any temporary password string
}

interface Teacher {
    employeeId: string; // Unique ID
    _id: string; // Mocked DB ID for CRUD operations
    personal: {
        firstName: string;
        lastName: string;
        gender: 'Male' | 'Female' | 'Other';
        dob: string; // YYYY-MM-DD
    };
    contact: {
        phone: string;
        email: string;
    };
    professional: {
        department: string;
        subjects: string[];
        experienceYears: number;
        qualification: string;
    };
    assignedClasses: AssignedClass[];
    status: 'active' | 'inactive' | 'deleted'; // Added 'deleted' for soft delete tracking
    // Mocked display properties for table rendering
    attendance: number; 
    workload: number;
}

// Interface for API Service (Updated to match all 7 APIs exactly)
interface TeacherService {
    // 1) POST /api/admin/teachers
    create: (payload: Omit<Teacher, '_id' | 'employeeId' | 'attendance' | 'workload' | 'status'> & UserCreationPayload) => Promise<Teacher>;
    // 2) GET /api/admin/teachers
    getAll: () => Promise<Teacher[]>;
    // 3) GET /api/admin/teachers/:id
    getById: (id: string) => Promise<Teacher>;
    // 4) PUT /api/admin/teachers/:id
    update: (id: string, payload: Partial<Omit<Teacher, 'employeeId' | 'assignedClasses' | 'status'>>) => Promise<Teacher>;
    // 5) PUT /api/admin/teachers/:id/status
    updateStatus: (id: string, newStatus: 'active' | 'inactive') => Promise<void>;
    // 6) PUT /api/admin/teachers/:id/assign-classes
    assignClasses: (id: string, classes: AssignedClass[]) => Promise<void>;
    // 7) DELETE /api/admin/teachers/:id (Soft Delete)
    remove: (id: string) => Promise<void>;
}

// --- STATIC CONFIGURATION & MOCK DATA ---
const mockDepartments = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Language', 'Physical Education', 'Support'];
const mockSubjects: Record<string, string[]> = {
    'Mathematics': ['Algebra', 'Geometry', 'Calculus', 'Statistics'],
    'Science': ['Physics', 'Chemistry', 'Biology', 'Environmental Science'],
    'English': ['Literature', 'Grammar', 'Composition'],
    'Computer Science': ['Programming', 'IT', 'Web Development'],
    'Social Studies': ['History', 'Geography', 'Economics'],
    'Language': ['Hindi', 'Sanskrit', 'French'],
    'Physical Education': ['Sports', 'Health'],
    'Support': ['Counselling', 'Administration'],
};
const mockClassDropdownValues = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const mockSectionValues = ['A', 'B', 'C', 'D'];

// Note: Initial data is defined globally to persist state across mock API calls
const initialMockData: Teacher[] = [
    {
        _id: 't-1', employeeId: "EMP-001", attendance: 96, workload: 85,
        personal: { firstName: "Priya", lastName: "Sharma", gender: 'Female', dob: "1990-05-12" },
        contact: { phone: "9876543210", email: "priya.sharma@school.edu" },
        professional: { department: "Mathematics", subjects: ["Algebra", "Statistics"], experienceYears: 6, qualification: "M.Sc Maths" },
        assignedClasses: [{ className: "10", section: "A" }, { className: "9", section: "B" }, { className: "10", section: "B" }, { className: "8", section: "A" }],
        status: 'active',
    },
    {
        _id: 't-2', employeeId: "EMP-002", attendance: 92, workload: 72,
        personal: { firstName: "Rahul", lastName: "Verma", gender: 'Male', dob: "1985-08-20" },
        contact: { phone: "9876543211", email: "rahul.verma@school.edu" },
        professional: { department: "English", subjects: ["English", "Literature"], experienceYears: 5, qualification: "M.A. English" },
        assignedClasses: [{ className: "10", section: "A" }, { className: "10", section: "B" }, { className: "9", section: "A" }],
        status: 'active',
    },
    {
        _id: 't-3', employeeId: "EMP-003", attendance: 98, workload: 90,
        personal: { firstName: "Meera", lastName: "Nair", gender: 'Female', dob: "1978-11-01" },
        contact: { phone: "9876543212", email: "meera.nair@school.edu" },
        professional: { department: "Science", subjects: ["Physics", "Chemistry"], experienceYears: 10, qualification: "Ph.D. Physics" },
        assignedClasses: [{ className: "10", section: "A" }, { className: "10", section: "B" }, { className: "9", section: "A" }, { className: "9", section: "B" }],
        status: 'inactive',
    },
    {
        _id: 't-4', employeeId: "EMP-004", attendance: 94, workload: 95,
        personal: { firstName: "Vikram", lastName: "Singh", gender: 'Male', dob: "1995-02-28" },
        contact: { phone: "9876543213", email: "vikram.singh@school.edu" },
        professional: { department: "Computer Science", subjects: ["Programming", "IT"], experienceYears: 6, qualification: "B.Tech CS" },
        assignedClasses: [{ className: "8", section: "C" }, { className: "7", section: "D" }],
        status: 'active',
    },
];

// Mock API Implementation (Updated to reflect API structure)
const TeachersService: TeacherService = {
    // 1) POST /api/admin/teachers (Create Teacher + User account)
    async create(payload) {
        return new Promise(resolve => {
            const newTeacher: Teacher = {
                // Ensure payload structure is correctly unpacked, ignoring UserCreationPayload fields here as they are backend concerns
                _id: `t-${Date.now()}`,
                employeeId: `EMP-${Math.floor(Math.random() * 9000) + 1000}`,
                attendance: 100,
                workload: 50,
                status: 'active',
                // Explicitly pull fields needed from the combined payload
                personal: payload.personal,
                contact: payload.contact,
                professional: payload.professional,
                assignedClasses: payload.assignedClasses,
            };
            initialMockData.push(newTeacher);
            setTimeout(() => resolve(newTeacher), 300);
        });
    },

    // 2) GET /api/admin/teachers (Get all teachers)
    async getAll() {
        return new Promise(resolve => setTimeout(() => resolve(
            // Filter out softly deleted records for the main list
            initialMockData.filter(t => t.status !== 'deleted')
        ), 500));
    },

    // 3) GET /api/admin/teachers/:id (Get teacher by ID - Must be separate API call)
    async getById(id: string) {
        return new Promise((resolve, reject) => {
            const teacher = initialMockData.find(t => t._id === id);
            if (teacher) {
                setTimeout(() => resolve(teacher), 200);
            } else {
                setTimeout(() => reject(new Error('Teacher not found')), 200);
            }
        });
    },

    // 4) PUT /api/admin/teachers/:id (Update teacher details - WITHOUT status/classes)
    async update(id, payload) {
        return new Promise(resolve => {
            const index = initialMockData.findIndex(t => t._id === id);
            if (index !== -1) {
                const existing = initialMockData[index];
                const updatedTeacher: Teacher = {
                    ...existing,
                    ...payload,
                    personal: { ...existing.personal, ...payload.personal },
                    contact: { ...existing.contact, ...payload.contact },
                    professional: { ...existing.professional, ...payload.professional },
                    // IMPORTANT: Classes and Status are explicitly excluded from this general update API
                    assignedClasses: existing.assignedClasses,
                    status: existing.status,
                };
                initialMockData[index] = updatedTeacher;
                setTimeout(() => resolve(updatedTeacher), 300);
            } else {
                throw new Error("Teacher not found");
            }
        });
    },

    // 5) PUT /api/admin/teachers/:id/status (Activate / Deactivate teacher)
    async updateStatus(id, newStatus) {
        return new Promise(resolve => {
            const teacher = initialMockData.find(t => t._id === id);
            if (teacher) {
                teacher.status = newStatus;
                setTimeout(() => resolve(), 300);
            } else {
                throw new Error("Teacher not found");
            }
        });
    },

    // 6) PUT /api/admin/teachers/:id/assign-classes (Assign / update classes separately)
    async assignClasses(id, classes) {
        return new Promise(resolve => {
            const teacher = initialMockData.find(t => t._id === id);
            if (teacher) {
                teacher.assignedClasses = classes; // Update ONLY classes
                setTimeout(() => resolve(), 300);
            } else {
                throw new Error("Teacher not found");
            }
        });
    },

    // 7) DELETE /api/admin/teachers/:id (Soft delete)
    async remove(id) {
        return new Promise(resolve => {
            const teacher = initialMockData.find(t => t._id === id);
            if (teacher) {
                teacher.status = 'deleted'; // Soft delete
            }
            // For frontend list, we remove it on the client side after success, 
            // but the GET /all endpoint handles filtering.
            setTimeout(() => resolve(), 300);
        });
    }
};

// --- Helper Functions (Unchanged, but now rely on updated service) ---

const createDefaultTeacherFormData = () => ({
    _id: undefined as string | undefined,
    employeeId: '',
    firstName: '', lastName: '', gender: 'Male' as 'Male' | 'Female' | 'Other', dob: '',
    phone: '', email: '',
    department: mockDepartments[0], subjects: [] as string[], experienceYears: 0, qualification: '',
    assignedClasses: [] as AssignedClass[],
    status: 'active' as 'active' | 'inactive',
    // New fields for User creation payload
    username: '', 
    temporaryPassword: 'Password123!', // Default temporary password
});

const mapTeacherToFormData = (teacher: Teacher) => ({
    _id: teacher._id,
    employeeId: teacher.employeeId,
    firstName: teacher.personal.firstName,
    lastName: teacher.personal.lastName,
    gender: teacher.personal.gender,
    dob: teacher.personal.dob,
    phone: teacher.contact.phone,
    email: teacher.contact.email,
    department: teacher.professional.department,
    subjects: teacher.professional.subjects,
    experienceYears: teacher.professional.experienceYears,
    qualification: teacher.professional.qualification,
    assignedClasses: teacher.assignedClasses,
    status: teacher.status === 'deleted' ? 'inactive' : teacher.status, // Prevent 'deleted' from showing in dropdown
    username: teacher.contact.email, // Use email as username
    temporaryPassword: 'Password123!',
});

const calculateTeacherStats = (teachers: Teacher[]) => {
    const activeTeachers = teachers.filter(t => t.status === 'active');
    const totalTeachers = activeTeachers.length;
    const supportStaff = activeTeachers.filter(t => t.professional.department === 'Support').length;
    
    const totalAttendance = activeTeachers.reduce((sum, t) => sum + t.attendance, 0);
    const avgAttendance = totalTeachers > 0 ? (totalAttendance / totalTeachers).toFixed(0) : '0';
    
    return {
        totalTeachers,
        supportStaff,
        avgAttendance: `${avgAttendance}%`,
        classesPerDay: 6.2, 
    };
};

// --- ADD/EDIT MODAL COMPONENT (Updated to use GET by ID, separate APIs for save) ---
interface AddEditModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (isOpen: boolean) => void;
    initialTeacherId: string | null; // Now accepts ID instead of full object
    refreshTeachers: () => void;
}

const AddEditTeacherModal: React.FC<AddEditModalProps> = ({ 
    isModalOpen, 
    setIsModalOpen, 
    initialTeacherId, 
    refreshTeachers 
}) => {
    
    const isEditMode = !!initialTeacherId;
    
    const [formData, setFormData] = useState(createDefaultTeacherFormData());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(false);
    
    // Track original classes to determine if assignClasses API needs to be called separately
    const [originalAssignedClasses, setOriginalAssignedClasses] = useState<AssignedClass[]>([]);

    // C. GET /api/admin/teachers/:id - Fetch data when modal opens in edit mode
    useEffect(() => {
        if (isModalOpen) {
            if (initialTeacherId) {
                setIsDataLoading(true);
                TeachersService.getById(initialTeacherId)
                    .then(teacher => {
                        const mappedData = mapTeacherToFormData(teacher);
                        setFormData(mappedData);
                        setOriginalAssignedClasses(mappedData.assignedClasses);
                    })
                    .catch(error => console.error("Error fetching teacher details:", error))
                    .finally(() => setIsDataLoading(false));
            } else {
                setFormData(createDefaultTeacherFormData());
                setOriginalAssignedClasses([]);
            }
        }
    }, [isModalOpen, initialTeacherId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'experienceYears' ? Number(value) : value }));
    };

    const handleSelectChange = (key: keyof typeof formData, value: string | number) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubjectToggle = (subject: string) => {
        setFormData(prev => {
            const newSubjects = prev.subjects.includes(subject)
                ? prev.subjects.filter(s => s !== subject)
                : [...prev.subjects, subject];
            return { ...prev, subjects: newSubjects };
        });
    };

    // Class assignment handlers updated to manage form state (and called separately on submit)
    const handleAddAssignedClass = () => {
        setFormData(prev => ({
            ...prev,
            assignedClasses: [...prev.assignedClasses, { className: '10', section: 'A' }]
        }));
    };

    const handleUpdateAssignedClass = (index: number, key: keyof AssignedClass, value: string) => {
        setFormData(prev => ({
            ...prev,
            assignedClasses: prev.assignedClasses.map((ac, i) => 
                i === index ? { ...ac, [key]: value } : ac
            )
        }));
    };

    const handleRemoveAssignedClass = (index: number) => {
        setFormData(prev => ({
            ...prev,
            assignedClasses: prev.assignedClasses.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        const personalDetailsPayload = {
            personal: { firstName: formData.firstName, lastName: formData.lastName, gender: formData.gender, dob: formData.dob, },
            contact: { phone: formData.phone, email: formData.email, },
            professional: { department: formData.department, subjects: formData.subjects, experienceYears: Number(formData.experienceYears) || 0, qualification: formData.qualification, },
        };
        
        try {
            if (isEditMode && formData._id) {
                // 1. PUT /api/admin/teachers/:id (Update general details)
                await TeachersService.update(formData._id, personalDetailsPayload);

                // 2. D. PUT /api/admin/teachers/:id/assign-classes (Update classes separately if they changed)
                if (JSON.stringify(formData.assignedClasses) !== JSON.stringify(originalAssignedClasses)) {
                    await TeachersService.assignClasses(formData._id, formData.assignedClasses);
                }

                // Note: Status changes are handled via the separate toggle function, not here.

            } else {
                // A. POST /api/admin/teachers (Create Teacher + User account)
                const createPayload = {
                    ...personalDetailsPayload,
                    assignedClasses: formData.assignedClasses,
                    status: formData.status,
                    // Required User Creation Payload fields
                    role: 'teacher' as 'teacher',
                    username: formData.email,
                    temporaryPassword: formData.temporaryPassword,
                };
                await TeachersService.create(createPayload);
            }
            
            refreshTeachers();
            setIsModalOpen(false); 
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} teacher:`, error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableSubjects = mockSubjects[formData.department] || [];

    if (isDataLoading) {
        return (
             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-5xl h-[90vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /> Loading profile data...
                </DialogContent>
            </Dialog>
        );
    }
    
    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-5xl flex flex-col h-[90vh]">
                
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-2xl">{isEditMode ? 'Edit Staff Details' : 'Add New Staff Member'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? `Employee ID: ${formData.employeeId}` : 'Enter the details for the new staff member.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    
                    {/* PERSONAL & CONTACT DETAILS */}
                    <div className="space-y-4 form-section">
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center text-primary/80"><User className="h-4 w-4 mr-2"/> Personal & Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="dob">Date of Birth</Label><Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required /></div>
                            <div>
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {/* A. POST /api/admin/teachers requires username/email for user creation */}
                            <div><Label htmlFor="email">Email (Username)</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required /></div>
                            
                            {!isEditMode && (
                                <div><Label htmlFor="temporaryPassword">Temporary Password</Label><Input id="temporaryPassword" name="temporaryPassword" type="password" value={formData.temporaryPassword} onChange={handleInputChange} required /></div>
                            )}
                            
                            <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required /></div>
                            
                            {isEditMode && (
                                <div>
                                    <Label htmlFor="employeeId">Employee ID</Label>
                                    <Input id="employeeId" name="employeeId" value={formData.employeeId} readOnly className="bg-muted/30" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PROFESSIONAL DETAILS */}
                    <div className="space-y-4 form-section">
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center text-primary/80"><GraduationCap className="h-4 w-4 mr-2"/> Professional Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <Label htmlFor="department">Department</Label>
                                <Select 
                                    value={formData.department} 
                                    onValueChange={(value) => {
                                        setFormData(prev => ({ ...prev, department: value, subjects: [] })); 
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                                    <SelectContent>
                                        {mockDepartments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="qualification">Qualification</Label>
                                <Input id="qualification" name="qualification" value={formData.qualification} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="experienceYears">Experience (Years)</Label>
                                <Input id="experienceYears" name="experienceYears" type="number" min="0" value={formData.experienceYears} onChange={handleInputChange} required />
                            </div>
                            
                            {/* Subject Multi-Select */}
                            <div className="md:col-span-4 space-y-2">
                                <Label>Subjects Taught ({formData.department})</Label>
                                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                                    {availableSubjects.length > 0 ? (
                                        availableSubjects.map(subject => (
                                            <Toggle
                                                key={subject}
                                                pressed={formData.subjects.includes(subject)}
                                                onPressedChange={() => handleSubjectToggle(subject)}
                                                variant="outline"
                                                className={`h-8 px-3 text-sm ${formData.subjects.includes(subject) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                                            >
                                                {subject}
                                            </Toggle>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No subjects defined for this department.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* CLASS ASSIGNMENT MANAGEMENT */}
                    <div className="space-y-4 form-section">
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center justify-between text-primary/80">
                            <span className="flex items-center"><BookOpen className="h-4 w-4 mr-2"/> Assigned Classes</span>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddAssignedClass}>
                                <Plus className="h-3 w-3 mr-1" /> Assign Class
                            </Button>
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {formData.assignedClasses.map((assignment, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 border rounded-md bg-white shadow-sm">
                                    
                                    {/* Class Select */}
                                    <Select 
                                        value={assignment.className} 
                                        onValueChange={(value) => handleUpdateAssignedClass(index, 'className', value)}
                                    >
                                        <SelectTrigger className="w-[100px] h-9">
                                            <SelectValue placeholder="Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockClassDropdownValues.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    
                                    {/* Section Select */}
                                    <Select 
                                        value={assignment.section} 
                                        onValueChange={(value) => handleUpdateAssignedClass(index, 'section', value)}
                                    >
                                        <SelectTrigger className="w-[80px] h-9">
                                            <SelectValue placeholder="Sec" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockSectionValues.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon-sm" 
                                        onClick={() => handleRemoveAssignedClass(index)}
                                        className="text-destructive ml-auto"
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {formData.assignedClasses.length === 0 && (
                                <p className="text-sm text-muted-foreground md:col-span-3">Click 'Assign Class' to add a class/section assignment.</p>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-background/95">
                    <Button 
                        type="submit" 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || formData.subjects.length === 0 || !formData.firstName || !formData.email || !formData.qualification}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Save Changes' : 'Save Staff Member'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- SCHEDULE MANAGEMENT MODAL (Placeholder) ---
interface ScheduleModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (isOpen: boolean) => void;
    teacher: Teacher;
}

const ScheduleManagementModal: React.FC<ScheduleModalProps> = ({ isModalOpen, setIsModalOpen, teacher }) => {
    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>View Schedule: {teacher.personal.firstName} {teacher.personal.lastName}</DialogTitle>
                    <DialogDescription>
                        Current Class and Subject Assignments.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-4 p-4 border rounded-lg bg-muted/30">
                        <div>
                            <h4 className="font-semibold text-lg flex items-center mb-1">
                                <BookOpen className="h-4 w-4 mr-2" /> Subjects
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {teacher.professional.subjects.map((sub, index) => (
                                    <Badge key={index} variant="outline" className="bg-white">{sub}</Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg flex items-center mb-1">
                                <Users className="h-4 w-4 mr-2" /> Assigned Classes
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {teacher.assignedClasses.map((ac, index) => (
                                    <Badge key={index} variant="secondary">Class {ac.className}-{ac.section}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-background shadow-inner h-64 flex items-center justify-center">
                        <p className="text-lg text-muted-foreground flex items-center">
                            <Calendar className="h-6 w-6 mr-2" />
                            Weekly Schedule Grid Placeholder (Needs backend data integration)
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


// --- MAIN TEACHERS COMPONENT (Updated Action Handlers) ---
export default function Teachers() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterSubject, setFilterSubject] = useState('all');
    const [filterClass, setFilterClass] = useState('all');
    const [filterSection, setFilterSection] = useState('all');

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    // B. GET /api/admin/teachers/:id - Now stores only the ID for fetching fresh data
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [selectedTeacherData, setSelectedTeacherData] = useState<Teacher | null>(null); // For Schedule modal

    // Mock Stats (Calculated on data fetch)
    const [stats, setStats] = useState(calculateTeacherStats([]));
    
    const fetchTeachers = async () => {
        setIsLoading(true);
        try {
            const data = await TeachersService.getAll();
            setTeachers(data);
            setStats(calculateTeacherStats(data));
        } catch (err) {
            console.error("Failed to fetch teachers:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // Memoized Filtered List (Unchanged logic)
    const filteredTeachers = useMemo(() => {
        return teachers.filter((teacher) => {
            const searchLower = searchQuery.toLowerCase();
            const fullName = `${teacher.personal.firstName} ${teacher.personal.lastName}`.toLowerCase();

            const matchesSearch = 
                searchQuery.length === 0 ||
                fullName.includes(searchLower) ||
                teacher.employeeId.toLowerCase().includes(searchLower) ||
                teacher.professional.department.toLowerCase().includes(searchLower) ||
                teacher.professional.subjects.some(sub => sub.toLowerCase().includes(searchLower));

            const matchesDepartment = filterDepartment === 'all' || teacher.professional.department === filterDepartment;
            const matchesSubject = filterSubject === 'all' || teacher.professional.subjects.includes(filterSubject);

            const matchesClassSection = teacher.assignedClasses.some(ac => {
                const classMatch = filterClass === 'all' || ac.className === filterClass;
                const sectionMatch = filterSection === 'all' || ac.section === filterSection;
                return classMatch && sectionMatch;
            });
            
            return matchesSearch && matchesDepartment && matchesSubject && matchesClassSection;
        });
    }, [teachers, searchQuery, filterDepartment, filterSubject, filterClass, filterSection]);
    
    // --- Action Handlers (Updated for API compliance) ---

    const handleOpenAdd = () => {
        setSelectedTeacherId(null);
        setIsEditModalOpen(true);
    };

    const handleOpenEdit = (teacherId: string) => {
        setSelectedTeacherId(teacherId);
        setIsEditModalOpen(true);
    };

    const handleOpenView = async (teacherId: string) => {
        try {
            // B. GET /api/admin/teachers/:id - Fetch fresh data for viewing/scheduling
            const data = await TeachersService.getById(teacherId);
            setSelectedTeacherData(data);
            // Assuming we also use this for view profile
            // For now, we only open the schedule modal if data is fetched
            handleOpenSchedule(data); 
        } catch (error) {
            console.error("Failed to fetch teacher profile for viewing:", error);
        }
    };
    
    // Updated to accept full data object
    const handleOpenSchedule = (teacher: Teacher) => {
        setSelectedTeacherData(teacher);
        setIsScheduleModalOpen(true);
    };

    // C. PUT /api/admin/teachers/:id/status (Toggle status)
    const handleToggleStatus = async (teacher: Teacher) => {
        const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
        try {
            await TeachersService.updateStatus(teacher._id, newStatus);
            fetchTeachers(); // Refresh table
        } catch (error) {
            console.error("Failed to toggle status:", error);
        }
    };

    // E. DELETE /api/admin/teachers/:id (Soft delete)
    const handleDelete = async (teacherId: string, name: string) => {
        if (!window.confirm(`Are you sure you want to soft delete ${name}? They will be marked as inactive in the system.`)) return;
        try {
            await TeachersService.remove(teacherId);
            fetchTeachers(); // Refresh table, which filters out 'deleted' status
        } catch (error) {
            console.error("Failed to soft delete teacher:", error);
        }
    };
    
    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        setFilterDepartment('all');
        setFilterSubject('all');
        setFilterClass('all');
        setFilterSection('all');
    }, []);
    
    const isFilterActive = searchQuery !== '' || filterDepartment !== 'all' || filterSubject !== 'all' || filterClass !== 'all' || filterSection !== 'all';

    const subjectsForFilter = useMemo(() => {
        if (filterDepartment !== 'all' && mockSubjects[filterDepartment]) {
            return mockSubjects[filterDepartment];
        }
        const allSubjects = new Set<string>();
        Object.values(mockSubjects).forEach(subs => subs.forEach(sub => allSubjects.add(sub)));
        return Array.from(allSubjects).sort();
    }, [filterDepartment]);

    // RENDER: Teacher Table Content
    const renderTableContent = () => {
        if (filteredTeachers.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-lg text-muted-foreground">
                        No staff members found matching the current filters.
                    </TableCell>
                </TableRow>
            );
        }
        
        return filteredTeachers.map((teacher) => (
            <TableRow key={teacher._id} className="hover:bg-muted/30">
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                            <AvatarFallback className="bg-secondary/20 text-secondary text-sm font-medium">
                                {teacher.personal.firstName[0]}{teacher.personal.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{teacher.personal.firstName} {teacher.personal.lastName}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {teacher.contact.email}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">ID: {teacher.employeeId}</p>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    <div>
                        <p className="font-medium">{teacher.professional.department}</p>
                        <p className="text-xs text-muted-foreground">
                            {teacher.professional.subjects.join(', ')}
                        </p>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {teacher.assignedClasses.slice(0, 3).map((cls, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {cls.className}-{cls.section}
                            </Badge>
                        ))}
                        {teacher.assignedClasses.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{teacher.assignedClasses.length - 3}
                            </Badge>
                        )}
                    </div>
                </TableCell>
                <TableCell>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span>{teacher.workload}%</span>
                        </div>
                        <Progress
                            value={teacher.workload}
                            className={`h-2 ${
                                teacher.workload >= 90
                                    ? '[&>div]:bg-destructive'
                                    : teacher.workload >= 75
                                    ? '[&>div]:bg-warning'
                                    : '[&>div]:bg-success'
                            }`}
                        />
                    </div>
                </TableCell>
                <TableCell>
                    <span className={`font-medium ${
                        teacher.attendance >= 95
                            ? 'text-success'
                            : teacher.attendance >= 85
                            ? 'text-warning'
                            : 'text-destructive'
                    }`}>
                        {teacher.attendance}%
                    </span>
                </TableCell>
                <TableCell>
                    <Badge
                        variant={teacher.status === 'active' ? 'success' : 'warning'}
                        className={teacher.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}
                    >
                        {teacher.status}
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
                            <DropdownMenuItem onClick={() => handleOpenView(teacher._id)}><Eye className="h-4 w-4 mr-2" /> View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(teacher._id)}><Edit className="h-4 w-4 mr-2" /> Edit Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenSchedule(teacher)}><Calendar className="h-4 w-4 mr-2" /> View Schedule</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(teacher)}>
                                <RefreshCw className="h-4 w-4 mr-2" /> 
                                {teacher.status === 'active' ? 'Deactivate' : 'Activate'} Staff
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(teacher._id, `${teacher.personal.firstName} ${teacher.personal.lastName}`)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete (Soft)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        ));
    };

    const statCardsData = [
        { label: 'Total Teachers', value: stats.totalTeachers, icon: GraduationCap },
        { label: 'Support Staff', value: stats.supportStaff, icon: Users },
        { label: 'Avg. Attendance', value: stats.avgAttendance, icon: Clock },
        { label: 'Classes/Day', value: stats.classesPerDay, icon: BookOpen },
    ];

    return (
        <div className="space-y-6">
            
            {/* Add/Edit Modal */}
            <AddEditTeacherModal 
                isModalOpen={isEditModalOpen}
                setIsModalOpen={setIsEditModalOpen}
                initialTeacherId={selectedTeacherId} 
                refreshTeachers={fetchTeachers} 
            />
            
            {/* Schedule Modal */}
            {selectedTeacherData && (
                <ScheduleManagementModal
                    isModalOpen={isScheduleModalOpen}
                    setIsModalOpen={setIsScheduleModalOpen}
                    teacher={selectedTeacherData}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Teachers & Staff</h1>
                    <p className="text-muted-foreground">Manage teaching and support staff</p>
                </div>
                <Button onClick={handleOpenAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {statCardsData.map((stat) => (
                    <Card key={stat.label} className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <CardTitle className="text-2xl mt-1">{stat.value}</CardTitle>
                        </div>
                        <stat.icon className="h-8 w-8 text-primary opacity-30" />
                    </Card>
                ))}
            </div>

            {/* Filters Card */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px] sm:min-w-[250px] order-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, ID, subject, or department..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* A) Filter by Department */}
                        <Select value={filterDepartment} onValueChange={(val) => {
                            setFilterDepartment(val);
                            setFilterSubject('all'); 
                        }}>
                            <SelectTrigger className="w-full sm:w-[150px] order-2">
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {mockDepartments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        {/* B) Filter by Subject */}
                        <Select 
                            value={filterSubject} 
                            onValueChange={setFilterSubject}
                            disabled={filterDepartment !== 'all' && subjectsForFilter.length === 0}
                        >
                            <SelectTrigger className="w-full sm:w-[150px] order-3">
                                <SelectValue placeholder="Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {subjectsForFilter.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        {/* C) Filter by Class */}
                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger className="w-full sm:w-[120px] order-4">
                                <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {mockClassDropdownValues.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        {/* D) Filter by Section */}
                        <Select value={filterSection} onValueChange={setFilterSection}>
                            <SelectTrigger className="w-full sm:w-[100px] order-5">
                                <SelectValue placeholder="Section" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {mockSectionValues.map(sec => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        
                         {/* RESET Button */}
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
                    </div>
                </CardContent>
            </Card>

            {/* Teachers Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">All Teachers</CardTitle>
                        <Badge variant="secondary">{filteredTeachers.length} staff</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        {isLoading ? (
                             <div className="text-center py-8 text-lg text-primary">
                                <Loader2 className="h-6 w-6 inline-block mr-2 animate-spin" />
                                Fetching staff list...
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Teacher</TableHead>
                                        <TableHead>Department/Subject</TableHead>
                                        <TableHead>Classes</TableHead>
                                        <TableHead>Workload</TableHead>
                                        <TableHead>Attendance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderTableContent()}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div> 
    );
}