import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ScrollArea,
} from '@/components/ui/scroll-area';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Target,
  Calendar,
  BarChart,
  GraduationCap,
  FileUp,
  X,
  TrendingUp,
  Search,
  ChevronDown,
  Brain,
  Target as Bullseye,
  Lightbulb,
  BookMarked,
  FileCheck,
  Clock4,
  CalendarDays,
  UserCheck,
  Layers,
  FileBarChart,
  Upload,
  Globe,
  Video,
  FileText,
  Link as LinkIcon,
  Eye,
  Download,
  FolderOpen,
  Users,
  Settings,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/contexts/AuthContext';

// Local fallback date formatter used by this page (use project's util if available)
function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Enhanced Mock Data Structure with SilverSand features
const syllabusData = [
  {
    id: 'ch-1',
    title: 'Chapter 1: Real Numbers',
    description: 'Understanding number systems, rational and irrational numbers',
    totalLessons: 4,
    completedLessons: 4,
    status: 'completed',
    difficulty: 'medium',
    weightage: 10,
    examPattern: {
      theory: 8,
      practical: 1,
      internal: 1
    },
    lessons: [
      { 
        id: 'l-1', 
        title: 'Introduction to Real Numbers', 
        description: 'Understanding number line and real number properties',
        status: 'completed', 
        duration: '45 mins',
        content: [
          { type: 'video', url: '#', title: 'Real Numbers Intro', uploadedBy: 'Teacher Raj', uploadedAt: '2024-01-15', size: '25 MB' },
          { type: 'pdf', url: '#', title: 'Chapter Notes', uploadedBy: 'Teacher Raj', uploadedAt: '2024-01-15', size: '2 MB' }
        ],
        objectives: ['Identify real numbers', 'Understand number line representation', 'Differentiate rational and irrational'],
        prerequisites: ['Basic number knowledge', 'Decimal understanding'],
        teacherNotes: 'Focus on practical examples. Use number line visualization.'
      },
      { 
        id: 'l-2', 
        title: 'Euclid’s Division Lemma', 
        description: 'Understanding division algorithm and its applications',
        status: 'completed', 
        duration: '50 mins',
        content: [
          { type: 'pdf', url: '#', title: 'Division Lemma Notes', uploadedBy: 'Teacher Raj', uploadedAt: '2024-01-16', size: '3 MB' },
          { type: 'link', url: '#', title: 'Practice Problems', uploadedBy: 'Teacher Raj', uploadedAt: '2024-01-16' }
        ],
        objectives: ['Apply Euclid Division Lemma', 'Solve problems using lemma', 'Understand HCF calculation'],
        prerequisites: ['Basic division knowledge'],
        teacherNotes: 'Use real-life examples for better understanding'
      },
    ]
  },
  {
    id: 'ch-2',
    title: 'Chapter 2: Polynomials',
    description: 'Algebraic expressions, zeroes, and their relationships',
    totalLessons: 5,
    completedLessons: 3,
    status: 'in-progress',
    difficulty: 'medium',
    weightage: 12,
    examPattern: {
      theory: 9,
      practical: 2,
      internal: 1
    },
    lessons: [
      { 
        id: 'l-5', 
        title: 'Geometrical Meaning of Zeroes', 
        description: 'Understanding polynomial graphs and their zeroes',
        status: 'completed', 
        duration: '45 mins',
        content: [
          { type: 'video', url: '#', title: 'Graphical Explanation', uploadedBy: 'Teacher Priya', uploadedAt: '2024-01-20', size: '35 MB' },
          { type: 'image', url: '#', title: 'Graph Examples', uploadedBy: 'Teacher Priya', uploadedAt: '2024-01-20', size: '5 MB' }
        ],
        objectives: ['Plot polynomial graphs', 'Identify zeroes visually', 'Understand curve behavior'],
        prerequisites: ['Coordinate geometry basics', 'Graph plotting'],
        teacherNotes: 'Use graphing software for demonstration'
      },
      { 
        id: 'l-8', 
        title: 'Problem Solving Session', 
        description: 'Advanced problem solving techniques',
        status: 'current', 
        duration: '45 mins',
        content: [],
        objectives: ['Solve complex polynomial problems', 'Apply multiple concepts', 'Time management'],
        prerequisites: ['All previous polynomial lessons'],
        teacherNotes: 'Focus on tricky questions for competitive exams'
      },
    ]
  }
];

// Subject categories as per your requirement
const SUBJECT_CATEGORIES = {
  languages: ['English', 'Hindi', 'Sanskrit', 'French', 'German'],
  mathematics: ['Mathematics', 'Advanced Mathematics', 'Statistics'],
  sciences: ['Physics', 'Chemistry', 'Biology', 'Environmental Science'],
  social: ['History', 'Geography', 'Political Science', 'Economics'],
  commerce: ['Accountancy', 'Business Studies', 'Economics'],
  arts: ['Fine Arts', 'Music', 'Dance'],
  vocational: ['Computer Science', 'Physical Education', 'Home Science']
};

export default function SilverSandLessons() {
  const { user } = useAuth();
  const [board, setBoard] = useState('cbse');
  const [selectedClass, setSelectedClass] = useState('10');
  const [subject, setSubject] = useState('math');
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [activeTab, setActiveTab] = useState('curriculum');
  const [selectedSubjectCategory, setSelectedSubjectCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate overall progress
  const totalChapters = syllabusData.length;
  const totalLessons = syllabusData.reduce((acc, curr) => acc + curr.totalLessons, 0);
  const completedLessons = syllabusData.reduce((acc, curr) => acc + curr.completedLessons, 0);
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

  // Calculate additional stats
  const totalContentItems = syllabusData.reduce((acc, chapter) => 
    acc + chapter.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.content.length, 0), 0);

  // Filter syllabus data based on search
  const filteredSyllabusData = syllabusData.filter(chapter =>
    chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chapter.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chapter.lessons.some(lesson => 
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Permission checks based on role
  const canEdit = ['teacher', 'admin', 'principal'].includes(user?.role || '');
  const canUpload = ['teacher', 'admin'].includes(user?.role || '');
  const canViewAnalytics = ['teacher', 'admin', 'principal', 'parent'].includes(user?.role || '');

  return (
   
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookMarked className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">SilverSand Lessons</h1>
                <p className="text-muted-foreground">
                  {user?.role === 'teacher' ? 'Manage curriculum and deliver lessons' :
                   user?.role === 'student' ? 'Track your learning journey' :
                   user?.role === 'parent' ? 'Monitor academic progress' :
                   'Comprehensive syllabus management system'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <CalendarDays className="h-4 w-4 mr-2" />
              Academic Calendar
            </Button>
            {canUpload && (
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            )}
            {canEdit && (
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New Chapter
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Filters Panel */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Academic Year */}
              <div className="lg:col-span-2 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Academic Year
                </Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023-24">2023-24</SelectItem>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Education Board */}
              <div className="lg:col-span-2 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  Board
                </Label>
                <Select value={board} onValueChange={setBoard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cbse">CBSE</SelectItem>
                    <SelectItem value="icse">ICSE</SelectItem>
                    <SelectItem value="state">State Board</SelectItem>
                    <SelectItem value="ib">IB</SelectItem>
                    <SelectItem value="igcse">IGCSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Class/Grade */}
              <div className="lg:col-span-2 space-y-2">
                <Label className="text-sm font-medium">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {[9, 10, 11, 12].map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>Class {grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Category */}
              <div className="lg:col-span-3 space-y-2">
                <Label className="text-sm font-medium">Subject Category</Label>
                <Select value={selectedSubjectCategory} onValueChange={setSelectedSubjectCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(SUBJECT_CATEGORIES).map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="lg:col-span-2 space-y-2">
                <Label className="text-sm font-medium">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="social">Social Studies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="lg:col-span-1 space-y-2">
                <Label className="text-sm font-medium">Search</Label>
                <div className="relative">
                  <Input 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Chapters"
            value={totalChapters}
            subtitle={`${totalLessons} lessons across syllabus`}
            icon={Layers}
            variant="primary"
            trend={{ value: 2, isPositive: true }}
          />
          <StatCard
            title="Syllabus Covered"
            value={`${progressPercentage}%`}
            subtitle={`${completedLessons}/${totalLessons} lessons completed`}
            icon={Target}
            variant="success"
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Content Library"
            value={totalContentItems}
            subtitle="Videos, PDFs & Resources"
            icon={FileBarChart}
            variant="warning"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Active Students"
            value="45"
            subtitle="85% engagement rate"
            icon={UserCheck}
            variant="default"
            trend={{ value: 95, isPositive: true }}
          />
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="curriculum" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="lesson-plans" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Lesson Plans
            </TabsTrigger>
            {canUpload && (
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Content Upload
              </TabsTrigger>
            )}
            {canViewAnalytics && (
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            )}
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Syllabus Accordion (Left Side - 2 Cols) */}
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookMarked className="h-5 w-5" />
                          Course Structure
                        </CardTitle>
                        <CardDescription>
                          {board.toUpperCase()} • Class {selectedClass} • {subject.charAt(0).toUpperCase() + subject.slice(1)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="font-normal">
                        Academic Year: {academicYear}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredSyllabusData.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No syllabus found</h3>
                        <p className="text-muted-foreground mb-4">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible defaultValue="ch-2" className="w-full">
                        {filteredSyllabusData.map((chapter) => {
                          const chapterProgress = (chapter.completedLessons / chapter.totalLessons) * 100;
                          return (
                            <AccordionItem key={chapter.id} value={chapter.id} className="border rounded-lg mb-4">
                              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-sm font-bold text-primary">
                                        {chapter.id.split('-')[1]}
                                      </span>
                                    </div>
                                    <div className="text-left">
                                      <div className="flex items-center gap-3">
                                        <p className="font-semibold">{chapter.title}</p>
                                        <Badge variant={
                                          chapter.difficulty === 'easy' ? 'success' :
                                          chapter.difficulty === 'medium' ? 'warning' : 'destructive'
                                        } className="text-xs">
                                          {chapter.difficulty}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {chapter.weightage} marks
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">{chapter.description}</p>
                                      <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1 text-xs">
                                          {chapter.status === 'completed' ? 
                                            <CheckCircle className="h-3 w-3 text-success" /> :
                                            <Clock className="h-3 w-3 text-warning" />
                                          }
                                          <span>{chapter.completedLessons}/{chapter.totalLessons} lessons</span>
                                        </div>
                                        <div className="w-32">
                                          <Progress value={chapterProgress} className="h-2" />
                                          <p className="text-xs text-muted-foreground text-center mt-1">
                                            {Math.round(chapterProgress)}% complete
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Badge variant={
                                      chapter.status === 'completed' ? 'success' :
                                      chapter.status === 'in-progress' ? 'warning' : 'secondary'
                                    }>
                                      {chapter.status}
                                    </Badge>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-6 pt-2">
                                {/* Exam Pattern */}
                                <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Bullseye className="h-4 w-4" />
                                    Exam Pattern & Weightage
                                  </h4>
                                  <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-background rounded border">
                                      <p className="text-sm text-muted-foreground">Theory</p>
                                      <p className="text-xl font-bold">{chapter.examPattern.theory} marks</p>
                                    </div>
                                    <div className="text-center p-3 bg-background rounded border">
                                      <p className="text-sm text-muted-foreground">Practical</p>
                                      <p className="text-xl font-bold">{chapter.examPattern.practical} marks</p>
                                    </div>
                                    <div className="text-center p-3 bg-background rounded border">
                                      <p className="text-sm text-muted-foreground">Internal</p>
                                      <p className="text-xl font-bold">{chapter.examPattern.internal} marks</p>
                                    </div>
                                    <div className="text-center p-3 bg-background rounded border">
                                      <p className="text-sm text-muted-foreground">Total</p>
                                      <p className="text-xl font-bold">{chapter.weightage} marks</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Lessons List */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4" />
                                    Lessons ({chapter.lessons.length})
                                  </h4>
                                  {chapter.lessons.map((lesson) => {
                                    return (
                                      <div key={lesson.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                              <Badge variant={
                                                lesson.status === 'completed' ? 'success' :
                                                lesson.status === 'current' ? 'warning' : 'secondary'
                                              } className="text-xs">
                                                {lesson.status}
                                              </Badge>
                                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Clock4 className="h-3 w-3" />
                                                {lesson.duration}
                                              </span>
                                            </div>
                                            <h5 className="font-medium mb-1">{lesson.title}</h5>
                                            <p className="text-sm text-muted-foreground mb-3">{lesson.description}</p>
                                            
                                            {/* Learning Objectives */}
                                            {lesson.objectives && lesson.objectives.length > 0 && (
                                              <div className="mb-3">
                                                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                                  <Brain className="h-3 w-3" />
                                                  Learning Objectives:
                                                </p>
                                                <ul className="space-y-1">
                                                  {lesson.objectives.map((obj, idx) => (
                                                    <li key={idx} className="text-sm flex items-start gap-2">
                                                      <CheckCircle className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                                                      {obj}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}

                                            {/* Content Materials */}
                                            {lesson.content && lesson.content.length > 0 && (
                                              <div className="mt-4">
                                                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                                  <FileCheck className="h-3 w-3" />
                                                  Available Materials:
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  {lesson.content.map((item, idx) => {
                                                    const getContentIcon = (type: string) => {
                                                      switch (type) {
                                                        case 'video': return Video;
                                                        case 'pdf': return FileText;
                                                        case 'image': return FileText;
                                                        default: return LinkIcon;
                                                      }
                                                    };
                                                    const ContentIcon = getContentIcon(item.type);
                                                    return (
                                                      <a
                                                        key={idx}
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-2 rounded border hover:bg-muted transition-colors"
                                                      >
                                                        <div className="flex items-center gap-2">
                                                          <ContentIcon className="h-4 w-4" />
                                                          <div>
                                                            <p className="text-sm font-medium">{item.title}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                              {item.uploadedBy} • {formatDate(item.uploadedAt)}
                                                            </p>
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                          <Button size="icon" variant="ghost" className="h-6 w-6">
                                                            <Eye className="h-3 w-3" />
                                                          </Button>
                                                          <Button size="icon" variant="ghost" className="h-6 w-6">
                                                            <Download className="h-3 w-3" />
                                                          </Button>
                                                        </div>
                                                      </a>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}

                                            {/* Teacher Notes (Visible only to teachers/admins) */}
                                            {user?.role === 'teacher' && lesson.teacherNotes && (
                                              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded">
                                                <p className="text-xs font-medium text-warning mb-1 flex items-center gap-1">
                                                  <Edit className="h-3 w-3" />
                                                  Teacher Notes:
                                                </p>
                                                <p className="text-sm">{lesson.teacherNotes}</p>
                                              </div>
                                            )}
                                          </div>

                                          {/* Action Buttons */}
                                          <div className="flex flex-col gap-2 ml-4">
                                            {canEdit && (
                                              <Button size="sm" variant="outline">
                                                <Edit className="h-3 w-3 mr-2" />
                                                Edit
                                              </Button>
                                            )}
                                            <Button size="sm" variant="ghost">
                                              <Eye className="h-3 w-3 mr-2" />
                                              Preview
                                            </Button>
                                            {canUpload && lesson.content.length === 0 && (
                                              <Button size="sm" variant="secondary">
                                                <Upload className="h-3 w-3 mr-2" />
                                                Add Content
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Progress & Quick Actions */}
              <div className="space-y-6">
                {/* Progress Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Overall Progress
                    </CardTitle>
                    <CardDescription>Term completion status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Syllabus Covered</span>
                        <span className="font-bold">{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Assignments Completed</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-1.5 bg-success/20" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Practical Work</span>
                        <span className="font-medium">60%</span>
                      </div>
                      <Progress value={60} className="h-1.5 bg-warning/20" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Student Engagement</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <Progress value={92} className="h-1.5 bg-primary/20" />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Upload Card */}
                {canUpload && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Upload className="h-4 w-4 text-primary" />
                        Quick Content Upload
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:bg-background transition-colors cursor-pointer">
                          <FileUp className="h-8 w-8 mx-auto text-primary/50 mb-2" />
                          <p className="text-sm font-medium">Drop teaching materials here</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, PPT, Videos, Images up to 100MB</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="w-full">
                            <Video className="h-3 w-3 mr-2" />
                            Record Video
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            <LinkIcon className="h-3 w-3 mr-2" />
                            Add Link
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Deadlines */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Upcoming Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { title: 'Chapter 2 Test', date: 'Tomorrow', type: 'test' },
                        { title: 'Polynomials Assignment', date: 'In 2 days', type: 'assignment' },
                        { title: 'Teacher Meeting', date: 'Friday', type: 'meeting' },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                          <Badge variant={
                            item.type === 'test' ? 'destructive' :
                            item.type === 'assignment' ? 'warning' : 'secondary'
                          } className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Lesson Plans Tab */}
          <TabsContent value="lesson-plans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Lesson Planning
                </CardTitle>
                <CardDescription>Create and manage your lesson schedules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Lesson Planning Module</h3>
                  <p className="text-muted-foreground mb-4">
                    Create detailed lesson plans with objectives, resources, and assessments
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Lesson Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Upload Tab */}
          {canUpload && (
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Content Management
                  </CardTitle>
                  <CardDescription>Upload and organize teaching materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <FileUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-sm font-medium mb-1">Drag & drop files or click to browse</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Supports PDF, PPT, Videos, Images (Max 100MB per file)
                        </p>
                        <Button>Browse Files</Button>
                      </div>

                      {/* Upload Guidelines */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-success/10 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span className="text-sm font-medium">Recommended</span>
                          </div>
                          <ul className="text-xs space-y-1">
                            <li>• PDF for documents</li>
                            <li>• MP4 for videos</li>
                            <li>• Clear images</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-warning/10 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-warning" />
                            <span className="text-sm font-medium">Best Practices</span>
                          </div>
                          <ul className="text-xs space-y-1">
                            <li>• Add descriptions</li>
                            <li>• Tag properly</li>
                            <li>• Preview content</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-destructive/10 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <X className="h-4 w-4 text-destructive" />
                            <span className="text-sm font-medium">Avoid</span>
                          </div>
                          <ul className="text-xs space-y-1">
                            <li>• Copyrighted material</li>
                            <li>• Large files</li>
                            <li>• Low quality</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Recent Uploads</h4>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {[
                            { name: 'Algebra Notes.pdf', date: '2 hours ago', size: '2.4 MB' },
                            { name: 'Geometry Video.mp4', date: '1 day ago', size: '45 MB' },
                            { name: 'Practice Problems.docx', date: '2 days ago', size: '1.8 MB' },
                          ].map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <div>
                                  <p className="text-sm font-medium">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">{file.date} • {file.size}</p>
                                </div>
                              </div>
                              <Button size="icon" variant="ghost" className="h-6 w-6">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Analytics Tab */}
          {canViewAnalytics && (
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Performance Analytics
                  </CardTitle>
                  <CardDescription>Track learning progress and engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Student Performance</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Top Performer</span>
                            <span className="font-bold">94%</span>
                          </div>
                          <Progress value={94} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Class Average</span>
                            <span className="font-bold">76%</span>
                          </div>
                          <Progress value={76} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Needs Improvement</span>
                            <span className="font-bold">58%</span>
                          </div>
                          <Progress value={58} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Content Engagement</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 border rounded">
                          <p className="text-sm text-muted-foreground">Videos</p>
                          <p className="text-2xl font-bold">85%</p>
                          <p className="text-xs text-muted-foreground">Avg. watch time</p>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <p className="text-sm text-muted-foreground">Assignments</p>
                          <p className="text-2xl font-bold">92%</p>
                          <p className="text-xs text-muted-foreground">Submission rate</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Quick Insights</h4>
                      <div className="space-y-2">
                        <div className="p-2 bg-success/10 rounded">
                          <p className="text-sm font-medium">📈 Chapter 1 mastered</p>
                          <p className="text-xs text-muted-foreground">100% completion rate</p>
                        </div>
                        <div className="p-2 bg-warning/10 rounded">
                          <p className="text-sm font-medium">🎯 Focus on Chapter 3</p>
                          <p className="text-xs text-muted-foreground">40% completion rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Teaching Resources
                </CardTitle>
                <CardDescription>Access additional materials and references</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold">Lesson Templates</h4>
                    <p className="text-sm text-muted-foreground mt-1">Ready-to-use templates</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <Video className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold">Video Library</h4>
                    <p className="text-sm text-muted-foreground mt-1">Educational videos</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <Target className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold">Assessment Tools</h4>
                    <p className="text-sm text-muted-foreground mt-1">Quizzes & tests</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold">Teacher Community</h4>
                    <p className="text-sm text-muted-foreground mt-1">Share & collaborate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Standards & Guidelines Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Standards & Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Learning Outcomes
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• Conceptual understanding</li>
                  <li>• Application skills</li>
                  <li>• Analytical thinking</li>
                  <li>• Problem-solving ability</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Assessment Pattern
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• Periodic Tests: 20%</li>
                  <li>• Practical/Project: 30%</li>
                  <li>• Final Exam: 50%</li>
                  <li>• Internal Assessment included</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Access Controls
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• Teachers: Full access + edit</li>
                  <li>• Students: View + submit</li>
                  <li>• Parents: Progress tracking</li>
                  <li>• Admin: Complete management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
}