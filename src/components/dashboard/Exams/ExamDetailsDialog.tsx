// components/dashboard/Exams/ExamDetailsDialog.tsx
import React from 'react';
import { Calendar, Clock, Users, BookOpen, FileText, Award, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import type { Exam } from '@/types/exam';

interface ExamDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Exam | null;
}

const ExamDetailsDialog: React.FC<ExamDetailsDialogProps> = ({
  open,
  onOpenChange,
  exam,
}) => {
  if (!exam) return null;

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'draft':
        return 'bg-gray-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'ongoing':
      case 'live':
        return 'bg-green-500 animate-pulse';
      case 'completed':
        return 'bg-purple-500';
      default:
        return 'bg-gray-400';
    }
  };

  const totalMarks = exam.subjectGroups?.reduce(
    (sum, group) => sum + (group.totalMarks || 0),
    0
  ) || 0;

  const totalQuestions = exam.subjectGroups?.reduce(
    (sum, group) => sum + (group.questions?.length || 0),
    0
  ) || 0;

  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return 'Not set';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not set';
    return timeString;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">{exam.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(exam.status || '')}>
                  {exam.status || 'Draft'}
                </Badge>
                {exam.className && (
                  <Badge variant="outline">
                    Class {exam.className} - {exam.section}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Subject</p>
                    <p className="font-semibold">{exam.subject || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Class & Section</p>
                    <p className="font-semibold">
                      {exam.className ? `Class ${exam.className} - ${exam.section}` : 'All Classes'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Exam Date</p>
                    <p className="font-semibold">{formatDate(exam.examDate || exam.date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-semibold">
                      {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {exam.description && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-gray-800">{exam.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exam Settings */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Exam Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="font-semibold">{exam.duration || 0} minutes</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Marks</span>
                  <span className="font-semibold">{totalMarks}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Questions</span>
                  <span className="font-semibold">{totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Max Attempts</span>
                  <span className="font-semibold">{exam.maxAttempts || 1}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${exam.shuffleQuestions ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm">Shuffle Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${exam.shuffleOptions ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm">Shuffle Options</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${exam.allowReview ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm">Allow Review</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Breakdown */}
          {exam.subjectGroups && exam.subjectGroups.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Questions by Subject</h3>
                <div className="space-y-3">
                  {exam.subjectGroups.map((group, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{group.subjectName}</p>
                        <p className="text-sm text-gray-600">
                          {group.questions?.length || 0} Questions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{group.totalMarks} Marks</p>
                        <p className="text-sm text-gray-600">
                          Passing: {group.passingMarks} Marks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {exam.instructions && exam.instructions.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Instructions</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {exam.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm">{instruction}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamDetailsDialog;
