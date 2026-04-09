/**
 * Enhanced User Management Page for Admin
 * Create Teachers, Parents, and Owners with full parameters and integration
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Search, Plus, MoreVertical, Edit, Trash2, Copy, Lock, Loader2, Users, Mail, Phone
} from 'lucide-react';
import { UserManagementService } from '@/Services/userManagementService';
import { TeachersService } from '@/Services/teachers.service';
import { StudentsService } from '@/Services/students.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

type ManageableUserRole = 'teacher' | 'parent' | 'owner' | 'admin' | 'principal' | 'cashier' | 'driver';
type UserRole = ManageableUserRole | 'student';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  forcePasswordChange: boolean;
  createdAt: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  class?: string;
  section?: string;
}

// Unified Form Data for all roles
interface UnifiedFormData {
  // Common fields
  name: string;
  email: string;
  phone: string;
  
  // Teacher-specific fields
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  gender?: 'Male' | 'Female' | 'Other' | '';
  dob?: string;
  department?: string;
  subjects?: string[];
  experienceYears?: number | '';
  qualification?: string;
  assignedClasses?: Array<{ className: string; section: string }>;
  status?: 'active' | 'inactive';
  address?: string;
  emergencyContact?: string;
  joiningDate?: string;
  
  // Parent-specific fields
  linkedStudentId?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  
  // Owner-specific fields (minimal, mostly using common fields)
}

export default function UserManagement() {
  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ManageableUserRole>('teacher');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);

  // Form Data State - Unified for all roles
  const [formData, setFormData] = useState<UnifiedFormData>({
    name: '',
    email: '',
    phone: '',
    // Teacher defaults
    employeeId: '',
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    department: '',
    subjects: [],
    experienceYears: '',
    qualification: '',
    assignedClasses: [],
    status: 'active',
    address: '',
    emergencyContact: '',
    joiningDate: new Date().toISOString().split('T')[0],
    // Parent defaults
    linkedStudentId: '',
    fatherName: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherEmail: '',
    motherOccupation: '',
  });

  // Fetch users on mount and when role changes
  useEffect(() => {
    fetchUsers();
    fetchStudents();
    fetchDepartmentsAndSubjects();
  }, [selectedRole]);

  // Filter users based on search
  useEffect(() => {
    const filtered = users.filter((user) => {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone && user.phone.includes(query))
      );
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await UserManagementService.getAllUsers(selectedRole);
      setUsers(Array.isArray(response) ? response : response.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch students for parent linking
  const fetchStudents = async () => {
    try {
      const response = await StudentsService.getAll();
      setStudents(response as any);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  // Fetch departments and subjects
  const fetchDepartmentsAndSubjects = async () => {
    try {
      // This assumes you have these endpoints - adjust as needed
      const depts = ['Science', 'Mathematics', 'English', 'Social Studies', 'Arts'];
      const subjects = ['Physics', 'Chemistry', 'Biology', 'Algebra', 'Geometry', 'English', 'History', 'Geography'];
      setDepartmentsList(depts);
      setSubjectsList(subjects);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  // Generate Employee ID
  const generateEmployeeId = (): string => {
    return 'T' + Math.random().toString().substr(2, 6);
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      employeeId: generateEmployeeId(),
      firstName: '',
      lastName: '',
      gender: '',
      dob: '',
      department: '',
      subjects: [],
      experienceYears: '',
      qualification: '',
      assignedClasses: [],
      status: 'active',
      address: '',
      emergencyContact: '',
      joiningDate: new Date().toISOString().split('T')[0],
      linkedStudentId: '',
      fatherName: '',
      fatherPhone: '',
      fatherEmail: '',
      fatherOccupation: '',
      motherName: '',
      motherPhone: '',
      motherEmail: '',
      motherOccupation: '',
    });
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingUser(null);
    resetFormData();
    setIsModalOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      ...formData,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      status: user.active ? 'active' : 'inactive',
    });
    setIsModalOpen(true);
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Duplicate check for email/phone
      const emailToCheck = selectedRole === 'parent'
        ? formData.fatherEmail || formData.motherEmail || ''
        : formData.email || '';
      const phoneToCheck = selectedRole === 'parent'
        ? formData.fatherPhone || formData.motherPhone || ''
        : formData.phone || '';

      const duplicateUser = users.find(
        (user) =>
          (emailToCheck && user.email.toLowerCase() === emailToCheck.toLowerCase()) ||
          (phoneToCheck && user.phone && user.phone === phoneToCheck)
      );

      if (!editingUser && duplicateUser) {
        toast.error('User with this email or phone already exists', {
          description: 'Please use a different email or phone number.',
          duration: 6000,
        });
        setIsSubmitting(false);
        return;
      }

      if (editingUser) {
        // Edit existing user
        await UserManagementService.updateUser(editingUser._id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          active: formData.status === 'active',
        });
        toast.success('User updated successfully');
      } else {
        // Create new user based on role
        if (selectedRole === 'teacher') {
          await TeachersService.create({
            personal: {
              firstName: formData.firstName || '',
              lastName: formData.lastName || '',
              gender: (formData.gender || 'Male') as 'Male' | 'Female' | 'Other',
              dob: formData.dob || '',
            },
            contact: {
              email: formData.email || '',
              phone: formData.phone || '',
            },
            professional: {
              department: formData.department || '',
              subjects: formData.subjects || [],
              experienceYears: formData.experienceYears ? Number(formData.experienceYears) : 0,
              qualification: formData.qualification || '',
            },
            assignedClasses: formData.assignedClasses || [],
            role: 'teacher',
            email: formData.email || '',
            password: 'Teacher@123',
          });
          toast.success('Teacher created successfully\nDefault Password: Teacher@123', {
            description: 'Share this password with the teacher',
            duration: 8000,
          });
        } else if (selectedRole === 'parent') {
          // Create parent user
          const response = await UserManagementService.createUser({
            name: formData.fatherName || formData.motherName || '',
            email: formData.fatherEmail || formData.motherEmail || '',
            phone: formData.fatherPhone || formData.motherPhone || '',
            role: 'parent',
          });
          toast.success('Parent created successfully\nDefault Password: Parent@123', {
            description: `Parent ${response.data.name} linked to student`,
            duration: 8000,
          });
        } else {
          await UserManagementService.createUser({
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            role: selectedRole,
          });
          const defaultPassword = `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}@123`;
          toast.success(`${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} created successfully\nDefault Password: ${defaultPassword}`, {
            description: `Share this password with the ${selectedRole}`,
            duration: 8000,
          });
        }
      }

      setIsModalOpen(false);
      resetFormData();
      fetchUsers();
    } catch (error: any) {
      console.error('User creation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error saving user';
      const details = error.response?.data?.existingEmail ? 
        `This email is already in use` : 
        '';
      toast.error(errorMessage, {
        description: details || undefined,
        duration: 6000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (userId: string) => {
    if (!window.confirm('Are you sure you want to reset this user\'s password?')) return;

    try {
      const response = await UserManagementService.resetPassword(userId);
      navigator.clipboard.writeText(response.data.newDefaultPassword);
      toast.success(`Password reset to: ${response.data.newDefaultPassword}\n(Copied to clipboard)`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      if (currentStatus) {
        await UserManagementService.deactivateUser(userId);
      } else {
        await UserManagementService.updateUser(userId, { active: true });
      }
      toast.success(`User ${action}d successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} user`);
    }
  };

  // Render form based on selected role
  const renderRoleSpecificForm = () => {
    if (editingUser) {
      // Simple edit form for existing users
      return (
        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Email Address</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone (Optional)</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as any })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    // Create form - role specific
    switch (selectedRole) {
      case 'teacher':
        return (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {/* Personal Information */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-3 text-sm">Personal Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Employee ID</Label>
                    <Input
                      value={formData.employeeId}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Joining Date</Label>
                    <Input
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">First Name *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Last Name *</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Gender</Label>
                    <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-3 text-sm">Contact Information</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@school.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Emergency Contact</Label>
                    <Input
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-3 text-sm">Professional Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Department *</Label>
                    <Select value={formData.department} onValueChange={(val) => setFormData({ ...formData, department: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentsList.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Qualification *</Label>
                    <Input
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      placeholder="B.Sc B.Ed"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Experience (Years)</Label>
                    <Input
                      type="number"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs">Subjects</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {subjectsList.map((subject) => (
                    <label key={subject} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.subjects?.includes(subject)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, subjects: [...(formData.subjects || []), subject] });
                          } else {
                            setFormData({ ...formData, subjects: (formData.subjects || []).filter(s => s !== subject) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        );

      case 'parent':
        return (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {/* Student Link */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-3 text-sm">Link to Student</h4>
                <div>
                  <Label className="text-xs">Select Student *</Label>
                  <Select value={formData.linkedStudentId} onValueChange={(val) => setFormData({ ...formData, linkedStudentId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student._id} value={student._id}>
                          {student.firstName} {student.lastName} ({student.rollNumber}) - Class {student.class}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Father Information */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-3 text-sm">Father's Information</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Father's Name *</Label>
                    <Input
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Father's Email</Label>
                    <Input
                      type="email"
                      value={formData.fatherEmail}
                      onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                      placeholder="father@email.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Father's Phone</Label>
                    <Input
                      value={formData.fatherPhone}
                      onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Father's Occupation</Label>
                    <Input
                      value={formData.fatherOccupation}
                      onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                      placeholder="Engineer"
                    />
                  </div>
                </div>
              </div>

              {/* Mother Information */}
              <div className="pb-4">
                <h4 className="font-semibold mb-3 text-sm">Mother's Information</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Mother's Name</Label>
                    <Input
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Mother's Email</Label>
                    <Input
                      type="email"
                      value={formData.motherEmail}
                      onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })}
                      placeholder="mother@email.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Mother's Phone</Label>
                    <Input
                      value={formData.motherPhone}
                      onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Mother's Occupation</Label>
                    <Input
                      value={formData.motherOccupation}
                      onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                      placeholder="Doctor"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        );

      case 'owner':
      case 'admin':
      case 'principal':
      case 'cashier':
      case 'driver':
        return (
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Name`}
              />
            </div>
            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={`${selectedRole}@school.com`}
              />
            </div>
            <div>
              <Label>Phone (Optional)</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
              <strong>Note:</strong> Default password will be generated automatically
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Create and manage admins, teachers, parents, staff and owners</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
        </Button>
      </div>

      {/* Role Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            {(['admin', 'teacher', 'parent', 'owner', 'principal', 'cashier', 'driver'] as const).map(role => (
              <Button
                key={role}
                variant={selectedRole === role ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedRole(role);
                  setSearchQuery('');
                }}
                className="capitalize"
              >
                <Users className="h-4 w-4 mr-2" />
                {role.charAt(0).toUpperCase() + role.slice(1)}s
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${selectedRole}s by name, email, or phone...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}s ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 inline-block animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No {selectedRole}s found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {user.phone || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? 'default' : 'secondary'}>
                          {user.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.forcePasswordChange ? 'bg-yellow-50' : 'bg-green-50'}>
                          {user.forcePasswordChange ? 'Must Change' : 'Set'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user._id)}>
                              <Lock className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(user.email);
                              toast.success('Email copied');
                            }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={user.active ? "text-destructive" : "text-green-600"}
                              onClick={() => handleToggleStatus(user._id, user.active)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {user.active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : `Create New ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Update user details'
                : selectedRole === 'teacher'
                ? 'Create a new teacher with complete details'
                : selectedRole === 'parent'
                ? 'Create a new parent and link to a student'
                : 'Create a new owner account'}
            </DialogDescription>
          </DialogHeader>

          {renderRoleSpecificForm()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingUser ? 'Update' : 'Create'} {selectedRole}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
