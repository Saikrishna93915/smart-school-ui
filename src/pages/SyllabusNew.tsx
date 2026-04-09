import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  Loader2,
  RefreshCw,
  CheckCheck,
  PlayCircle,
  Target,
  Calendar,
  GraduationCap,
  Filter,
  BookMarked,
  TrendingUp
} from 'lucide-react';
import { SyllabusService, Syllabus, Chapter } from '../Services/syllabus.service';
import { toast } from 'sonner';

// Helper to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'ongoing':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'pending':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// Helper to get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'ongoing':
      return <PlayCircle className="h-4 w-4" />;
    case 'pending':
      return <Circle className="h-4 w-4" />;
    default:
      return <Circle className="h-4 w-4" />;
  }
};

// Chapter Card Component
interface ChapterCardProps {
  chapter: Chapter;
  syllabusId: string;
  canEdit: boolean;
  onUpdate: () => void;
}

const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, syllabusId, canEdit, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: "pending" | "ongoing" | "completed") => {
    if (!canEdit) return;

    setIsUpdating(true);
    try {
      await SyllabusService.updateChapterStatus(syllabusId, chapter._id!, {
        status: newStatus,
        startDate: newStatus === 'ongoing' && !chapter.startDate ? new Date().toISOString() : chapter.startDate,
        endDate: newStatus === 'completed' ? new Date().toISOString() : undefined
      });
      toast.success(`Chapter marked as ${newStatus}`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update chapter status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              Ch. {chapter.chapterNumber}
            </Badge>
            <h4 className="font-semibold text-base">{chapter.chapterName}</h4>
          </div>
          {chapter.description && (
            <p className="text-sm text-muted-foreground mt-1">{chapter.description}</p>
          )}
        </div>

        <Badge className={getStatusColor(chapter.status)}>
          <span className="flex items-center gap-1">
            {getStatusIcon(chapter.status)}
            {chapter.status}
          </span>
        </Badge>
      </div>

      {/* Topics */}
      {chapter.topics && chapter.topics.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Topics:</p>
          <div className="flex flex-wrap gap-1">
            {chapter.topics.map((topic, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {topic.topicName}
                {topic.duration && ` (${topic.duration})`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Learning Outcomes */}
      {chapter.learningOutcomes && chapter.learningOutcomes.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
            <Target className="h-3 w-3" />
            Learning Outcomes:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
            {chapter.learningOutcomes.map((outcome, idx) => (
              <li key={idx}>{outcome}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        {chapter.startDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Started: {new Date(chapter.startDate).toLocaleDateString()}
          </span>
        )}
        {chapter.completedDate && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCheck className="h-3 w-3" />
            Completed: {new Date(chapter.completedDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Teacher Notes (only visible to teachers/admin) */}
      {chapter.teacherNotes && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 mb-3">
          <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
            Teacher Notes:
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">{chapter.teacherNotes}</p>
        </div>
      )}

      {/* Action Buttons (Teacher/Admin only) */}
      {canEdit && (
        <div className="flex gap-2 pt-2 border-t">
          {chapter.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('ongoing')}
              disabled={isUpdating}
              className="text-blue-600 hover:text-blue-700"
            >
              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3 mr-1" />}
              Start
            </Button>
          )}
          {chapter.status === 'ongoing' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('completed')}
              disabled={isUpdating}
              className="text-green-600 hover:text-green-700"
            >
              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
              Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Main Syllabus Component
export default function SyllabusPage() {
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  
  // Detect user role from localStorage
  const getUserRole = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role || 'student';
      } catch {
        return 'student';
      }
    }
    return 'student';
  };
  
  const [userRole] = useState<string>(getUserRole());

  // Fetch syllabus on mount
  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Students get their own syllabus automatically
      if (userRole === 'student') {
        const response = await SyllabusService.getStudentSyllabus();
        setSyllabuses(response.data);
        if (response.data.length > 0) {
          setSelectedSyllabus(response.data[0]);
        }
      } else {
        // Teachers/Admin can see all syllabus (filtered by backend based on role)
        const data = await SyllabusService.getAll();
        setSyllabuses(data);
        if (data.length > 0) {
          setSelectedSyllabus(data[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching syllabus:', err);
      setError(err.message || 'Failed to load syllabus');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique classes, sections for filters
  const uniqueClasses = Array.from(new Set(syllabuses.map(s => s.className))).sort();
  const uniqueSections = Array.from(new Set(syllabuses.map(s => s.section))).sort();

  // Filter syllabuses based on selection
  const filteredSyllabuses = syllabuses.filter(s => {
    if (selectedClass !== 'all' && s.className !== selectedClass) return false;
    if (selectedSection !== 'all' && s.section !== selectedSection) return false;
    return true;
  });

  // Calculate overall statistics
  const overallStats = filteredSyllabuses.reduce((acc, syllabus) => {
    acc.totalChapters += syllabus.totalChapters || 0;
    acc.completedChapters += syllabus.completedChapters || 0;
    acc.ongoingChapters += syllabus.chapters.filter(ch => ch.status === 'ongoing').length;
    acc.pendingChapters += syllabus.chapters.filter(ch => ch.status === 'pending').length;
    return acc;
  }, { totalChapters: 0, completedChapters: 0, ongoingChapters: 0, pendingChapters: 0 });

  const overallProgress = overallStats.totalChapters > 0 
    ? Math.round((overallStats.completedChapters / overallStats.totalChapters) * 100)
    : 0;

  const canEdit = userRole === 'teacher' || userRole === 'admin' || userRole === 'owner';

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading syllabus...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-semibold mb-2">Failed to Load Syllabus</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchSyllabus} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render empty state
  if (syllabuses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No Syllabus Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {userRole === 'student' 
                  ? 'Your syllabus has not been uploaded yet. Please check back later.'
                  : 'No syllabus has been created yet. Create one to get started.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-primary" />
            Syllabus & Course Progress
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {userRole === 'student' 
              ? 'Track your course syllabus and chapter completion progress'
              : 'Manage syllabus and update chapter progress for your courses'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filters */}
          {uniqueClasses.length > 1 && (
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {uniqueSections.length > 1 && (
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {uniqueSections.map(sec => (
                  <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={fetchSyllabus} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overall Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Progress Card */}
        <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-bold text-primary">{overallProgress}%</h2>
            </div>
            <Progress value={overallProgress} className="h-2 mt-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {overallStats.completedChapters} of {overallStats.totalChapters} chapters
            </p>
          </CardContent>
        </Card>

        {/* Completed Stat */}
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Completed</p>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-4xl font-bold text-green-600">{overallStats.completedChapters}</h2>
            <p className="text-xs text-green-700 dark:text-green-300 mt-2">Chapters finished</p>
          </CardContent>
        </Card>

        {/* Ongoing Stat */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Ongoing</p>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold text-blue-600">{overallStats.ongoingChapters}</h2>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">In progress</p>
          </CardContent>
        </Card>

        {/* Pending Stat */}
        <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Pending</p>
              <Circle className="h-5 w-5 text-gray-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-600">{overallStats.pendingChapters}</h2>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">Not started</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Your Subjects
          <Badge variant="secondary">{filteredSyllabuses.length}</Badge>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSyllabuses.map((syllabus) => (
            <Card 
              key={syllabus._id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                selectedSyllabus?._id === syllabus._id 
                  ? 'ring-2 ring-primary shadow-md' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedSyllabus(syllabus)}
            >
              <CardContent className="p-6">
                {/* Subject Name */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1 line-clamp-1">
                      {syllabus.subjectId.subjectName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {syllabus.className} - Sec {syllabus.section}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">
                    {syllabus.subjectId.subjectCode}
                  </Badge>
                </div>

                {/* Circular Progress */}
                <div className="flex items-center justify-center my-4">
                  <div className="relative w-24 h-24">
                    <svg className="transform -rotate-90 w-24 h-24">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - (syllabus.progressPercentage || 0) / 100)}`}
                        className="text-primary transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">{syllabus.progressPercentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Chapter Count */}
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {syllabus.completedChapters} / {syllabus.totalChapters} Chapters
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {syllabus.progressPercentage < 30 ? 'Just started' : 
                     syllabus.progressPercentage < 70 ? 'In progress' : 
                     syllabus.progressPercentage < 100 ? 'Almost done' : 'Completed'}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">{syllabus.completedChapters}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">
                      {syllabus.chapters.filter(ch => ch.status === 'ongoing').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-muted-foreground">
                      {syllabus.chapters.filter(ch => ch.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Selected Subject Details */}
      {selectedSyllabus && (
        <Card className="mt-6">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {selectedSyllabus.subjectId.subjectName}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedSyllabus.className} - Section {selectedSyllabus.section} • {selectedSyllabus.term || 'Annual'} • {selectedSyllabus.academicYear}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedSyllabus.subjectId.subjectCode}</Badge>
                {selectedSyllabus.isPublished && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">Published</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* Chapter List */}
            <div className="space-y-3">
              {selectedSyllabus.chapters
                .sort((a, b) => a.chapterNumber - b.chapterNumber)
                .map((chapter) => (
                  <ChapterCard
                    key={chapter._id}
                    chapter={chapter}
                    syllabusId={selectedSyllabus._id}
                    canEdit={canEdit}
                    onUpdate={fetchSyllabus}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
