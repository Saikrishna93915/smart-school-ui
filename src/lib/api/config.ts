// src/lib/api/config.ts

export const API_CONFIG = {
    // Use environment variable or fallback to localhost
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    
    // Timeouts
    TIMEOUT: 30000,
    
    // Retry settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    
    // Headers
    DEFAULT_HEADERS: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  } as const;
  
  export const STORAGE_KEYS = {
    TOKEN: 'smart_school_token',
    USER: 'smart_school_user',
    THEME: 'smart_school_theme',
    EXAM_PROGRESS: 'exam_progress_',
  } as const;
  
  export const EXAM_CONSTANTS = {
    CLASS_LIST: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'],
    SECTION_LIST: ['A', 'B', 'C', 'D', 'E', 'F'],
    SUBJECT_OPTIONS: [
      'Mathematics', 'Science', 'English', 'History', 'Physics', 'Chemistry',
      'Biology', 'Computer Science', 'Geography', 'Economics', 'Business Studies',
      'Art', 'Music', 'Physical Education', 'Languages'
    ],
    QUESTION_TYPES: [
      { value: 'mcq', label: 'Single Choice', icon: '🔘' },
      { value: 'multi-correct', label: 'Multiple Choice', icon: '☑️' },
      { value: 'truefalse', label: 'True/False', icon: '⚖️' },
      { value: 'short', label: 'Short Answer', icon: '📝' },
      { value: 'long', label: 'Long Answer', icon: '📄' },
      { value: 'fillblank', label: 'Fill in Blank', icon: '🔤' },
      { value: 'match', label: 'Matching', icon: '🔗' },
      { value: 'code', label: 'Coding', icon: '💻' },
    ],
    DIFFICULTY_OPTIONS: [
      { value: 'easy', label: 'Easy', color: '#10b981' },
      { value: 'medium', label: 'Medium', color: '#f59e0b' },
      { value: 'hard', label: 'Hard', color: '#ef4444' },
    ],
    EXAM_PATTERNS: [
      { value: 'STANDARD', label: 'Standard Pattern', desc: 'Traditional exam with fixed sections' },
      { value: 'COMPETITIVE', label: 'Competitive Pattern', desc: 'Time-bound with negative marking' },
      { value: 'PRACTICAL', label: 'Practical/Viva', desc: 'Skill-based assessment' },
      { value: 'OPEN_BOOK', label: 'Open Book', desc: 'Reference materials allowed' },
      { value: 'TIME_BOUND', label: 'Time-Bound Sections', desc: 'Each section has separate timer' },
      { value: 'ADAPTIVE', label: 'Adaptive Testing', desc: 'AI-powered difficulty adjustment' },
    ],
    PROCTORING_MODES: [
      { value: 'basic', label: 'Basic', desc: 'No special monitoring' },
      { value: 'ai', label: 'AI Monitoring', desc: 'AI-based proctoring' },
      { value: 'live', label: 'Live Proctoring', desc: 'Real-time human monitoring' },
      { value: 'strict', label: 'Strict Mode', desc: 'Full-screen, no switching allowed' },
    ],
  } as const;