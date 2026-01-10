// src/components/dashboard/Exams/ExamCard.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Timer, 
  ChevronRight,
  Edit2,
  Eye,
  Play,
  BarChart3,
  Lock,
  MoreVertical,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Exam } from '@/types/exam';
import { 
  formatExamDate, 
  formatDuration, 
  formatTime, 
  getExamStatus, 
  calculateTotalMarks,
  calculateTotalQuestions 
} from '@/lib/utils/examUtils';

interface ExamCardProps {
  exam: Exam | null | undefined;
  viewMode: 'teacher' | 'student';
  onEdit?: () => void;
  onDelete?: () => void;
  onStart?: () => void;
  onViewResults?: () => void;
  className?: string;
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  viewMode,
  onEdit,
  onDelete,
  onStart,
  onViewResults,
  className = ''
}) => {
  const navigate = useNavigate();
  
  // Handle null/undefined exam
  if (!exam) {
    return (
      <Card className={`overflow-hidden border border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Invalid Exam Data</p>
              <p className="text-sm text-red-500">This exam could not be loaded</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = getExamStatus(exam);
  const totalMarks = calculateTotalMarks(exam);
  const totalQuestions = calculateTotalQuestions(exam);

  const handleViewDetails = () => {
    if (!exam._id) {
      console.error('Exam ID is missing');
      return;
    }
    navigate(`/dashboard/exams/${exam._id}`);
  };

  const handleAction = (action: string) => {
    if (!exam) return;

    switch (action) {
      case 'view':
        handleViewDetails();
        break;
      case 'edit':
        onEdit?.();
        break;
      case 'start':
        onStart?.();
        break;
      case 'delete':
        onDelete?.();
        break;
      case 'results':
        onViewResults?.();
        break;
      default:
        console.warn('Unknown action:', action);
    }
  };

  // Safely get proctoring mode
  const proctoringMode = exam.proctoringMode || 'none';

  return (
    <Card className={`overflow-hidden border hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`
                ${status.bgColor} ${status.color} border-0 font-medium
              `}>
                {status.label}
              </Badge>
              {proctoringMode === 'ai' && (
                <Badge variant="outline" className="border-amber-200 text-amber-700">
                  AI Proctoring
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-xl font-bold mb-1">
              {exam.name || 'Unnamed Exam'}
            </CardTitle>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {exam.description || 'No description provided'}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAction('view')}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              
              {viewMode === 'teacher' && exam.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleAction('edit')}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Exam
                </DropdownMenuItem>
              )}
              
              {viewMode === 'teacher' && exam.status === 'completed' && (
                <DropdownMenuItem onClick={() => handleAction('results')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Results
                </DropdownMenuItem>
              )}
              
              {viewMode === 'student' && exam.status === 'scheduled' && (
                <DropdownMenuItem onClick={() => handleAction('start')}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Exam
                </DropdownMenuItem>
              )}
              
              {viewMode === 'teacher' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleAction('delete')}
                    className="text-red-600"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Delete Exam
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              Date
            </div>
            <div className="font-medium">
              {formatExamDate(exam.examDate || exam.date)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Time
            </div>
            <div className="font-medium">
              {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Timer className="h-4 w-4 mr-2" />
              Duration
            </div>
            <div className="font-medium">
              {formatDuration(exam.duration || 0)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Questions
            </div>
            <div className="font-medium">
              {totalQuestions} ({totalMarks} marks)
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              Class {exam.className || 'N/A'}-{exam.section || 'N/A'}
            </div>
            <div className="flex items-center text-muted-foreground">
              <BookOpen className="h-4 w-4 mr-2" />
              {exam.subject || 'No subject'}
            </div>
          </div>
        </div>
      </CardContent>
      
      <div className="px-6 py-3 bg-muted border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewDetails}
          className="w-full justify-between"
          disabled={!exam._id}
        >
          <span>View Details</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ExamCard;