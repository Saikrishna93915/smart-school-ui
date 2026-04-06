// src/Services/proctoring.service.ts

interface ProctoringEvent {
  type: 'tab_switch' | 'copy' | 'paste' | 'fullscreen_exit' | 'right_click' | 'keyboard_shortcut' | 'blur' | 'context_menu';
  timestamp: Date;
  details?: string;
}

interface ProctoringCallbacks {
  onViolation: (event: ProctoringEvent) => void;
  onExamTerminated: () => void;
}

class ProctoringService {
  private events: ProctoringEvent[] = [];
  private examId: string | null = null;
  private studentId: string | null = null;
  private warningCount: number = 0;
  private maxWarnings: number = 3;
  private onViolation: ((event: ProctoringEvent) => void) | null = null;
  private onExamTerminated: (() => void) | null = null;
  private isInitialized: boolean = false;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  initialize(
    examId: string,
    studentId: string,
    callbacks: ProctoringCallbacks,
    maxWarnings: number = 3
  ) {
    if (this.isInitialized) {
      console.warn('Proctoring service already initialized');
      return;
    }

    this.examId = examId;
    this.studentId = studentId;
    this.onViolation = callbacks.onViolation;
    this.onExamTerminated = callbacks.onExamTerminated;
    this.maxWarnings = maxWarnings;
    this.isInitialized = true;
    this.enableProctoring();
  }

  private enableProctoring() {
    // Full screen enforcement
    this.enforceFullScreen();

    // Tab switching detection
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Blur detection (window loses focus)
    window.addEventListener('blur', this.handleBlur);

    // Copy-paste prevention
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('paste', this.handlePaste);
    document.addEventListener('cut', this.handleCut);

    // Right-click prevention
    document.addEventListener('contextmenu', this.handleRightClick);

    // Keyboard shortcuts prevention
    document.addEventListener('keydown', this.handleKeyDown);

    console.log('Proctoring enabled for exam:', this.examId);
  }

  private enforceFullScreen() {
    // Request fullscreen
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Could not enter fullscreen:', err);
      });
    }

    // Monitor fullscreen changes
    const fullscreenHandler = () => {
      if (!document.fullscreenElement) {
        this.logEvent('fullscreen_exit', 'Student exited fullscreen mode');
        this.warningCount++;

        if (this.warningCount >= this.maxWarnings) {
          this.terminateExam('Exceeded maximum warnings for fullscreen exit');
        } else {
          // Try to re-enter fullscreen
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((err) => {
              console.warn('Could not re-enter fullscreen:', err);
            });
          }
        }
      }
    };

    document.addEventListener('fullscreenchange', fullscreenHandler);
    document.addEventListener('webkitfullscreenchange', fullscreenHandler);
    document.addEventListener('mozfullscreenchange', fullscreenHandler);
    document.addEventListener('msfullscreenchange', fullscreenHandler);
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.debounce('tab_switch', () => {
        this.logEvent('tab_switch', 'Student switched to another tab or window');
        this.warningCount++;

        if (this.warningCount >= this.maxWarnings) {
          this.terminateExam('Exceeded maximum warnings for tab switching');
        }
      }, 1000);
    }
  };

  private handleBlur = () => {
    this.debounce('blur', () => {
      this.logEvent('blur', 'Window lost focus');
    }, 1000);
  };

  private handleCopy = (e: ClipboardEvent) => {
    e.preventDefault();
    this.logEvent('copy', 'Student attempted to copy content');
    return false;
  };

  private handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    this.logEvent('paste', 'Student attempted to paste content');
    return false;
  };

  private handleCut = (e: ClipboardEvent) => {
    e.preventDefault();
    this.logEvent('copy', 'Student attempted to cut content');
    return false;
  };

  private handleRightClick = (e: MouseEvent) => {
    e.preventDefault();
    this.debounce('right_click', () => {
      this.logEvent('right_click', 'Student attempted to open context menu');
    }, 500);
    return false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Block common shortcuts
    const blockedKeys = [
      e.ctrlKey && e.key === 'c', // Copy
      e.ctrlKey && e.key === 'v', // Paste
      e.ctrlKey && e.key === 'x', // Cut
      e.ctrlKey && e.key === 'a', // Select all
      e.ctrlKey && e.key === 'p', // Print
      e.ctrlKey && e.key === 's', // Save
      e.ctrlKey && e.key === 'f', // Find
      e.ctrlKey && e.key === 't', // New tab
      e.ctrlKey && e.key === 'w', // Close tab
      e.ctrlKey && e.key === 'n', // New window
      e.altKey && e.key === 'Tab', // Switch tab
      e.key === 'F11', // Full screen toggle
      e.key === 'Escape', // Exit full screen
      e.metaKey && e.key === 'q', // Quit (Mac)
    ];

    if (blockedKeys.some(Boolean)) {
      e.preventDefault();
      this.debounce('keyboard_shortcut', () => {
        this.logEvent(
          'keyboard_shortcut',
          `Blocked keyboard shortcut: ${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.key}`
        );
      }, 500);
    }
  };

  private debounce(key: string, fn: () => void, delay: number) {
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      fn();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  private logEvent(type: ProctoringEvent['type'], details?: string) {
    const event: ProctoringEvent = {
      type,
      timestamp: new Date(),
      details,
    };

    this.events.push(event);

    if (this.onViolation) {
      this.onViolation(event);
    }

    // Send to backend (fire and forget)
    this.sendEventToServer(event).catch((err) => {
      console.error('Failed to log proctoring event:', err);
    });
  }

  private async sendEventToServer(event: ProctoringEvent): Promise<void> {
    if (!this.examId || !this.studentId) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/exams/proctoring/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId: this.examId,
          studentId: this.studentId,
          type: event.type,
          timestamp: event.timestamp,
          details: event.details,
        }),
      });
    } catch (error) {
      console.error('Failed to send proctoring event to server:', error);
    }
  }

  private terminateExam(reason: string) {
    if (this.onExamTerminated) {
      this.onExamTerminated();
    }

    // Send termination to backend
    if (this.examId && this.studentId) {
      const token = localStorage.getItem('token');
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/exams/proctoring/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId: this.examId,
          studentId: this.studentId,
          reason,
          events: this.events,
        }),
      }).catch((err) => {
        console.error('Failed to send termination event:', err);
      });
    }

    this.cleanup();
  }

  getWarningCount(): number {
    return this.warningCount;
  }

  getEvents(): ProctoringEvent[] {
    return [...this.events];
  }

  cleanup() {
    if (!this.isInitialized) return;

    // Clear all debounce timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('paste', this.handlePaste);
    document.removeEventListener('cut', this.handleCut);
    document.removeEventListener('contextmenu', this.handleRightClick);
    document.removeEventListener('keydown', this.handleKeyDown);

    // Exit fullscreen
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch((err) => {
        console.warn('Could not exit fullscreen:', err);
      });
    }

    this.isInitialized = false;
    this.events = [];
    this.warningCount = 0;
    this.examId = null;
    this.studentId = null;
    this.onViolation = null;
    this.onExamTerminated = null;

    console.log('Proctoring service cleaned up');
  }
}

export const proctoringService = new ProctoringService();
export default proctoringService;
