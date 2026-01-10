// src/pages/Teachers.tsx
import { useState, useEffect, useMemo } from 'react';
import { TeachersService } from '../Services/teachers.service';
import { Teacher, TeacherCreatePayload } from '../types/teacher';
import { useToast } from '@/components/ui/use-toast';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Icons
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  User,
  Briefcase,
  GraduationCap,
  Users,
  Award,
  Clock,
  Check,
  X,
  Download,
  RefreshCw,
  Loader2,
  Shield,
  Calendar,
  BookOpen,
  Settings,
  UserPlus,
  Mail as MailIcon
} from 'lucide-react';

// --- Constants ---
const INITIAL_DEPARTMENTS = [
  'Mathematics', 
  'Science', 
  'English', 
  'Social Studies',
  'Computer Science', 
  'Language', 
  'Physical Education', 
  'Arts',
  'Music',
  'Support'
];

const INITIAL_CLASSES = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const INITIAL_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

const INITIAL_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Hindi',
  'Social Studies',
  'Computer Science',
  'Physical Education',
  'Art',
  'Music'
];

// --- Teacher Form Types ---
interface TeacherFormData {
  _id?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  phone: string;
  email: string;
  department: string;
  subjects: string[];
  experienceYears: number;
  qualification: string;
  assignedClasses: Array<{ className: string; section: string }>;
  status: 'active' | 'inactive';
  password: string;
  address: string;
  emergencyContact: string;
  joiningDate: string;
}

// --- Helper Functions ---
const generateEmployeeId = (): string => {
  const randomNum = Math.floor(Math.random() * 10000);
  return `T${String(randomNum).padStart(6, '0')}`;
};

const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const length = 12;
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const createEmptyTeacherForm = (): TeacherFormData => ({
  employeeId: generateEmployeeId(),
  firstName: '',
  lastName: '',
  gender: 'Male',
  dob: '',
  phone: '',
  email: '',
  department: INITIAL_DEPARTMENTS[0],
  subjects: [],
  experienceYears: 0,
  qualification: '',
  assignedClasses: [],
  status: 'active',
  password: generatePassword(),
  address: '',
  emergencyContact: '',
  joiningDate: new Date().toISOString().split('T')[0],
});

const mapTeacherToForm = (teacher: Teacher): TeacherFormData => {
  const personal = teacher.personal as any;

  return {
    _id: teacher._id,
    employeeId: teacher.employeeId || generateEmployeeId(),
    firstName: personal?.firstName || '',
    lastName: personal?.lastName || '',
    gender: personal?.gender || 'Male',
    dob: personal?.dob ? new Date(personal.dob).toISOString().split('T')[0] : '',
    phone: teacher.contact?.phone || '',
    email: teacher.contact?.email || '',
    department: teacher.professional?.department || INITIAL_DEPARTMENTS[0],
    subjects: teacher.professional?.subjects || [],
    experienceYears: teacher.professional?.experienceYears || 0,
    qualification: teacher.professional?.qualification || '',
    assignedClasses: teacher.assignedClasses || [],
    status: teacher.status as 'active' | 'inactive',
    password: '', // Empty for edit mode
    address: personal?.address || '',
    emergencyContact: personal?.emergencyContact || '',
    joiningDate: personal?.joiningDate
      ? new Date(personal.joiningDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  };
};

// --- Add/Edit Teacher Modal ---
interface AddEditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string | null;
  onSuccess: () => void;
}

const AddEditTeacherModal: React.FC<AddEditTeacherModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TeacherFormData>(createEmptyTeacherForm());
  const [activeTab, setActiveTab] = useState('personal');
  const [newSubject, setNewSubject] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isEditMode = !!teacherId;

  useEffect(() => {
    if (isOpen && teacherId) {
      loadTeacherData();
    } else if (isOpen) {
      resetForm();
    }
  }, [isOpen, teacherId]);

  const loadTeacherData = async () => {
    setIsLoading(true);
    try {
      const teacher = await TeachersService.getById(teacherId!);
      setFormData(mapTeacherToForm(teacher));
    } catch (error: any) {
      console.error('Error loading teacher:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load teacher data',
        description: error.message || 'Please try again',
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(createEmptyTeacherForm());
    setNewSubject('');
    setConfirmPassword('');
    setActiveTab('personal');
  };

  const handleInputChange = (field: keyof TeacherFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => {
      const newSubjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects: newSubjects };
    });
  };

  const addCustomSubject = () => {
    const trimmed = newSubject.trim();
    if (!trimmed || formData.subjects.includes(trimmed)) return;
    
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, trimmed]
    }));
    setNewSubject('');
  };

  const addAssignedClass = () => {
    setFormData(prev => ({
      ...prev,
      assignedClasses: [...prev.assignedClasses, {
        className: INITIAL_CLASSES[0],
        section: INITIAL_SECTIONS[0]
      }]
    }));
  };

  const updateAssignedClass = (index: number, field: 'className' | 'section', value: string) => {
    setFormData(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.map((cls, i) =>
        i === index ? { ...cls, [field]: value } : cls
      )
    }));
  };

  const removeAssignedClass = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.firstName.trim()) {
      errors.push('First name is required');
    }

    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Valid email is required');
    }

    if (!isEditMode) {
      if (!formData.password) {
        errors.push('Password is required');
      } else if (formData.password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      } else if (formData.password !== confirmPassword) {
        errors.push('Passwords do not match');
      }
    }

    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: errors.join(', ')
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isEditMode && formData._id) {
        // Update teacher
        const updatePayload = {
          personal: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            gender: formData.gender,
            dob: formData.dob || undefined,
            address: formData.address || undefined,
            emergencyContact: formData.emergencyContact || undefined,
            joiningDate: formData.joiningDate || undefined
          } as any,
          contact: {
            phone: formData.phone,
            email: formData.email,
          },
          professional: {
            department: formData.department,
            subjects: formData.subjects,
            experienceYears: formData.experienceYears,
            qualification: formData.qualification,
          },
        };

        await TeachersService.update(formData._id, updatePayload);

        // Update assigned classes
        if (formData.assignedClasses.length > 0) {
          await TeachersService.assignClasses(formData._id, formData.assignedClasses);
        }

        toast({
          title: 'Teacher Updated',
          description: `${formData.firstName} ${formData.lastName} has been updated successfully`,
        });
      } else {
        // Create new teacher
                const createPayload: TeacherCreatePayload = {
                  email: formData.email,
                  password: formData.password,
                  role: 'teacher',
                  personal: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    gender: formData.gender,
                    dob: formData.dob || undefined,
                    address: formData.address || undefined,
                    emergencyContact: formData.emergencyContact || undefined,
                    joiningDate: formData.joiningDate || undefined
                  } as any,
                  contact: {
                    phone: formData.phone,
                    email: formData.email,
                  },
                  professional: {
                    department: formData.department,
                    subjects: formData.subjects,
                    experienceYears: formData.experienceYears,
                    qualification: formData.qualification,
                  },
                  assignedClasses: formData.assignedClasses
                };

        const response = await TeachersService.create(createPayload);
        const employeeId = (response as any)?.data?.employeeId || response.employeeId || formData.employeeId;
        
        toast({
          title: 'Teacher Created Successfully',
          description: `${formData.firstName} ${formData.lastName} has been added with Employee ID: ${employeeId}`,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting teacher:', error);
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: error.message || 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading teacher data...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Update details for ${formData.firstName} ${formData.lastName}`
              : 'Fill in the details to add a new teacher to the system'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: 'Male' | 'Female' | 'Other') => 
                    handleInputChange('gender', value)
                  }
                >
                  <SelectTrigger id="gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="teacher@school.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 1234567890"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="Emergency contact number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  placeholder="T000001"
                  disabled={isEditMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleInputChange('department', value)}
                >
                  <SelectTrigger id="department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INITIAL_DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange('qualification', e.target.value)}
                  placeholder="M.Sc., B.Ed., Ph.D."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceYears">Experience (Years)</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Subjects</Label>
              <div className="flex flex-wrap gap-2 mb-4">
                {INITIAL_SUBJECTS.map(subject => (
                  <Badge 
                    key={subject} 
                    variant={formData.subjects.includes(subject) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleSubjectToggle(subject)}
                  >
                    {subject}
                    {formData.subjects.includes(subject) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customSubject">Custom Subjects</Label>
                <div className="flex gap-2">
                  <Input
                    id="customSubject"
                    placeholder="Add new subject..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomSubject()}
                  />
                  <Button onClick={addCustomSubject} variant="outline">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.subjects
                    .filter(subject => !INITIAL_SUBJECTS.includes(subject))
                    .map((subject, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {subject}
                        <button
                          onClick={() => handleSubjectToggle(subject)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Assigned Classes</Label>
              <Button onClick={addAssignedClass} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Class
              </Button>
            </div>

            {formData.assignedClasses.length === 0 ? (
              <div className="text-center py-4 border-2 border-dashed rounded-lg">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No classes assigned yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Add Class" to assign classes to this teacher
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.assignedClasses.map((cls, index) => (
                  <div key={index} className="flex items-center gap-2 border p-3 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">Class</Label>
                        <Select
                          value={cls.className}
                          onValueChange={(value) => updateAssignedClass(index, 'className', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {INITIAL_CLASSES.map(c => (
                              <SelectItem key={c} value={c}>Class {c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Section</Label>
                        <Select
                          value={cls.section}
                          onValueChange={(value) => updateAssignedClass(index, 'section', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            {INITIAL_SECTIONS.map(s => (
                              <SelectItem key={s} value={s}>Section {s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAssignedClass(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') => handleInputChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeIdDisplay">Employee ID</Label>
                <Input
                  id="employeeIdDisplay"
                  value={formData.employeeId}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            {!isEditMode && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Enter password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => handleInputChange('password', generatePassword())}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Password must be at least 8 characters long. 
                      The teacher will use this password for their initial login.
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Create Teacher'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Teachers Component ---
export default function Teachers() {
  const { toast } = useToast();
  
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    departments: {} as Record<string, number>
  });

  // Fetch teachers
  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const data = await TeachersService.getAll();
      setTeachers(data);
      
      // Calculate stats
      const active = data.filter(t => t.status === 'active').length;
      const inactive = data.filter(t => t.status === 'inactive').length;
      
      const departments: Record<string, number> = {};
      data.forEach(teacher => {
        const dept = teacher.professional?.department || 'Unknown';
        departments[dept] = (departments[dept] || 0) + 1;
      });
      
      setStats({
        total: data.length,
        active,
        inactive,
        departments
      });
      
    } catch (error: any) {
      console.error('Failed to fetch teachers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load teachers'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const fullName = `${teacher.personal?.firstName || ''} ${teacher.personal?.lastName || ''}`.toLowerCase();
        const email = teacher.contact?.email?.toLowerCase() || '';
        const employeeId = teacher.employeeId?.toLowerCase() || '';
        const subjects = teacher.professional?.subjects?.join(' ').toLowerCase() || '';
        const qualification = teacher.professional?.qualification?.toLowerCase() || '';
        
        if (
          !fullName.includes(searchLower) && 
          !email.includes(searchLower) && 
          !employeeId.includes(searchLower) &&
          !subjects.includes(searchLower) &&
          !qualification.includes(searchLower)
        ) {
          return false;
        }
      }
      
      // Department filter
      if (filterDepartment !== 'all') {
        if (teacher.professional?.department !== filterDepartment) {
          return false;
        }
      }
      
      // Status filter
      if (filterStatus !== 'all') {
        if (teacher.status !== filterStatus) {
          return false;
        }
      }
      
      return true;
    });
  }, [teachers, searchQuery, filterDepartment, filterStatus]);

  // Available departments for filter
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    teachers.forEach(teacher => {
      if (teacher.professional?.department) {
        depts.add(teacher.professional.department);
      }
    });
    return ['all', ...Array.from(depts).sort()];
  }, [teachers]);

  // Handlers
  const handleAddTeacher = () => {
    setSelectedTeacherId(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!window.confirm(`Are you sure you want to delete ${teacher.personal?.firstName} ${teacher.personal?.lastName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await TeachersService.remove(teacher._id);
      toast({
        title: 'Teacher Deleted',
        description: `${teacher.personal?.firstName} ${teacher.personal?.lastName} has been deleted successfully`
      });
      fetchTeachers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete teacher'
      });
    }
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!window.confirm(`Are you sure you want to ${action} ${teacher.personal?.firstName} ${teacher.personal?.lastName}?`)) {
      return;
    }
    
    try {
      await TeachersService.updateStatus(teacher._id, newStatus);
      toast({
        title: 'Status Updated',
        description: `${teacher.personal?.firstName} ${teacher.personal?.lastName} has been ${action}d`
      });
      fetchTeachers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update status'
      });
    }
  };

  const handleExport = () => {
    if (filteredTeachers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data',
        description: 'No teachers to export'
      });
      return;
    }

    try {
      const csvData = filteredTeachers.map(teacher => ({
        'Employee ID': teacher.employeeId || '',
        'First Name': teacher.personal?.firstName || '',
        'Last Name': teacher.personal?.lastName || '',
        'Gender': teacher.personal?.gender || '',
        'Date of Birth': teacher.personal?.dob ? 
          new Date(teacher.personal.dob).toLocaleDateString() : '',
        'Department': teacher.professional?.department || '',
        'Email': teacher.contact?.email || '',
        'Phone': teacher.contact?.phone || '',
        'Status': teacher.status || '',
        'Experience (Years)': teacher.professional?.experienceYears || 0,
        'Qualification': teacher.professional?.qualification || '',
        'Subjects': teacher.professional?.subjects?.join('; ') || '',
        'Assigned Classes': teacher.assignedClasses?.map(c => `${c.className}-${c.section}`).join('; ') || '',
        'Joining Date': (teacher.personal as any)?.joiningDate ? 
          new Date((teacher.personal as any).joiningDate).toLocaleDateString() : ''
      }));

      const csvHeaders = Object.keys(csvData[0] || {});
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => 
          csvHeaders.map(header => 
            `"${(row[header as keyof typeof row] || '').toString().replace(/"/g, '""')}"`
          ).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `teachers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Exported ${filteredTeachers.length} teachers to CSV`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export teachers data'
      });
    }
  };

  // Stats cards
  const statCards = [
    {
      title: 'Total Teachers',
      value: stats.total,
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      description: 'All teaching staff'
    },
    {
      title: 'Active',
      value: stats.active,
      icon: Check,
      color: 'bg-green-50 text-green-600 border-green-200',
      description: 'Currently active'
    },
    {
      title: 'Inactive',
      value: stats.inactive,
      icon: X,
      color: 'bg-red-50 text-red-600 border-red-200',
      description: 'Not currently active'
    },
    {
      title: 'Departments',
      value: Object.keys(stats.departments).length,
      icon: Briefcase,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      description: 'Different departments'
    }
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Add/Edit Modal */}
      <AddEditTeacherModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        teacherId={selectedTeacherId}
        onSuccess={fetchTeachers}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers & Staff</h1>
          <p className="text-muted-foreground mt-1">
            Manage teaching staff, assignments, and performance metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={fetchTeachers} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={filteredTeachers.length === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAddTeacher} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, employee ID, subjects..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept === 'all' ? 'All Departments' : dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDepartment('all');
                    setFilterStatus('all');
                  }}
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTeachers.length} of {teachers.length} teachers
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              
              {teachers.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="px-2 py-1">
                    Active: {stats.active}
                  </Badge>
                  <Badge variant="outline" className="px-2 py-1">
                    Inactive: {stats.inactive}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Loading teachers...</p>
              <p className="text-muted-foreground mt-1">Please wait while we fetch the data</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No teachers found</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {teachers.length === 0 
                  ? 'No teachers have been added yet. Add your first teacher to get started.' 
                  : 'Try adjusting your search or filters to find what you\'re looking for.'
                }
              </p>
              {teachers.length === 0 && (
                <Button onClick={handleAddTeacher} size="lg" className="gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add First Teacher
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Teacher</TableHead>
                      <TableHead className="w-[150px]">Department</TableHead>
                      <TableHead className="w-[200px]">Contact</TableHead>
                      <TableHead className="w-[200px]">Subjects</TableHead>
                      <TableHead className="w-[150px]">Classes</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[50px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher._id} className="group hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {teacher.personal?.firstName?.[0]}{teacher.personal?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <p className="font-medium">
                                {teacher.personal?.firstName} {teacher.personal?.lastName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {teacher.employeeId}
                                </span>
                                {teacher.personal?.gender && (
                                  <Badge variant="outline" className="text-xs px-1">
                                    {teacher.personal.gender}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {teacher.professional?.department || 'No Department'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <MailIcon className="h-3 w-3 text-muted-foreground" />
                              <a 
                                href={`mailto:${teacher.contact?.email}`}
                                className="text-sm hover:text-primary hover:underline truncate"
                                title={teacher.contact?.email}
                              >
                                {teacher.contact?.email || 'No email'}
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm truncate" title={teacher.contact?.phone}>
                                {teacher.contact?.phone || 'No phone'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {teacher.professional?.subjects?.slice(0, 3).map((subject, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs font-normal">
                                {subject}
                              </Badge>
                            ))}
                            {(teacher.professional?.subjects?.length || 0) > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(teacher.professional?.subjects?.length || 0) - 3}
                              </Badge>
                            )}
                            {(teacher.professional?.subjects?.length || 0) === 0 && (
                              <span className="text-xs text-muted-foreground italic">No subjects</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacher.assignedClasses?.slice(0, 2).map((cls, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {cls.className}-{cls.section}
                              </Badge>
                            ))}
                            {(teacher.assignedClasses?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(teacher.assignedClasses?.length || 0) - 2}
                              </Badge>
                            )}
                            {(teacher.assignedClasses?.length || 0) === 0 && (
                              <span className="text-xs text-muted-foreground italic">No classes</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={teacher.status === 'active' ? 'default' : 'secondary'}
                            className={
                              teacher.status === 'active'
                                ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200'
                            }
                          >
                            {teacher.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditTeacher(teacher._id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Teacher
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(teacher)}
                                className={
                                  teacher.status === 'active' 
                                    ? 'text-amber-600' 
                                    : 'text-green-600'
                                }
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                {teacher.status === 'active' ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteTeacher(teacher)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Teacher
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}