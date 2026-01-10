// src/lib/utils/examUtils.ts

import { Exam } from '@/types/exam';

// ==================== Time Utilities ====================
export const formatDuration = (minutes: number): string => {
  if (!minutes && minutes !== 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return '--:--';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return '--:--';
  }
};

export const getTimeRemaining = (endTime: string | undefined, startTime?: string): number => {
  if (!endTime) return 0;
  
  try {
    const now = new Date();
    const [hours, minutes] = endTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes, 0, 0);
    
    if (startTime) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(startHours, startMinutes, 0, 0);
      
      if (now < startDate) {
        return -1;
      }
    }
    
    const diffMs = endDate.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  } catch {
    return 0;
  }
};

export const formatExamDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
};

// ==================== Exam Status Utilities ====================
export interface ExamStatusInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const getExamStatus = (exam: Exam | null | undefined): ExamStatusInfo => {
  // Default status for null/undefined exam
  if (!exam) {
    return {
      label: 'Unknown',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: '❓'
    };
  }

  // Handle undefined status
  if (!exam.status) {
    return {
      label: 'Unknown',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: '❓'
    };
  }

  const now = new Date();
  
  // Safely get exam date with fallback
  const examDate = exam.examDate || exam.date;
  if (!examDate || !exam.startTime || !exam.endTime) {
    return {
      label: exam.status.charAt(0).toUpperCase() + exam.status.slice(1),
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: '📝'
    };
  }

  try {
    const dateObj = new Date(examDate);
    const [startHours, startMinutes] = exam.startTime.split(':').map(Number);
    const [endHours, endMinutes] = exam.endTime.split(':').map(Number);
    
    const startDateTime = new Date(dateObj);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const endDateTime = new Date(dateObj);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    if (exam.status === 'draft') {
      return {
        label: 'Draft',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        icon: '📝'
      };
    }
    
    if (exam.status === 'scheduled') {
      if (now < startDateTime) {
        return {
          label: 'Upcoming',
          color: 'text-blue-700',
          bgColor: 'bg-blue-100',
          icon: '📅'
        };
      }
      if (now >= startDateTime && now <= endDateTime) {
        return {
          label: 'Live Now',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          icon: '🎯'
        };
      }
      if (now > endDateTime) {
        return {
          label: 'Ended',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          icon: '⏰'
        };
      }
    }
    
    if (exam.status === 'completed') {
      return {
        label: 'Completed',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        icon: '✅'
      };
    }
    
    if (exam.status === 'archived') {
      return {
        label: 'Archived',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        icon: '📁'
      };
    }
    
    // Default fallback
    return {
      label: exam.status.charAt(0).toUpperCase() + exam.status.slice(1),
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: '📝'
    };
  } catch (error) {
    console.error('Error calculating exam status:', error);
    return {
      label: 'Error',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: '❌'
    };
  }
};

// ==================== Calculation Utilities ====================
export const calculateTotalMarks = (exam: Exam | null | undefined): number => {
  if (!exam || !exam.subjectGroups) return 0;
  
  try {
    return exam.subjectGroups.reduce((total, group) => {
      if (!group.questions) return total;
      return total + group.questions.reduce((sum, question) => sum + (question.marks || 0), 0);
    }, 0);
  } catch {
    return 0;
  }
};

export const calculateTotalQuestions = (exam: Exam | null | undefined): number => {
  if (!exam || !exam.subjectGroups) return 0;
  
  try {
    return exam.subjectGroups.reduce((total, group) => {
      return total + (group.questions?.length || 0);
    }, 0);
  } catch {
    return 0;
  }
};

export const calculateCompletionPercentage = (
  answers: Record<string, any> | null | undefined, 
  totalQuestions: number
): number => {
  if (!answers || totalQuestions <= 0) return 0;
  
  const answered = Object.keys(answers).length;
  return (answered / totalQuestions) * 100;
};

// ==================== Validation Utilities ====================
export const validateExam = (exam: Partial<Exam>): string[] => {
  const errors: string[] = [];
  
  if (!exam.name?.trim()) {
    errors.push('Exam name is required');
  }
  
  if (!exam.className?.trim()) {
    errors.push('Class name is required');
  }
  
  if (!exam.section?.trim()) {
    errors.push('Section is required');
  }
  
  if (!exam.date) {
    errors.push('Exam date is required');
  }
  
  if (!exam.startTime) {
    errors.push('Start time is required');
  }
  
  if (!exam.endTime) {
    errors.push('End time is required');
  }
  
  if (!exam.duration || exam.duration <= 0) {
    errors.push('Duration must be greater than 0');
  }
  
  if (!exam.subjectGroups || exam.subjectGroups.length === 0) {
    errors.push('At least one subject group is required');
  } else {
    exam.subjectGroups.forEach((group, groupIndex) => {
      if (!group.subjectName?.trim()) {
        errors.push(`Subject name is required for group ${groupIndex + 1}`);
      }
      
      if (!group.questions || group.questions.length === 0) {
        errors.push(`At least one question is required for ${group.subjectName}`);
      } else {
        group.questions.forEach((question, qIndex) => {
          if (!question.text?.trim()) {
            errors.push(`Question text is required for question ${qIndex + 1} in ${group.subjectName}`);
          }
          
          if (!question.marks || question.marks <= 0) {
            errors.push(`Marks must be greater than 0 for question ${qIndex + 1} in ${group.subjectName}`);
          }
        });
      }
    });
  }
  
  return errors;
};

// ==================== URL Utilities ====================
export const generateExamCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ==================== Question Utilities ====================
export const getQuestionTypeLabel = (type: string | undefined): string => {
  if (!type) return 'Unknown';
  
  const typeMap: Record<string, string> = {
    'mcq': 'Single Choice',
    'multi-correct': 'Multiple Choice',
    'truefalse': 'True/False',
    'short': 'Short Answer',
    'long': 'Long Answer',
    'fillblank': 'Fill in Blank',
    'match': 'Matching',
    'code': 'Coding',
  };
  return typeMap[type] || type;
};

export const getDifficultyColor = (difficulty: string | undefined): string => {
  if (!difficulty) return 'bg-gray-100 text-gray-800';
  
  const colorMap: Record<string, string> = {
    'easy': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'hard': 'bg-red-100 text-red-800',
  };
  return colorMap[difficulty] || 'bg-gray-100 text-gray-800';
};