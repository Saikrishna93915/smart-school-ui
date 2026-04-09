import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExamWarningModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  hideClose?: boolean;
}

const ExamWarningModal: React.FC<ExamWarningModalProps> = ({
  open,
  title,
  message,
  confirmText = 'OK',
  onConfirm,
  hideClose = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onConfirm()}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        {!hideClose && (
          <div className="absolute left-4 top-4 rounded-full bg-amber-100 p-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
        )}
        <DialogHeader className="pt-8">
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed whitespace-pre-line">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button className="min-w-28" onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExamWarningModal;
