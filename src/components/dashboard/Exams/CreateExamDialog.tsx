// src/components/dashboard/Exams/CreateExamDialog.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CreateExamForm } from './CreateExamForm';

interface CreateExamDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateExamDialog({ 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  onSuccess 
}: CreateExamDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled && externalOnOpenChange) {
      externalOnOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleSuccess = () => {
    handleOpenChange(false);
    onSuccess?.();
    toast.success('Exam created successfully!');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Create New Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Exam</DialogTitle>
          <DialogDescription>
            Configure your exam settings and add questions
          </DialogDescription>
        </DialogHeader>
        
        <CreateExamForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}