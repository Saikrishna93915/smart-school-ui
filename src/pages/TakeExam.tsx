import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertCircle,
  Camera,
  ChevronLeft, 
  ChevronRight, 
  Mic,
  Send,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import examService from '@/Services/exam.service';
import { Exam, Question } from '@/types/exam';
import ExamWarningModal from '@/components/exam/ExamWarningModal';
import { useIsMobile } from '@/hooks/use-mobile';

interface Answer {
  questionId: string;
  answer: any;
  timeSpent?: number;
  markedForReview?: boolean;
}

interface WarningState {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
}

const VIOLATION_LIMIT = 3;

const TakeExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Question and navigation state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerStarted, setTimerStarted] = useState(false);

  // Secure mode state
  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [tabSwitchViolations, setTabSwitchViolations] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [warningState, setWarningState] = useState<WarningState>({
    open: false,
    title: '',
    message: '',
  });

  // Marked for review state
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const continuousBuzzerRef = useRef<number | null>(null);
  const warningFlagsRef = useRef({ tenMinute: false, fiveMinute: false, oneMinute: false });
  const autoSubmitInProgressRef = useRef(false);
  const lastTabViolationAtRef = useRef(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const showWarning = useCallback((title: string, message: string, confirmText = 'OK', onConfirm?: () => void) => {
    setWarningState({
      open: true,
      title,
      message,
      confirmText,
      onConfirm,
    });
  }, []);

  const closeWarning = useCallback(() => {
    const action = warningState.onConfirm;
    setWarningState((prev) => ({ ...prev, open: false, onConfirm: undefined }));
    if (action) {
      action();
    }
  }, [warningState.onConfirm]);

  const playBuzzer = useCallback((durationMs = 280) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000 + 0.02);

      setTimeout(() => {
        ctx.close().catch(() => undefined);
      }, durationMs + 80);
    } catch (err) {
      console.warn('Buzzer playback failed', err);
    }
  }, []);

  const startContinuousBuzzer = useCallback(() => {
    if (continuousBuzzerRef.current !== null) {
      return;
    }

    playBuzzer(220);
    continuousBuzzerRef.current = window.setInterval(() => {
      playBuzzer(220);
    }, 900);
  }, [playBuzzer]);

  const stopContinuousBuzzer = useCallback(() => {
    if (continuousBuzzerRef.current !== null) {
      window.clearInterval(continuousBuzzerRef.current);
      continuousBuzzerRef.current = null;
    }
  }, []);

  const releaseMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCameraActive(false);
    setMicActive(false);
  }, []);

  const attemptFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      return true;
    }

    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch (err) {
      console.error('Could not enter fullscreen', err);
      return false;
    }
  }, []);

  const requestMedia = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        showWarning('Unsupported Browser', 'Camera and microphone access is required but not supported in this browser.');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setCameraActive(stream.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled));
      setMicActive(stream.getAudioTracks().some((track) => track.readyState === 'live' && track.enabled));
      return true;
    } catch (err) {
      console.error('Camera/mic permission denied', err);
      showWarning('Permission Required', 'Camera and microphone are mandatory to start this exam.');
      return false;
    }
  }, [showWarning]);

  const performSubmit = useCallback(async (reason: string, isAutoSubmit = false) => {
    if (!examId || submitting || autoSubmitInProgressRef.current) {
      return;
    }

    autoSubmitInProgressRef.current = true;

    try {
      setSubmitting(true);
      stopContinuousBuzzer();

      const filteredAnswers = answers.filter(
        (answer) => answer.answer !== null && answer.answer !== undefined && answer.answer !== ''
      );

      const response = await examService.submitExam(examId, filteredAnswers);

      if (!response.success) {
        toast.error(response.message || 'Failed to submit exam');
        autoSubmitInProgressRef.current = false;
        return;
      }

      releaseMediaStream();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
      }

      toast.success(isAutoSubmit ? `Exam auto-submitted: ${reason}` : 'Exam submitted successfully!');
      navigate(`/exams/${examId}/results`);
    } catch (err: any) {
      console.error('Submit exam error:', err);
      toast.error(err.message || 'Failed to submit exam');
      autoSubmitInProgressRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [answers, examId, navigate, releaseMediaStream, stopContinuousBuzzer, submitting]);

  const handleAutoSubmit = useCallback((reason: string) => {
    performSubmit(reason, true);
  }, [performSubmit]);

  // Load exam on mount
  useEffect(() => {
    const loadExam = async () => {
      if (!examId) {
        setError('Invalid exam ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let examData: Exam | null = null;

        const myExamsResponse = await examService.getMyExams();
        if (myExamsResponse.success && Array.isArray(myExamsResponse.data)) {
          examData = myExamsResponse.data.find((item) => item?._id === examId) || null;
        }

        if (!examData) {
          try {
            const response = await examService.getExamById(examId);
            if (response.success && response.data) {
              examData = response.data;
            }
          } catch (fetchByIdError) {
            console.warn('Fallback exam fetch by id failed', fetchByIdError);
          }
        }

        if (!examData) {
          setError('Failed to load exam');
          return;
        }

        setExam(examData);

        // Extract all questions from subject groups
        const allQuestions: Question[] = [];
        examData.subjectGroups?.forEach(group => {
          if (group.questions && Array.isArray(group.questions)) {
            allQuestions.push(...group.questions);
          }
        });

        setQuestions(allQuestions);

        // Initialize answers array
        const initialAnswers = allQuestions.map(q => ({
          questionId: q._id || '',
          answer: null,
          timeSpent: 0,
          markedForReview: false
        }));
        setAnswers(initialAnswers);

        // Set timer (duration is in minutes)
        const durationMinutes = examData.durationMinutes || examData.duration || 60;
        setTimeRemaining(durationMinutes * 60);
      } catch (err: any) {
        console.error('Load exam error:', err);
        setError(err.message || 'Failed to load exam');
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]);

  useEffect(() => {
    if (!streamRef.current || !videoRef.current) {
      return;
    }

    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => undefined);
  }, [cameraActive, micActive, examStarted]);

  // Timer countdown
  useEffect(() => {
    if (!timerStarted || !examStarted || timeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit('Time completed');
          return 0;
        }

        const next = prev - 1;

        if (next === 600 && !warningFlagsRef.current.tenMinute) {
          warningFlagsRef.current.tenMinute = true;
          playBuzzer();
          showWarning('Time Warning', 'Only 10 minutes remaining. Please review your answers.');
        }

        if (next === 300 && !warningFlagsRef.current.fiveMinute) {
          warningFlagsRef.current.fiveMinute = true;
          playBuzzer();
          showWarning('Time Warning', 'Only 5 minutes remaining.');
        }

        if (next === 59 && !warningFlagsRef.current.oneMinute) {
          warningFlagsRef.current.oneMinute = true;
          showWarning('Final Minute', 'Final 1 minute started. Submitting soon.');
          startContinuousBuzzer();
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, handleAutoSubmit, playBuzzer, showWarning, startContinuousBuzzer, timeRemaining, timerStarted]);

  useEffect(() => {
    if (!examStarted) {
      return;
    }

    const interval = window.setInterval(async () => {
      if (!examId || submitting) {
        return;
      }

      const filteredAnswers = answers.filter(
        (answer) => answer.answer !== null && answer.answer !== undefined && answer.answer !== ''
      );

      try {
        await examService.saveProgress(examId, filteredAnswers, timeRemaining);
      } catch {
        // Save-progress endpoint may not exist in some builds.
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [answers, examId, examStarted, submitting, timeRemaining]);

  useEffect(() => {
    if (!examStarted) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = 'Exam in progress';

      if (!examId) {
        return;
      }

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const payload = {
        answers: answers.filter((answer) => answer.answer !== null && answer.answer !== undefined && answer.answer !== ''),
      };

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      fetch(`${apiBase}/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => undefined);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [answers, examId, examStarted]);

  useEffect(() => {
    if (!examStarted) {
      return;
    }

    const registerViolation = (type: 'fullscreen' | 'tabswitch') => {
      if (type === 'tabswitch') {
        const now = Date.now();
        if (now - lastTabViolationAtRef.current < 1200) {
          return;
        }
        lastTabViolationAtRef.current = now;

        setTabSwitchViolations((prev) => {
          const next = prev + 1;
          const remaining = Math.max(VIOLATION_LIMIT - next, 0);

          if (next >= VIOLATION_LIMIT) {
            showWarning('Violation Limit Reached', 'Tab switching limit reached. Exam will be auto-submitted.');
            handleAutoSubmit('Tab switch limit reached');
          } else {
            showWarning(
              'Tab Switch Detected',
              `Tab switching is not allowed during the exam.\nThis activity has been recorded.\nRemaining chances: ${remaining}`
            );
          }
          return next;
        });
        return;
      }

      setFullscreenViolations((prev) => {
        const next = prev + 1;
        const remaining = Math.max(VIOLATION_LIMIT - next, 0);

        if (next >= VIOLATION_LIMIT) {
          showWarning('Violation Limit Reached', 'Fullscreen exit limit reached. Exam will be auto-submitted.');
          handleAutoSubmit('Fullscreen limit reached');
        } else {
          showWarning(
            'Fullscreen Required',
            `Warning: You exited fullscreen mode.\n\nYou have ${remaining} chances remaining.\nIf you exit fullscreen more than 3 times, your exam will be automatically submitted.`,
            'Return to Fullscreen',
            () => {
              attemptFullscreen().catch(() => undefined);
            }
          );
        }

        return next;
      });
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !submitting) {
        registerViolation('fullscreen');
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden && !submitting) {
        registerViolation('tabswitch');
      }
    };

    const onBlur = () => {
      if (!submitting) {
        registerViolation('tabswitch');
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [attemptFullscreen, examStarted, handleAutoSubmit, showWarning, submitting]);

  useEffect(() => {
    if (!examStarted) {
      return;
    }

    const blockShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      const blockedCtrlKeys = ['c', 'v', 'x', 'a', 'p'];
      const blockedDevTools =
        key === 'f12' ||
        (isCtrlOrMeta && event.shiftKey && ['i', 'j', 'c'].includes(key));

      if ((isCtrlOrMeta && blockedCtrlKeys.includes(key)) || blockedDevTools) {
        event.preventDefault();
        showWarning('Action Blocked', 'This action is not allowed during the exam.');
      }
    };

    const preventDefault = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener('keydown', blockShortcuts);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('selectstart', preventDefault);

    return () => {
      document.removeEventListener('keydown', blockShortcuts);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
    };
  }, [examStarted, showWarning]);

  useEffect(() => {
    if (!examStarted) {
      return;
    }

    const monitor = window.setInterval(() => {
      if (!streamRef.current || submitting) {
        return;
      }

      const videoOk = streamRef.current.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled);
      const audioOk = streamRef.current.getAudioTracks().some((track) => track.readyState === 'live' && track.enabled);

      setCameraActive(videoOk);
      setMicActive(audioOk);

      if (!videoOk || !audioOk) {
        showWarning('Proctoring Required', 'Camera and microphone must remain enabled during the exam. Auto-submitting now.');
        handleAutoSubmit('Camera/microphone disabled');
      }
    }, 1500);

    return () => window.clearInterval(monitor);
  }, [examStarted, handleAutoSubmit, showWarning, submitting]);

  useEffect(() => {
    return () => {
      stopContinuousBuzzer();
      releaseMediaStream();
    };
  }, [releaseMediaStream, stopContinuousBuzzer]);

  // Hide sidebar and layout when exam is active
  useEffect(() => {
    if (examStarted) {
      document.body.style.overflow = 'hidden';

      const sidebar = document.querySelector('[class*="sidebar"]');
      const layoutWrapper = document.querySelector('[class*="layout"]');
      const header = document.querySelector('header');

      if (sidebar) {
        (sidebar as HTMLElement).style.display = 'none';
      }
      if (layoutWrapper && layoutWrapper !== document.body) {
        (layoutWrapper as HTMLElement).style.display = 'flex';
        (layoutWrapper as HTMLElement).style.width = '100%';
      }
      if (header) {
        (header as HTMLElement).style.display = 'none';
      }

      const mainContent = document.querySelector('main');
      if (mainContent) {
        (mainContent as HTMLElement).style.width = '100%';
        (mainContent as HTMLElement).style.margin = '0';
        (mainContent as HTMLElement).style.padding = '0';
      }
    } else {
      document.body.style.overflow = 'auto';

      const sidebar = document.querySelector('[class*="sidebar"]');
      const header = document.querySelector('header');

      if (sidebar) {
        (sidebar as HTMLElement).style.display = '';
      }
      if (header) {
        (header as HTMLElement).style.display = '';
      }

      const mainContent = document.querySelector('main');
      if (mainContent) {
        (mainContent as HTMLElement).style.width = '';
        (mainContent as HTMLElement).style.margin = '';
        (mainContent as HTMLElement).style.padding = '';
      }
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [examStarted]);

  const handleStartSecureExam = async () => {
    if (isMobile) {
      showWarning('Desktop Required', 'Exam mode is disabled on mobile devices. Please use laptop, desktop, or tablet in desktop mode.');
      return;
    }

    const mediaAllowed = await requestMedia();
    if (!mediaAllowed) {
      return;
    }

    const enteredFullscreen = await attemptFullscreen();
    if (!enteredFullscreen) {
      releaseMediaStream();
      showWarning('Fullscreen Required', 'Unable to enter fullscreen. Please allow fullscreen and try again.');
      return;
    }

    warningFlagsRef.current = { tenMinute: false, fiveMinute: false, oneMinute: false };
    setExamStarted(true);
    setTimerStarted(true);
  };

  // Handle answer change
  const handleAnswerChange = (answer: any) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      ...newAnswers[currentQuestionIndex],
      answer
    };
    setAnswers(newAnswers);
  };

  // Handle mark for review
  const handleMarkForReview = () => {
    const questionId = questions[currentQuestionIndex]?._id || '';
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Navigate to specific question
  const handleGoToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmit = () => {
    setConfirmSubmitOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading exam...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error || 'Exam not found'}</p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/exams')}>
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-amber-600">No Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">This exam has no questions yet.</p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/exams')}>
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Desktop Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Secure exam mode is only available on laptop/desktop/tablet with desktop view.
            </p>
            <Button className="w-full" onClick={() => navigate('/exams')}>
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeColor = timeRemaining < 300 ? 'text-red-600' : 'text-green-600';

  if (!examStarted) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">{exam.name} - Secure Exam Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Rules are active during the exam:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Fullscreen is mandatory</li>
                  <li>Tab switch and window blur are tracked</li>
                  <li>Copy/paste/devtools/right-click are blocked</li>
                  <li>Camera and microphone must stay enabled</li>
                  <li>3 violations trigger auto-submit</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                  <p className="font-medium">Questions</p>
                  <p>{questions.length}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium">Duration</p>
                  <p>{formatTime(timeRemaining)}</p>
                </div>
              </div>

              <Button className="w-full h-11" onClick={handleStartSecureExam}>
                Start Secure Exam
              </Button>
            </CardContent>
          </Card>
        </div>

        <ExamWarningModal
          open={warningState.open}
          title={warningState.title}
          message={warningState.message}
          confirmText={warningState.confirmText}
          onConfirm={closeWarning}
        />
      </>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 p-0 h-screen w-screen bg-gray-50 fixed inset-0 overflow-hidden">
      {/* Main Question Area */}
      <div className="lg:col-span-3 space-y-4 overflow-y-auto p-4">
        {/* Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>{exam.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fullscreen violations: {fullscreenViolations}/{VIOLATION_LIMIT} | Tab violations: {tabSwitchViolations}/{VIOLATION_LIMIT}
              </p>
            </div>
            <div className={`text-2xl font-bold font-mono ${timeColor}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </CardHeader>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline">{currentQuestion.type.toUpperCase()}</Badge>
                  <Badge variant="outline">{currentQuestion.marks} marks</Badge>
                  <Badge variant="secondary">{currentQuestion.difficulty}</Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkForReview}
                className={markedForReview.has(currentQuestion._id || '') ? 'text-orange-500' : ''}
              >
                ⭐
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Question Image */}
            {currentQuestion.image && (
              <img 
                src={currentQuestion.image} 
                alt="Question" 
                className="max-w-full max-h-64 rounded-lg"
              />
            )}

            {/* Answer Options */}
            {currentQuestion.type === 'mcq' && currentQuestion.options && (
              <RadioGroup value={currentAnswer?.answer?.toString() || ''} onValueChange={(val) => handleAnswerChange(parseInt(val))}>
                {currentQuestion.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'truefalse' && (
              <RadioGroup value={currentAnswer?.answer?.toString() || ''} onValueChange={(val) => handleAnswerChange(val === 'true')}>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="cursor-pointer flex-1">True</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="cursor-pointer flex-1">False</Label>
                </div>
              </RadioGroup>
            )}

            {currentQuestion.type === 'short' && (
              <Textarea
                value={currentAnswer?.answer || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[120px]"
              />
            )}

            {(currentQuestion.type === 'long' || currentQuestion.type === 'fillblank') && (
              <Textarea
                value={currentAnswer?.answer || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[150px]"
              />
            )}

            {currentQuestion.type === 'multi-correct' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const selected = Array.isArray(currentAnswer?.answer) ? currentAnswer.answer.includes(idx) : false;

                  return (
                    <label key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) => {
                          const current = Array.isArray(currentAnswer?.answer) ? currentAnswer.answer : [];
                          const next = checked
                            ? [...current, idx]
                            : current.filter((value: number) => value !== idx);
                          handleAnswerChange(next);
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Explanation */}
            {currentQuestion.explanation && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium mb-1">Explanation</p>
                <p className="text-muted-foreground">{currentQuestion.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Exam
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sidebar - Question Navigator */}
      <div className="lg:col-span-1 h-screen overflow-hidden flex flex-col">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Questions</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {questions.map((q, idx) => {
                const answered = answers[idx]?.answer !== null && answers[idx]?.answer !== undefined;
                const isMarked = markedForReview.has(q._id || '');
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => handleGoToQuestion(idx)}
                    className={`w-full p-2 rounded-lg text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-primary text-white'
                        : answered
                        ? 'bg-green-100 text-green-900 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isMarked ? 'ring-2 ring-orange-400' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Q {idx + 1}</span>
                      {isMarked && <span>⭐</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-2 text-xs border-t pt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-100"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-100"></div>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span>Marked for Review</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div className="fixed bottom-4 right-4 z-40 rounded-lg border bg-black text-white shadow-lg overflow-hidden w-48">
      <div className="px-3 py-2 text-xs flex items-center justify-between bg-black/80 border-b border-white/20">
        <span className="font-medium">Live Proctoring</span>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 ${cameraActive ? 'text-green-300' : 'text-red-300'}`}>
            <Camera className="h-3 w-3" />
          </span>
          <span className={`flex items-center gap-1 ${micActive ? 'text-green-300' : 'text-red-300'}`}>
            <Mic className="h-3 w-3" />
          </span>
        </div>
      </div>
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-32 object-cover bg-black" />
    </div>

    <ExamWarningModal
      open={warningState.open}
      title={warningState.title}
      message={warningState.message}
      confirmText={warningState.confirmText}
      onConfirm={closeWarning}
    />

    <ExamWarningModal
      open={confirmSubmitOpen}
      title="Submit Exam"
      message="Are you sure you want to submit? You cannot change your answers after submission."
      confirmText={submitting ? 'Submitting...' : 'Submit Now'}
      onConfirm={() => {
        setConfirmSubmitOpen(false);
        if (!submitting) {
          performSubmit('Submitted by student', false);
        }
      }}
    />
    </>
  );
};

export default TakeExam;
