import { useState, useEffect, useMemo, useCallback } from 'react';
import { TeachersService } from '../Services/teachers.service';
import { Teacher, AssignedClass, TeacherCreatePayload, TeacherUpdateDetailsPayload } from '../types/teacher';
import { useAuth } from '../contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { 
    Search, Plus, GraduationCap, Users, Clock, BookOpen, Mail, MoreVertical, 
    Trash2, Eye, Edit, RefreshCw, Loader2, XCircle, Calendar, User
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle'; 

// --- STATIC CONFIGURATION ---
const initialDepartments = ['Mathematics', 'Science', 'English', 'Support', 'Computer Science', 'Language', 'Physical Education'];
const initialClassDropdownValues = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const initialSectionValues = ['A', 'B', 'C', 'D'];

// --- Helper Functions ---
const createDefaultTeacherFormData = (defaultDept: string) => ({
    _id: undefined as string | undefined,
    employeeId: '',
    firstName: '', lastName: '', gender: 'Male' as 'Male' | 'Female' | 'Other', dob: '',
    phone: '', email: '',
    department: defaultDept, 
    subjects: [] as string[], 
    experienceYears: 0, 
    qualification: '',
    assignedClasses: [] as AssignedClass[],
    status: 'active' as 'active' | 'inactive',
    username: '', 
    temporaryPassword: 'Password123!', 
});

const mapTeacherToFormData = (teacher: Teacher) => ({
    _id: teacher._id,
    employeeId: teacher.employeeId,
    firstName: teacher.personal.firstName,
    lastName: teacher.personal.lastName,
    gender: teacher.personal.gender,
    dob: teacher.personal.dob ? new Date(teacher.personal.dob).toISOString().split('T')[0] : '', 
    phone: teacher.contact.phone,
    email: teacher.contact.email,
    department: teacher.professional.department,
    subjects: teacher.professional.subjects,
    experienceYears: teacher.professional.experienceYears,
    qualification: teacher.professional.qualification,
    assignedClasses: teacher.assignedClasses,
    status: teacher.status === 'deleted' ? 'inactive' : (teacher.status as 'active' | 'inactive'),
    username: teacher.contact.email,
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

// --- ADD/EDIT MODAL COMPONENT ---
interface AddEditModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (isOpen: boolean) => void;
    initialTeacherId: string | null; 
    refreshTeachers: () => void;
    allSubjects: Record<string, string[]>;
    allDepartments: string[];
    allClasses: string[];
    allSections: string[];
}

const AddEditTeacherModal: React.FC<AddEditModalProps> = ({ 
    isModalOpen, 
    setIsModalOpen, 
    initialTeacherId, 
    refreshTeachers,
    allSubjects,
    allDepartments,
    allClasses,
    allSections,
}) => {
    
    const isEditMode = !!initialTeacherId;
    
    const [formData, setFormData] = useState(createDefaultTeacherFormData(allDepartments[0] || initialDepartments[0]));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [originalAssignedClasses, setOriginalAssignedClasses] = useState<AssignedClass[]>([]);

    const [customSubjects, setCustomSubjects] = useState<string[]>([]);
    const [newSubjectInput, setNewSubjectInput] = useState('');

    useEffect(() => {
        if (isModalOpen) {
            setCustomSubjects([]); 
            setNewSubjectInput('');

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
                setFormData(createDefaultTeacherFormData(allDepartments[0] || initialDepartments[0]));
                setOriginalAssignedClasses([]);
            }
        }
    }, [isModalOpen, initialTeacherId]); 
    
    useEffect(() => {
        if (isModalOpen) {
             setCustomSubjects([]);
             setNewSubjectInput('');
        }
    }, [formData.department, isModalOpen]);

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

    const handleAddCustomSubject = () => {
        const value = newSubjectInput.trim();
        if (!value) return;
        
        if (availableSubjects.includes(value)) {
            setNewSubjectInput(''); 
            return;
        }
     
        setCustomSubjects(prev => [...prev, value]);
        setFormData(prev => ({
            ...prev,
            subjects: [...prev.subjects, value], 
        }));
        setNewSubjectInput('');
    };

    const handleAddAssignedClass = () => {
        setFormData(prev => ({
            ...prev,
            assignedClasses: [...prev.assignedClasses, { className: allClasses[0] || initialClassDropdownValues[0], section: allSections[0] || initialSectionValues[0] }]
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
        // 1. DUPLICATE CHECK
        const uniqueCheck = new Set(formData.assignedClasses.map(ac => `${ac.className}-${ac.section}`));
        if (uniqueCheck.size !== formData.assignedClasses.length) {
            alert("Duplicate class/section assignments found. Please ensure each assignment is unique.");
            return;
        }

        setIsSubmitting(true);

        const detailsPayload: TeacherUpdateDetailsPayload = {
            personal: { firstName: formData.firstName, lastName: formData.lastName, gender: formData.gender, dob: formData.dob, },
            contact: { phone: formData.phone, email: formData.email, },
            professional: { 
                department: formData.department, 
                subjects: formData.subjects, 
                experienceYears: Number(formData.experienceYears) || 0, 
                qualification: formData.qualification, 
            },
        };

        // 2. SANITIZE CLASS PAYLOAD
        const cleanAssignedClasses = formData.assignedClasses.map(({ className, section }) => ({
            className,
            section
        }));
        
        try {
            if (isEditMode && formData._id) {
                // UPDATE
                await TeachersService.update(formData._id, detailsPayload);

                // CHECK IF CLASSES CHANGED
                const originalClean = originalAssignedClasses.map(({ className, section }) => ({ className, section }));
                
                if (JSON.stringify(cleanAssignedClasses) !== JSON.stringify(originalClean)) {
                    // This call sends the array. The Service file wraps it in { assignedClasses: [...] }
                    await TeachersService.assignClasses(formData._id, cleanAssignedClasses);
                }

            } else {
                // CREATE
                const createPayload = {
                    employeeId: formData.employeeId,
                    designation: 'Teacher', 
                    personal: detailsPayload.personal,
                    contact: detailsPayload.contact,
                    professional: {
                        ...detailsPayload.professional,
                        subjects: formData.subjects ?? []
                    },
                    assignedClasses: cleanAssignedClasses,
                    password: formData.temporaryPassword,
                    confirmPassword: formData.temporaryPassword, 
                };
                
                await TeachersService.create(createPayload as unknown as TeacherCreatePayload); 
            }
            
            refreshTeachers();
            setIsModalOpen(false); 
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} teacher:`, error);
            alert("An error occurred. Please check console for details.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableSubjects = useMemo(() => {
        return [
            ...(allSubjects[formData.department] || []),
            ...customSubjects,
        ].filter((value, index, self) => self.indexOf(value) === index); 
    }, [allSubjects, formData.department, customSubjects]);


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
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center text-primary/80">
                            <User className="h-4 w-4 mr-2" /> Personal & Contact
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                            {/* Employee ID (Add Mode Only) */}
                            {!isEditMode && (
                                <div>
                                    <Label htmlFor="employeeId">Employee ID</Label>
                                    <Input
                                        id="employeeId" name="employeeId"
                                        placeholder="EMP-004"
                                        value={formData.employeeId} onChange={handleInputChange} required
                                    />
                                </div>
                            )}

                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                            </div>

                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                            </div>

                            <div>
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
                            </div>

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
                                        {allDepartments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
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
                                        <>
                                            <p className="text-sm text-muted-foreground mb-2 w-full">No subjects defined for this department. Add manually.</p>
                                            <div className="flex gap-2 w-full">
                                                <Input
                                                    placeholder="Enter subject name..."
                                                    value={newSubjectInput}
                                                    onChange={(e) => setNewSubjectInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSubject()} 
                                                />
                                                <Button type="button" onClick={handleAddCustomSubject}>Add Subject</Button>
                                            </div>
                                        </>
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
                                    <Select 
                                        value={assignment.className} 
                                        onValueChange={(value) => handleUpdateAssignedClass(index, 'className', value)}
                                    >
                                        <SelectTrigger className="w-[100px] h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                                        <SelectContent>
                                            {allClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    
                                    <Select 
                                        value={assignment.section} 
                                        onValueChange={(value) => handleUpdateAssignedClass(index, 'section', value)}
                                    >
                                        <SelectTrigger className="w-[80px] h-9"><SelectValue placeholder="Sec" /></SelectTrigger>
                                        <SelectContent>
                                            {allSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    
                                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleRemoveAssignedClass(index)} className="text-destructive ml-auto">
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
                        disabled={isSubmitting || !formData.firstName || !formData.email || !formData.qualification}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Save Changes' : 'Save Staff Member'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- SCHEDULE MANAGEMENT MODAL (Read-Only View) ---
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
                    <DialogDescription>Employee ID: {teacher.employeeId} | {teacher.contact.email}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-4 p-4 border rounded-lg bg-muted/30">
                        <div>
                            <h4 className="font-semibold text-lg flex items-center mb-1"><BookOpen className="h-4 w-4 mr-2" /> Subjects</h4>
                            <div className="flex flex-wrap gap-2">
                                {teacher.professional.subjects.map((sub, index) => (
                                    <Badge key={index} variant="outline" className="bg-white">{sub}</Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg flex items-center mb-1"><Users className="h-4 w-4 mr-2" /> Assigned Classes</h4>
                            <div className="flex flex-wrap gap-2">
                                {teacher.assignedClasses.map((ac, index) => (
                                    <Badge key={index} variant="secondary">Class {ac.className}-{ac.section}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-background shadow-inner h-64 flex items-center justify-center">
                        <p className="text-lg text-muted-foreground flex items-center"><Calendar className="h-6 w-6 mr-2" /> Weekly Schedule Grid Placeholder</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


// --- MAIN TEACHERS COMPONENT (API Integrated) ---
export default function Teachers() {
    const { isAuthenticated } = useAuth();
    
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    
    // Dynamically loaded filter options
    const [dynamicDepartments, setDynamicDepartments] = useState<string[]>(initialDepartments);
    const [dynamicSubjects, setDynamicSubjects] = useState<Record<string, string[]>>({});
    const [dynamicClasses, setDynamicClasses] = useState<string[]>(initialClassDropdownValues);
    const [dynamicSections, setDynamicSections] = useState<string[]>(initialSectionValues);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterSubject, setFilterSubject] = useState('all');
    const [filterClass, setFilterClass] = useState('all');
    const [filterSection, setFilterSection] = useState('all');

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [selectedTeacherData, setSelectedTeacherData] = useState<Teacher | null>(null); 

    // Stats
    const [stats, setStats] = useState(calculateTeacherStats([]));
    
    // --- Data Fetching and Dynamic Filter Population ---
    const populateFilters = useCallback((data: Teacher[]) => {
        const uniqueDepts = new Set<string>(initialDepartments); 
        const subjectMap: Record<string, Set<string>> = {};
        const uniqueClasses = new Set<string>(initialClassDropdownValues); 
        const uniqueSections = new Set<string>(initialSectionValues); 

        data.forEach(teacher => {
            uniqueDepts.add(teacher.professional.department);
            
            if (!subjectMap[teacher.professional.department]) {
                subjectMap[teacher.professional.department] = new Set();
            }
            teacher.professional.subjects.forEach(sub => {
                subjectMap[teacher.professional.department].add(sub);
            });
            
            teacher.assignedClasses.forEach(ac => {
                uniqueClasses.add(ac.className);
                uniqueSections.add(ac.section);
            });
        });

        setDynamicDepartments(Array.from(uniqueDepts).sort());
        
        const finalSubjectMap: Record<string, string[]> = {};
        for (const [dept, subjects] of Object.entries(subjectMap)) {
            finalSubjectMap[dept] = Array.from(subjects).sort();
        }
        setDynamicSubjects(finalSubjectMap);
        setDynamicClasses(Array.from(uniqueClasses).sort());
        setDynamicSections(Array.from(uniqueSections).sort());
    }, []);

    const fetchTeachers = async () => {
        if (!isAuthenticated) {
            setIsLoading(false);
            setIsError(true);
            return;
        }

        setIsLoading(true);
        setIsError(false);

        try {
            const data = await TeachersService.getAll();
            const activeTeachers = data.filter(t => t.status !== 'deleted');

            setTeachers(activeTeachers);
            setStats(calculateTeacherStats(activeTeachers));
            populateFilters(activeTeachers);

        } catch (err) {
            console.error("Failed to fetch teachers:", err);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, [isAuthenticated]); 

    // Memoized Filtered List 
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

            // ✅ FIX: Allow "Support" staff (0 classes) to show when filters are 'all'
            const matchesClassSection = 
                (filterClass === 'all' && filterSection === 'all') 
                ? true 
                : teacher.assignedClasses.some(ac => {
                    const classMatch = filterClass === 'all' || ac.className === filterClass;
                    const sectionMatch = filterSection === 'all' || ac.section === filterSection;
                    return classMatch && sectionMatch;
                });
            
            return matchesSearch && matchesDepartment && matchesSubject && matchesClassSection;
        });
    }, [teachers, searchQuery, filterDepartment, filterSubject, filterClass, filterSection]);
    
    // --- Action Handlers ---
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
            const data = await TeachersService.getById(teacherId);
            setSelectedTeacherData(data);
            handleOpenSchedule(data); 
        } catch (error) {
            console.error("Failed to fetch teacher profile for viewing:", error);
        }
    };
    
    const handleOpenSchedule = (teacher: Teacher) => {
        setSelectedTeacherData(teacher);
        setIsScheduleModalOpen(true);
    };

    const handleToggleStatus = async (teacher: Teacher) => {
        const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
        try {
            await TeachersService.updateStatus(teacher._id, newStatus);
            fetchTeachers(); 
        } catch (error) {
            console.error("Failed to toggle status:", error);
        }
    };

    const handleDelete = async (teacherId: string, name: string) => {
        if (!window.confirm(`Are you sure you want to soft delete ${name}?`)) return;
        try {
            await TeachersService.remove(teacherId);
            fetchTeachers(); 
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
        if (filterDepartment !== 'all' && dynamicSubjects[filterDepartment]) {
            return dynamicSubjects[filterDepartment];
        }
        const allSubjects = new Set<string>();
        Object.values(dynamicSubjects).forEach(subs => subs.forEach(sub => allSubjects.add(sub)));
        return Array.from(allSubjects).sort();
    }, [filterDepartment, dynamicSubjects]);

    // RENDER: Teacher Table Content
    const renderTableContent = () => {
        if (isError) {
            return (
                 <TableRow>
                     <TableCell colSpan={7} className="text-center py-8 text-lg text-destructive">
                         Error loading staff list. Ensure you are authenticated and the backend is running.
                         <Button variant="ghost" className="ml-4 text-sm" onClick={fetchTeachers}>
                             <RefreshCw className="h-4 w-4 mr-1" /> Retry
                         </Button>
                     </TableCell>
                 </TableRow>
             );
        }
        if (filteredTeachers.length === 0 && !isLoading) {
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
                        variant={teacher.status === 'active' ? 'default' : 'secondary'}
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
                allSubjects={dynamicSubjects}
                allDepartments={dynamicDepartments}
                allClasses={dynamicClasses}
                allSections={dynamicSections}
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

                        {/* Filters */}
                        <Select value={filterDepartment} onValueChange={(val) => { setFilterDepartment(val); setFilterSubject('all'); }}>
                            <SelectTrigger className="w-full sm:w-[150px] order-2"><SelectValue placeholder="Department" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {dynamicDepartments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filterSubject} 
                            onValueChange={setFilterSubject}
                            disabled={filterDepartment !== 'all' && subjectsForFilter.length === 0}
                        >
                            <SelectTrigger className="w-full sm:w-[150px] order-3"><SelectValue placeholder="Subject" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {subjectsForFilter.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger className="w-full sm:w-[120px] order-4"><SelectValue placeholder="Class" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {dynamicClasses.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={filterSection} onValueChange={setFilterSection}>
                            <SelectTrigger className="w-full sm:w-[100px] order-5"><SelectValue placeholder="Section" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {dynamicSections.map(sec => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        
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