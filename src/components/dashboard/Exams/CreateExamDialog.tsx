// components/dashboard/Exams/CreateExamDialog.tsx
import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useExam } from '@/hooks/useExam';
import { toast } from 'sonner';

// Define local interface that matches your form requirements
interface CreateExamFormData {
  name: string;
  className: string;
  section: string;
  subject: string;
  description: string;
  duration: number; // Changed from durationMinutes to match your API
  status: string;
  pattern?: string; // Make optional if not in CreateExamData
  date?: string; // Changed from examDate to match your API
  startTime: string;
  endTime: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowReview: boolean;
  maxAttempts: number;
  instructions: string[];
}

interface CreateExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const CreateExamDialog: React.FC<CreateExamDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  onError,
}) => {
  const { createExam } = useExam();
  const [formData, setFormData] = useState<CreateExamFormData>({
    name: '',
    className: '',
    section: '',
    subject: '',
    description: '',
    duration: 60, // Changed to match your API
    status: 'scheduled',
    pattern: 'simple',
    date: '', // Changed to match your API
    startTime: '09:00',
    endTime: '10:00',
    shuffleQuestions: false,
    shuffleOptions: false,
    allowReview: true,
    maxAttempts: 1,
    instructions: [],
  });
  const [localError, setLocalError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
  const subjects = [
    'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics'
  ];
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'ongoing', label: 'Active' },
    { value: 'completed', label: 'Completed' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'duration' || name === 'maxAttempts') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setLocalError('');
  };

  const handleSelectChange = (name: keyof CreateExamFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError('');
  };

  const handleSwitchChange = (name: keyof CreateExamFormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setLocalError('Exam name is required');
      return false;
    }
    if (!formData.className) {
      setLocalError('Class is required');
      return false;
    }
    if (!formData.section) {
      setLocalError('Section is required');
      return false;
    }
    if (!formData.subject) {
      setLocalError('Subject is required');
      return false;
    }
    if (!formData.duration || formData.duration <= 0) {
      setLocalError('Duration must be greater than 0');
      return false;
    }
    if (!formData.date) {
      setLocalError('Exam date is required');
      return false;
    }
    return true;
  };

  const formatFormDataForApi = (): any => {
    // Transform form data to match your API requirements
    const apiData: any = {
      name: formData.name.trim(),
      className: formData.className,
      section: formData.section,
      subject: formData.subject,
      description: formData.description?.trim() || '',
      duration: formData.duration, // Your API might expect 'duration' not 'durationMinutes'
      status: formData.status,
      startTime: formData.startTime,
      endTime: formData.endTime,
      shuffleQuestions: formData.shuffleQuestions,
      shuffleOptions: formData.shuffleOptions,
      allowReview: formData.allowReview,
      maxAttempts: formData.maxAttempts,
      instructions: formData.instructions,
    };

    // Add date field (your API might expect 'date' or 'examDate')
    if (formData.date) {
      apiData.date = formData.date;
      apiData.examDate = formData.date; // Include both for compatibility
    }

    // Add pattern if exists
    if (formData.pattern) {
      apiData.pattern = formData.pattern;
    }

    return apiData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setLocalError('');
      
      console.log('📝 Form data:', formData);
      
      // Format data for API
      const examData = formatFormDataForApi();
      console.log('📤 Sending to API:', examData);
      
      // Call createExam
      await createExam(examData);
      
      toast.success('Exam created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        className: '',
        section: '',
        subject: '',
        description: '',
        duration: 60,
        status: 'scheduled',
        pattern: 'simple',
        date: '',
        startTime: '09:00',
        endTime: '10:00',
        shuffleQuestions: false,
        shuffleOptions: false,
        allowReview: true,
        maxAttempts: 1,
        instructions: [],
      });
      
      // Call success callback
      if (onSuccess) onSuccess();
      
      // Close dialog
      onOpenChange(false);
      
    } catch (err: any) {
      console.error('❌ Form submission error:', err);
      
      const errorMessage = err.message || 'Failed to create exam';
      setLocalError(errorMessage);
      
      toast.error(`Failed to create exam: ${errorMessage}`);
      
      // Call error callback
      if (onError) onError(errorMessage);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      className: '',
      section: '',
      subject: '',
      description: '',
      duration: 60,
      status: 'scheduled',
      pattern: 'simple',
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      shuffleQuestions: false,
      shuffleOptions: false,
      allowReview: true,
      maxAttempts: 1,
      instructions: [],
    });
    setLocalError('');
    onOpenChange(false);
  };

  // Get today's date in YYYY-MM-DD format for date input min
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Exam</DialogTitle>
          <DialogDescription>
            Create a new exam for your students. Fill in all required fields marked with *.
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {localError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{localError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Exam Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Mathematics Midterm Exam"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => handleSelectChange('subject', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter exam description..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Separator />

          {/* Class & Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Class & Section</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className">
                  Class <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.className}
                  onValueChange={(value) => handleSelectChange('className', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(className => (
                      <SelectItem key={className} value={className}>
                        Class {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="section">
                  Section <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) => handleSelectChange('section', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Exam Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={today}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">
                Duration (minutes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 90"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Separator />

          {/* Exam Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exam Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shuffleQuestions" className="cursor-pointer">
                    Shuffle Questions
                  </Label>
                  <Switch
                    id="shuffleQuestions"
                    checked={formData.shuffleQuestions}
                    onCheckedChange={(checked) => 
                      handleSwitchChange('shuffleQuestions', checked)
                    }
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="shuffleOptions" className="cursor-pointer">
                    Shuffle Options
                  </Label>
                  <Switch
                    id="shuffleOptions"
                    checked={formData.shuffleOptions}
                    onCheckedChange={(checked) => 
                      handleSwitchChange('shuffleOptions', checked)
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowReview" className="cursor-pointer">
                    Allow Review
                  </Label>
                  <Switch
                    id="allowReview"
                    checked={formData.allowReview}
                    onCheckedChange={(checked) => 
                      handleSwitchChange('allowReview', checked)
                    }
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Attempts</Label>
                  <Input
                    id="maxAttempts"
                    name="maxAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxAttempts}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Exam'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamDialog;