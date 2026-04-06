import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Settings2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import QuestionBuilder, { BuilderQuestion } from '@/components/dashboard/Exams/QuestionBuilder';
import { useExam } from '@/hooks/useExam';
import type { ExamPattern } from '@/types/exam';

interface CreateExamFormData {
  name: string;
  className: string;
  section: string;
  subject: string;
  description: string;
  duration: number;
  status: 'draft' | 'scheduled';
  pattern: ExamPattern;
  date: string;
  startTime: string;
  endTime: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowReview: boolean;
  maxAttempts: number;
  instructions: string[];
}

const createEmptyQuestion = (): BuilderQuestion => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: 'mcq',
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  correctAnswers: [],
  marks: 1,
  expanded: true,
});

const steps = [
  { title: 'Basic Info', icon: ClipboardList },
  { title: 'Schedule & Settings', icon: Settings2 },
  { title: 'Questions', icon: Sparkles },
  { title: 'Review & Create', icon: CheckCircle2 },
];

const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
const subjects = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics'
];

const CreateExamPage: React.FC = () => {
  const navigate = useNavigate();
  const { createExam, isCreating } = useExam();

  const [currentStep, setCurrentStep] = useState(0);
  const [localError, setLocalError] = useState('');
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateExamFormData>({
    name: '',
    className: '',
    section: '',
    subject: '',
    description: '',
    duration: 60,
    status: 'scheduled',
    pattern: 'STANDARD',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    shuffleQuestions: false,
    shuffleOptions: false,
    allowReview: true,
    maxAttempts: 1,
    instructions: [],
  });

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [questions, setQuestions] = useState<BuilderQuestion[]>([createEmptyQuestion()]);

  const totalMarks = useMemo(
    () => questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
    [questions]
  );

  const handleInputChange = (name: keyof CreateExamFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError('');
  };

  const toggleClass = (className: string) => {
    setSelectedClasses((prev) =>
      prev.includes(className) ? prev.filter((c) => c !== className) : [...prev, className]
    );
  };

  const toggleSection = (sectionName: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionName) ? prev.filter((s) => s !== sectionName) : [...prev, sectionName]
    );
  };

  const validateQuestions = () => {
    const nextErrors: Record<string, string> = {};

    if (questions.length === 0) {
      setLocalError('Add at least one question before proceeding');
      return false;
    }

    questions.forEach((question) => {
      const prefix = `question_${question.id}`;

      if (!question.question.trim()) {
        nextErrors[`${prefix}_question`] = 'Question text is required';
      }

      if (!question.marks || question.marks <= 0) {
        nextErrors[`${prefix}_marks`] = 'Marks must be greater than 0';
      }

      if (question.type === 'mcq' || question.type === 'multi_select') {
        const nonEmptyOptions = question.options.filter((opt) => opt.trim().length > 0);
        if (nonEmptyOptions.length < 2) {
          nextErrors[`${prefix}_options`] = 'At least 2 options are required';
        }
      }

      if (question.type === 'mcq' && `${question.correctAnswer}`.trim() === '') {
        nextErrors[`${prefix}_correct`] = 'Select one correct answer';
      }

      if (question.type === 'multi_select' && question.correctAnswers.length === 0) {
        nextErrors[`${prefix}_correct`] = 'Select at least one correct answer';
      }

      if (question.type === 'fill_blank' && `${question.correctAnswer}`.trim() === '') {
        nextErrors[`${prefix}_correct`] = 'Correct answer is required';
      }
    });

    setQuestionErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setLocalError('Please fix question validation errors');
      return false;
    }

    return true;
  };

  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      if (!formData.name.trim()) return setLocalError('Exam name is required'), false;
      if (!formData.subject) return setLocalError('Subject is required'), false;
      if (!formData.className) return setLocalError('Class is required'), false;
      if (!formData.section) return setLocalError('Section is required'), false;
      return setLocalError(''), true;
    }

    if (stepIndex === 1) {
      if (!formData.date) return setLocalError('Exam date is required'), false;
      if (!formData.startTime || !formData.endTime) return setLocalError('Start and end time are required'), false;
      if (!formData.duration || formData.duration <= 0) return setLocalError('Duration must be greater than 0'), false;
      const effectiveClasses = selectedClasses.length > 0 ? selectedClasses : (formData.className ? [formData.className] : []);
      const effectiveSections = selectedSections.length > 0 ? selectedSections : (formData.section ? [formData.section] : []);

      if (effectiveClasses.length === 0) return setLocalError('Select at least one target class'), false;
      if (effectiveSections.length === 0) return setLocalError('Select at least one target section'), false;

      if (selectedClasses.length === 0 && effectiveClasses.length > 0) {
        setSelectedClasses(effectiveClasses);
      }
      if (selectedSections.length === 0 && effectiveSections.length > 0) {
        setSelectedSections(effectiveSections);
      }
      return setLocalError(''), true;
    }

    if (stepIndex === 2) {
      return validateQuestions();
    }

    return true;
  };

  const formatFormDataForApi = () => {
    const mappedQuestions = questions.map((question) => {
      const baseQuestion: any = {
        type:
          question.type === 'multi_select'
            ? 'multi-correct'
            : question.type === 'true_false'
            ? 'truefalse'
            : question.type === 'short_answer'
            ? 'short'
            : question.type === 'long_answer'
            ? 'long'
            : question.type === 'fill_blank'
            ? 'fillblank'
            : 'mcq',
        text: question.question.trim(),
        marks: question.marks,
        difficulty: 'medium',
      };

      if (question.type === 'mcq' || question.type === 'multi_select') {
        baseQuestion.options = question.options.map((opt) => opt.trim());
      }

      if (question.type === 'mcq') baseQuestion.correctAnswer = Number(question.correctAnswer);
      if (question.type === 'multi_select') baseQuestion.correctAnswers = question.correctAnswers;
      if (question.type === 'true_false') baseQuestion.correctAnswer = Boolean(question.correctAnswer);
      if (question.type === 'short_answer' || question.type === 'fill_blank') {
        baseQuestion.correctAnswer = `${question.correctAnswer}`.trim();
      }

      return baseQuestion;
    });

    return {
      name: formData.name.trim(),
      className: selectedClasses[0] || formData.className,
      section: selectedSections[0] || formData.section,
      subject: formData.subject,
      description: formData.description?.trim() || '',
      duration: formData.duration,
      durationMinutes: formData.duration,
      status: formData.status,
      pattern: formData.pattern,
      date: formData.date,
      examDate: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      shuffleQuestions: formData.shuffleQuestions,
      shuffleOptions: formData.shuffleOptions,
      allowReview: formData.allowReview,
      showMarksImmediately: false,
      proctoringMode: 'basic' as const,
      maxAttempts: formData.maxAttempts,
      instructions: formData.instructions,
      subjectGroups: [
        {
          subjectName: formData.subject,
          totalMarks,
          passingMarks: Math.ceil(totalMarks * 0.4),
          questions: mappedQuestions,
        },
      ],
      classTargets: selectedClasses.map((className) => ({
        className,
        sections: selectedSections,
        totalStudents: 0,
      })),
    };
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setLocalError('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCreateExam = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;

    try {
      await createExam(formatFormDataForApi());
      toast.success('Exam created successfully');
      navigate('/exams');
    } catch (error: any) {
      setLocalError(error?.message || 'Failed to create exam');
    }
  };

  const stepIcon = steps[currentStep].icon;
  const StepIcon = stepIcon;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/exams')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Create New Exam</h1>
              <p className="text-muted-foreground">Step-by-step exam setup for professional workflow</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {steps.map((step, index) => {
                const ActiveIcon = step.icon;
                const isDone = index < currentStep;
                const isActive = index === currentStep;

                return (
                  <div
                    key={step.title}
                    className={`rounded-lg border p-3 flex items-center gap-2 ${
                      isActive ? 'border-blue-500 bg-blue-50' : isDone ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <ActiveIcon className={`h-4 w-4 ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {localError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{localError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepIcon className="h-5 w-5" />
              {steps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exam Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter exam name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    <Select value={formData.className} onValueChange={(value) => handleInputChange('className', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((className) => (
                          <SelectItem key={className} value={className}>Class {className}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Section *</Label>
                    <Select value={formData.section} onValueChange={(value) => handleInputChange('section', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section} value={section}>Section {section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Exam Date *</Label>
                    <Input type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time *</Label>
                    <Input type="time" value={formData.startTime} onChange={(e) => handleInputChange('startTime', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time *</Label>
                    <Input type="time" value={formData.endTime} onChange={(e) => handleInputChange('endTime', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Attempts</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.maxAttempts}
                      onChange={(e) => handleInputChange('maxAttempts', Number(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Target Multiple Classes</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-2">
                      {classes.map((className) => {
                        const active = selectedClasses.includes(className);
                        return (
                          <Button
                            key={className}
                            type="button"
                            variant={active ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleClass(className)}
                          >
                            Class {className}
                          </Button>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Target Multiple Sections</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-2">
                      {sections.map((section) => {
                        const active = selectedSections.includes(section);
                        return (
                          <Button
                            key={section}
                            type="button"
                            variant={active ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleSection(section)}
                          >
                            Section {section}
                          </Button>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <Label>Shuffle Questions</Label>
                    <Switch
                      checked={formData.shuffleQuestions}
                      onCheckedChange={(checked) => handleInputChange('shuffleQuestions', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <Label>Shuffle Options</Label>
                    <Switch
                      checked={formData.shuffleOptions}
                      onCheckedChange={(checked) => handleInputChange('shuffleOptions', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <Label>Allow Review</Label>
                    <Switch
                      checked={formData.allowReview}
                      onCheckedChange={(checked) => handleInputChange('allowReview', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <QuestionBuilder
                  questions={questions}
                  errors={questionErrors}
                  onAddQuestion={() => setQuestions((prev) => [...prev, createEmptyQuestion()])}
                  onRemoveQuestion={(id) => {
                    setQuestions((prev) => prev.filter((q) => q.id !== id));
                    setQuestionErrors((prev) => {
                      const next = { ...prev };
                      Object.keys(next).forEach((key) => {
                        if (key.startsWith(`question_${id}`)) delete next[key];
                      });
                      return next;
                    });
                  }}
                  onUpdateQuestion={(id, updates) => {
                    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
                    setQuestionErrors((prev) => {
                      const next = { ...prev };
                      Object.keys(next).forEach((key) => {
                        if (key.startsWith(`question_${id}`)) delete next[key];
                      });
                      return next;
                    });
                  }}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Exam Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {formData.name}</p>
                      <p><span className="font-medium">Subject:</span> {formData.subject}</p>
                      <p><span className="font-medium">Class:</span> {formData.className}-{formData.section}</p>
                      <p><span className="font-medium">Date:</span> {formData.date}</p>
                      <p><span className="font-medium">Time:</span> {formData.startTime} - {formData.endTime}</p>
                      <p><span className="font-medium">Duration:</span> {formData.duration} minutes</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-base">Paper Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="font-medium">Total Questions:</span> {questions.length}</p>
                      <p><span className="font-medium">Total Marks:</span> {totalMarks}</p>
                      <p><span className="font-medium">Passing Marks:</span> {Math.ceil(totalMarks * 0.4)}</p>
                      <p><span className="font-medium">Target Classes:</span> {selectedClasses.join(', ') || '-'}</p>
                      <p><span className="font-medium">Target Sections:</span> {selectedSections.join(', ') || '-'}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Questions Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">Q{idx + 1}</Badge>
                          <Badge>{q.marks} marks</Badge>
                        </div>
                        <p className="font-medium">{q.question || '(No question text)'}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || isCreating}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={isCreating}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreateExam} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
              {isCreating ? 'Creating...' : 'Create Exam'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateExamPage;
