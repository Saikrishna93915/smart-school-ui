import { useState, useEffect } from 'react';
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
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, BookOpen, Edit, Trash2, RefreshCw, GraduationCap } from 'lucide-react';
import { SubjectService, Subject } from '../Services/subject.service';
import { toast } from 'sonner';

// Constants
const CLASSES = ['LKG', 'UKG', '1st Class', '2nd Class', '3rd Class', '4th Class', '5th Class', '6th Class', '7th Class', '8th Class', '9th Class', '10th Class'];
const CATEGORIES = ['Core', 'Optional', 'Language', 'Activity', 'Lab'];
const ACADEMIC_YEAR = '2025-2026';

interface SubjectWithInfo extends Subject {
  teacherCount?: number;
  teachers?: Array<{ name: string; email: string }>;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectWithInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<{
    subjectName: string;
    subjectCode: string;
    className: string;
    academicYear: string;
    category: 'Core' | 'Optional' | 'Language' | 'Activity' | 'Lab';
    totalMarks: number;
    passingMarks: number;
    theoryMarks: number;
    practicalMarks: number;
    description: string;
  }>({
    subjectName: '',
    subjectCode: '',
    className: 'LKG',
    academicYear: ACADEMIC_YEAR,
    category: 'Core',
    totalMarks: 100,
    passingMarks: 35,
    theoryMarks: 70,
    practicalMarks: 30,
    description: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const subjectsData = await SubjectService.getAll();
      setSubjects(subjectsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        className: subject.className,
        academicYear: subject.academicYear,
        category: (subject.category as 'Core' | 'Optional' | 'Language' | 'Activity' | 'Lab') || 'Core',
        totalMarks: subject.totalMarks,
        passingMarks: subject.passingMarks,
        theoryMarks: subject.theoryMarks || 70,
        practicalMarks: subject.practicalMarks || 30,
        description: subject.description || '',
      });
    } else {
      setEditingSubject(null);
      setFormData({
        subjectName: '',
        subjectCode: '',
        className: selectedClass,
        academicYear: ACADEMIC_YEAR,
        category: 'Core',
        totalMarks: 100,
        passingMarks: 35,
        theoryMarks: 70,
        practicalMarks: 30,
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subjectName || !formData.subjectCode || !formData.className) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSubject) {
        await SubjectService.update(editingSubject._id, formData);
        toast.success('Subject updated successfully');
      } else {
        await SubjectService.create(formData);
        toast.success('Subject created successfully');
      }
      setIsDialogOpen(false);
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      await SubjectService.delete(id);
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject');
    }
  };

  // Get subjects for selected class
  const getSubjectsByClass = (className: string) => {
    return subjects.filter((s) => s.className === className);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subject Management</h1>
          <p className="text-muted-foreground">Manage subjects and curriculum for all classes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSubjects} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Core Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subjects.filter((s) => s.category === 'Core').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Tabs */}
      <Tabs defaultValue="LKG" value={selectedClass} onValueChange={setSelectedClass}>
        <TabsList className="w-full grid grid-cols-6">
          {CLASSES.slice(0, 6).map((cls) => (
            <TabsTrigger key={cls} value={cls} className="text-xs">
              {cls}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsList className="w-full grid grid-cols-6 mt-2">
          {CLASSES.slice(6).map((cls) => (
            <TabsTrigger key={cls} value={cls} className="text-xs">
              {cls}
            </TabsTrigger>
          ))}
        </TabsList>

        {CLASSES.map((cls) => (
          <TabsContent key={cls} value={cls} className="mt-6">
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {cls} Subjects ({getSubjectsByClass(cls).length})
                    </CardTitle>
                    <Button size="sm" onClick={() => handleOpenDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add for {cls}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {getSubjectsByClass(cls).length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No Subjects Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      No subjects configured for {cls} yet
                    </p>
                    <Button onClick={() => handleOpenDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Subject
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSubjectsByClass(cls).map((subject) => (
                          <TableRow key={subject._id}>
                            <TableCell className="font-medium">
                              {subject.subjectName}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{subject.subjectCode}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  subject.category === 'Core'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {subject.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDialog(subject)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(subject._id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Edit Subject' : 'Create New Subject'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subjectName">Subject Name *</Label>
                <Input
                  id="subjectName"
                  placeholder="e.g., Mathematics"
                  value={formData.subjectName}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectCode">Subject Code *</Label>
                <Input
                  id="subjectCode"
                  placeholder="e.g., MATH-1"
                  value={formData.subjectCode}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectCode: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class *</Label>
                <Select
                  value={formData.className}
                  onValueChange={(value) =>
                    setFormData({ ...formData, className: value })
                  }
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
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as 'Core' | 'Optional' | 'Language' | 'Activity' | 'Lab' })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks *</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  placeholder="100"
                  value={formData.totalMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, totalMarks: Number(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing Marks *</Label>
                <Input
                  id="passingMarks"
                  type="number"
                  placeholder="35"
                  value={formData.passingMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, passingMarks: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theoryMarks">Theory Marks</Label>
                <Input
                  id="theoryMarks"
                  type="number"
                  placeholder="70"
                  value={formData.theoryMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, theoryMarks: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="practicalMarks">Practical Marks</Label>
                <Input
                  id="practicalMarks"
                  type="number"
                  placeholder="30"
                  value={formData.practicalMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, practicalMarks: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                placeholder="2024-25"
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of the subject"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
                    {editingSubject ? 'Updating...' : 'Creating...'}
                  </>
                ) : editingSubject ? (
                  'Update Subject'
                ) : (
                  'Create Subject'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
