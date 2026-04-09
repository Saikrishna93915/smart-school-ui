import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus, BookOpen, Users, Trash2, RefreshCw, GraduationCap } from 'lucide-react';
import { TeacherAssignmentService, TeacherAssignment, MyAssignmentGroup } from '../Services/teacherAssignment.service';
import { SubjectService } from '../Services/subject.service';
import { toast } from 'sonner';

// Class options for the school
const CLASSES = ['LKG', 'UKG', '1st Class', '2nd Class', '3rd Class', '4th Class', '5th Class', '6th Class', '7th Class', '8th Class', '9th Class', '10th Class'];
const SECTIONS = ['A', 'B'];
const ACADEMIC_YEAR = '2025-2026';

interface Subject {
  _id: string;
  subjectName: string;
  subjectCode: string;
  className: string;
}

export default function TeacherAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [myAssignments, setMyAssignments] = useState<MyAssignmentGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    teacherId: '',
    subjectId: '',
    className: '',
    section: '',
    academicYear: ACADEMIC_YEAR,
  });

  useEffect(() => {
    // Get role from authenticated user context
    if (!user || !user.role) {
      console.warn('⚠️ User not authenticated or role not available');
      setUserRole('admin'); // fallback
      return;
    }
    
    const role = user.role;
    setUserRole(role);
    fetchData(role);
  }, [user]);

  const fetchData = async (role: string) => {
    setIsLoading(true);
    try {
      // Fetch subjects
      const subjectsData = await SubjectService.getAll();
      setSubjects(subjectsData);
      
      // Fetch assignments based on role
      if (role === 'teacher') {
        // Teachers can only access their own assignments
        try {
          const response = await TeacherAssignmentService.getMyAssignments();
          setMyAssignments(response.grouped);
        } catch (error: any) {
          console.error('🔐 Teacher access error:', {
            role: user?.role,
            endpoint: '/api/teacher-assignments/my',
            error: error.message
          });
          
          // More helpful error message for teachers
          toast.error('Unable to load your assignments. Please note: You can only view assignments created for your account by the administrator.', {
            duration: 5000
          });
          
          setMyAssignments([]);
        }
      } else if (role === 'admin' || role === 'owner') {
        // Only admin/owner can see all assignments
        try {
          const data = await TeacherAssignmentService.getAll();
          setAssignments(data);
        } catch (error: any) {
          console.error('📊 Admin access error:', {
            role: user?.role,
            endpoint: '/api/teacher-assignments',
            error: error.message
          });
          
          toast.error(error.message || 'Failed to load assignments');
          setAssignments([]);
        }
      } else {
        // Unexpected role
        console.warn(`⚠️ Unexpected role: ${role}`);
        toast.error(`User role "${role}" is not authorized to view assignments`);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Update filtered subjects when class changes
  useEffect(() => {
    if (formData.className) {
      const filtered = subjects.filter(s => s.className === formData.className);
      setFilteredSubjects(filtered);
      // Reset subject if current selection is not in filtered list
      if (formData.subjectId && !filtered.find(s => s._id === formData.subjectId)) {
        setFormData(prev => ({ ...prev, subjectId: '' }));
      }
    } else {
      setFilteredSubjects([]);
    }
  }, [formData.className, subjects]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.teacherId || !formData.subjectId || !formData.className || !formData.section) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await TeacherAssignmentService.create(formData);
      toast.success('Teacher assigned successfully');
      setIsDialogOpen(false);
      setFormData({
        teacherId: '',
        subjectId: '',
        className: '',
        section: '',
        academicYear: ACADEMIC_YEAR,
      });
      fetchData(userRole);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      await TeacherAssignmentService.delete(id);
      toast.success('Assignment removed successfully');
      fetchData(userRole);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove assignment');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    );
  }

  // Teacher View - My Assignments
  if (userRole === 'teacher') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground">View your teaching assignments and class sections</p>
        </div>

        {myAssignments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Assignments Yet</h3>
                <p className="text-sm text-muted-foreground">
                  You haven't been assigned to any subjects yet. Please contact the administrator.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {myAssignments.map((group, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    {group.className} - Section {group.section}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Academic Year: {group.academicYear}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.subjects.map((subject, subIdx) => (
                      <div
                        key={subIdx}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{subject.subjectName}</p>
                            <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {subject.category || 'Core'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Teaching {group.subjects.length} subject{group.subjects.length !== 1 ? 's' : ''} in this class
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Admin View - All Assignments
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Assignments</h1>
          <p className="text-muted-foreground">Manage teacher-subject assignments for all classes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchData(userRole)} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Teacher Assignment</DialogTitle>
                <DialogDescription>
                  Assign a teacher to teach a specific subject in a class and section for the academic year.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherId">Teacher ID *</Label>
                  <Input
                    id="teacherId"
                    placeholder="Enter teacher ID (e.g., T493458 or ObjectId)"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use employee ID (T493458) or MongoDB ObjectId
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subjectId">Subject *</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                    disabled={!formData.className}
                  >
                    <SelectTrigger id="subjectId">
                      <SelectValue placeholder="First select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubjects.map((subject) => (
                        <SelectItem key={subject._id} value={subject._id}>
                          {subject.subjectName} ({subject.subjectCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.className && (
                    <p className="text-xs text-muted-foreground">
                      Select a class first to see available subjects
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class *</Label>
                    <Select
                      value={formData.className}
                      onValueChange={(value) => setFormData({ ...formData, className: value })}
                    >
                      <SelectTrigger id="className">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSES.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section">Section *</Label>
                    <Select
                      value={formData.section}
                      onValueChange={(value) => setFormData({ ...formData, section: value })}
                    >
                      <SelectTrigger id="section">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTIONS.map((section) => (
                          <SelectItem key={section} value={section}>
                            Section {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="2024-25"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      'Create Assignment'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                new Set(
                  assignments
                    .map((a) => a.teacherId?._id)
                    .filter((id): id is string => Boolean(id))
                ).size
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Covered</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(assignments.map((a) => `${a.className}-${a.section}`)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No Assignments Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by creating teacher-subject assignments for your classes
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create First Assignment
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => {
                    const teacherFirstName = assignment.teacherId?.personal?.firstName || 'Unknown';
                    const teacherLastName = assignment.teacherId?.personal?.lastName || 'Teacher';
                    const subjectName = assignment.subjectId?.subjectName || 'Unknown Subject';
                    const subjectCode = assignment.subjectId?.subjectCode || 'N/A';

                    return (
                      <TableRow key={assignment._id}>
                        <TableCell className="font-medium">
                          {teacherFirstName} {teacherLastName}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subjectName}</p>
                            <p className="text-xs text-muted-foreground">
                              {subjectCode}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{assignment.className}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{assignment.section}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{assignment.academicYear}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {assignment.assignedDate ? new Date(assignment.assignedDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
