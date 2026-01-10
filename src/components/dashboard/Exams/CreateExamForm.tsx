'use client';

// components/exams/CreateExamForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertCircle, Clock, Calculator, Loader2 } from 'lucide-react';

// Validation Schema
const questionSchema = z.object({
  questionText: z.string().min(5, 'Question must be at least 5 characters'),
  options: z.array(z.string().min(1, 'Option cannot be empty')).min(2).max(6),
  correctAnswer: z.string().min(1, 'Please select a correct answer'),
  marks: z.number().min(1, 'Marks must be at least 1').max(100),
});

const examSchema = z.object({
  name: z.string().min(3, 'Exam name must be at least 3 characters'),
  description: z.string().optional(),
  className: z.string().min(1, 'Please select a class'),
  section: z.string().min(1, 'Please select a section'),
  subject: z.string().min(1, 'Subject is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  status: z.literal('scheduled'),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

type ExamFormData = z.infer<typeof examSchema>;
type Question = ExamFormData['questions'][0];

// Constants
const CLASS_LIST = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
const SECTION_LIST = ['A', 'B', 'C', 'D', 'E', 'F'];
const SUBJECT_OPTIONS = [
  'Mathematics', 'Science', 'English', 'History', 'Physics', 'Chemistry',
  'Biology', 'Computer Science', 'Geography', 'Economics', 'Business Studies',
  'Art', 'Music', 'Physical Education', 'Languages'
];

interface CreateExamFormProps {
  onSuccess?: () => void;
}

export function CreateExamForm({ onSuccess }: CreateExamFormProps) {
    const router = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalMarks, setTotalMarks] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      status: 'scheduled',
      durationMinutes: 60,
      questions: [
        {
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          marks: 1,
        },
      ],
    },
    mode: 'onChange',
  });

  const questions = watch('questions');
  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const formData = watch();

  // Calculate total marks
  useEffect(() => {
    const total = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    setTotalMarks(total);
  }, [questions]);

  // Auto-calculate duration
  useEffect(() => {
    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      let duration = endTotalMinutes - startTotalMinutes;
      if (duration < 0) duration += 24 * 60;
      
      setValue('durationMinutes', duration, { shouldValidate: true });
    }
  }, [startTime, endTime, setValue]);

  const addQuestion = () => {
    const newQuestion: Question = {
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
    };
    setValue('questions', [...questions, newQuestion], { shouldValidate: true });
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setValue('questions', questions.filter((_, i) => i !== index), { shouldValidate: true });
    } else {
      toast.error('Exam must have at least one question');
    }
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setValue('questions', updatedQuestions, { shouldValidate: true });
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    
    // If this option was the correct answer and it's being cleared, reset correct answer
    if (updatedQuestions[questionIndex].correctAnswer === value && !value.trim()) {
      updatedQuestions[questionIndex].correctAnswer = '';
    }
    
    setValue('questions', updatedQuestions, { shouldValidate: true });
  };

  const addOption = (questionIndex: number) => {
    if (questions[questionIndex].options.length < 6) {
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex].options.push('');
      setValue('questions', updatedQuestions, { shouldValidate: true });
    } else {
      toast.error('Maximum 6 options allowed');
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (questions[questionIndex].options.length > 2) {
      const updatedQuestions = [...questions];
      const removedOption = updatedQuestions[questionIndex].options[optionIndex];
      
      // If removed option was the correct answer, reset correct answer
      if (updatedQuestions[questionIndex].correctAnswer === removedOption) {
        updatedQuestions[questionIndex].correctAnswer = '';
      }
      
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);
      setValue('questions', updatedQuestions, { shouldValidate: true });
    } else {
      toast.error('Minimum 2 options required');
    }
  };

  const onSubmit = async (data: ExamFormData) => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          toast.error('Session expired. Please login again.');
          router('/login');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create exam: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast.success('Exam created successfully!', {
        description: `Exam ID: ${result.data?._id || result.data?.examId || 'N/A'}`,
      });
      
      // Reset form and close dialog
      reset();
      setShowConfirm(false);
      onSuccess?.();
      
    } catch (error: any) {
      toast.error('Failed to create exam', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {showConfirm && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-800">Confirm Exam Creation</h4>
                <p className="text-sm text-amber-700">
                  Are you sure you want to create this exam? Once created, you can edit it before it starts.
                </p>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Class:</strong> {formData.className} - Section {formData.section}</p>
                  <p><strong>Subject:</strong> {formData.subject}</p>
                  <p><strong>Questions:</strong> {questions.length} questions, {totalMarks} total marks</p>
                  <p><strong>Date:</strong> {formData.examDate} at {formData.startTime}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Exam Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Mid-Term Mathematics Exam"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  onValueChange={(value) => setValue('subject', value, { shouldValidate: true })}
                >
                  <SelectTrigger className={errors.subject ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.subject.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Optional exam description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class *</Label>
                <Select
                  onValueChange={(value) => setValue('className', value, { shouldValidate: true })}
                >
                  <SelectTrigger className={errors.className ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_LIST.map((className) => (
                      <SelectItem key={className} value={className}>
                        Class {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.className && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.className.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="section">Section *</Label>
                <Select
                  onValueChange={(value) => setValue('section', value, { shouldValidate: true })}
                >
                  <SelectTrigger className={errors.section ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_LIST.map((section) => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.section && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.section.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value="scheduled"
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule & Timing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="examDate">Exam Date *</Label>
                <Input
                  id="examDate"
                  type="date"
                  {...register('examDate')}
                  className={errors.examDate ? 'border-red-500' : ''}
                />
                {errors.examDate && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.examDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes) *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...register('durationMinutes', { valueAsNumber: true })}
                    className={errors.durationMinutes ? 'border-red-500' : ''}
                    min="1"
                  />
                  <span className="text-sm text-gray-500">minutes</span>
                </div>
                {errors.durationMinutes && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.durationMinutes.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime')}
                  className={errors.startTime ? 'border-red-500' : ''}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.startTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register('endTime')}
                  className={errors.endTime ? 'border-red-500' : ''}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Clock size={14} />
              Duration is automatically calculated from start and end times
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Questions</CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="font-semibold">
                  {questions.length} Questions
                </Badge>
                <Badge className="bg-indigo-600">
                  <Calculator size={14} className="mr-1" /> {totalMarks} Total Marks
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, questionIndex) => (
              <div key={questionIndex} className="p-4 border rounded-lg space-y-4 bg-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Q{questionIndex + 1}</Badge>
                    <span className="text-sm text-gray-500">
                      Marks: {question.marks}
                    </span>
                  </div>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(questionIndex)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Question Text *</Label>
                  <Textarea
                    value={question.questionText}
                    onChange={(e) => handleQuestionChange(questionIndex, 'questionText', e.target.value)}
                    placeholder="Enter your question here..."
                    className={errors.questions?.[questionIndex]?.questionText ? 'border-red-500' : ''}
                    rows={3}
                  />
                  {errors.questions?.[questionIndex]?.questionText && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.questions[questionIndex].questionText.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Options (2-6 required) *</Label>
                    <span className="text-sm text-gray-500">
                      Click radio button to mark correct answer
                    </span>
                  </div>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="radio"
                          name={`correctAnswer-${questionIndex}`}
                          checked={question.correctAnswer === option && option.trim() !== ''}
                          onChange={() => handleQuestionChange(questionIndex, 'correctAnswer', option)}
                          className="h-4 w-4 text-indigo-600"
                          disabled={!option.trim()}
                        />
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1"
                        />
                      </div>
                      {question.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(questionIndex, optionIndex)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="space-y-1">
                    {errors.questions?.[questionIndex]?.options && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.questions[questionIndex].options.message}
                      </p>
                    )}
                    {errors.questions?.[questionIndex]?.correctAnswer && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.questions[questionIndex].correctAnswer.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(questionIndex)}
                    disabled={question.options.length >= 6}
                  >
                    <Plus size={14} className="mr-1" /> Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Marks *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={question.marks}
                      onChange={(e) => handleQuestionChange(questionIndex, 'marks', parseInt(e.target.value) || 0)}
                      min={1}
                      max={100}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">points per question</span>
                  </div>
                  {errors.questions?.[questionIndex]?.marks && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.questions[questionIndex].marks.message}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed h-12"
              onClick={addQuestion}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Question
            </Button>

            {errors.questions && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.questions.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              setShowConfirm(false);
              onSuccess?.();
            }}
          >
            Cancel
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              Total: {questions.length} questions • {totalMarks} marks
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {showConfirm ? 'Creating Exam...' : 'Processing...'}
                </>
              ) : showConfirm ? (
                'Confirm & Create Exam'
              ) : (
                'Create Exam'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}