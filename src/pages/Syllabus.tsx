import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { BookOpen, CheckCircle, Circle, Clock, Upload, FileText, Plus, Filter } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

// Mock Data Structure
const syllabusData = [
  {
    id: 'ch-1',
    title: 'Chapter 1: Real Numbers',
    totalLessons: 4,
    completedLessons: 4,
    status: 'completed',
    lessons: [
      { id: 'l-1', title: 'Introduction to Real Numbers', status: 'completed', duration: '45 mins' },
      { id: 'l-2', title: 'Euclid’s Division Lemma', status: 'completed', duration: '50 mins' },
      { id: 'l-3', title: 'Fundamental Theorem of Arithmetic', status: 'completed', duration: '40 mins' },
      { id: 'l-4', title: 'Revisiting Irrational Numbers', status: 'completed', duration: '55 mins' },
    ]
  },
  {
    id: 'ch-2',
    title: 'Chapter 2: Polynomials',
    totalLessons: 5,
    completedLessons: 3,
    status: 'in-progress',
    lessons: [
      { id: 'l-5', title: 'Geometrical Meaning of Zeroes', status: 'completed', duration: '45 mins' },
      { id: 'l-6', title: 'Relationship between Zeroes and Coefficients', status: 'completed', duration: '60 mins' },
      { id: 'l-7', title: 'Division Algorithm for Polynomials', status: 'completed', duration: '50 mins' },
      { id: 'l-8', title: 'Problem Solving Session', status: 'current', duration: '45 mins' },
      { id: 'l-9', title: 'Chapter Test & Review', status: 'pending', duration: '60 mins' },
    ]
  },
  {
    id: 'ch-3',
    title: 'Chapter 3: Pair of Linear Equations',
    totalLessons: 6,
    completedLessons: 0,
    status: 'pending',
    lessons: [
      { id: 'l-10', title: 'Introduction to Linear Equations', status: 'pending', duration: '40 mins' },
      { id: 'l-11', title: 'Graphical Method of Solution', status: 'pending', duration: '55 mins' },
      { id: 'l-12', title: 'Substitution Method', status: 'pending', duration: '50 mins' },
    ]
  }
];

const statusStyles = {
  completed: 'text-success',
  current: 'text-primary animate-pulse',
  pending: 'text-muted-foreground',
};

const statusIcons = {
  completed: CheckCircle,
  current: Clock,
  pending: Circle,
};

export default function Syllabus() {
  const [board, setBoard] = useState('cbse');
  const [selectedClass, setSelectedClass] = useState('10');
  const [subject, setSubject] = useState('math');

  // Calculate overall progress
  const totalChapters = syllabusData.length;
  const totalLessons = syllabusData.reduce((acc, curr) => acc + curr.totalLessons, 0);
  const completedLessons = syllabusData.reduce((acc, curr) => acc + curr.completedLessons, 0);
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Syllabus & Lesson Planning</h1>
            <p className="text-muted-foreground">Manage curriculum, track progress, and plan lessons</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Syllabus
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson Plan
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Education Board</label>
                <Select value={board} onValueChange={setBoard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cbse">CBSE</SelectItem>
                    <SelectItem value="icse">ICSE</SelectItem>
                    <SelectItem value="state">State Board</SelectItem>
                    <SelectItem value="ib">IB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">Class 9</SelectItem>
                    <SelectItem value="10">Class 10</SelectItem>
                    <SelectItem value="11">Class 11</SelectItem>
                    <SelectItem value="12">Class 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="secondary" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Chapters"
            value={totalChapters}
            subtitle={`${totalLessons} total lessons`}
            icon={BookOpen}
            variant="primary"
          />
          <StatCard
            title="Syllabus Completion"
            value={`${progressPercentage}%`}
            subtitle="On track for target"
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Pending Lessons"
            value={totalLessons - completedLessons}
            subtitle="Remaining for term"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Teacher Notes"
            value="12"
            subtitle="Uploaded this month"
            icon={FileText}
            variant="default"
          />
        </div>

        {/* Main Content Area */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Syllabus Accordion (Left Side - 2 Cols) */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Course Structure</CardTitle>
                  <Badge variant="outline" className="font-normal">
                    {board.toUpperCase()} • Class {selectedClass} • {subject.charAt(0).toUpperCase() + subject.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="ch-2" className="w-full">
                  {syllabusData.map((chapter) => (
                    <AccordionItem key={chapter.id} value={chapter.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="text-left">
                            <p className="font-semibold">{chapter.title}</p>
                            <p className="text-xs text-muted-foreground font-normal mt-1">
                              {chapter.completedLessons}/{chapter.totalLessons} lessons completed
                            </p>
                          </div>
                          {chapter.status === 'completed' && <Badge variant="success">Completed</Badge>}
                          {chapter.status === 'in-progress' && <Badge variant="warning">In Progress</Badge>}
                          {chapter.status === 'pending' && <Badge variant="secondary">Not Started</Badge>}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="space-y-2 pl-4 border-l-2 border-muted ml-2">
                          {chapter.lessons.map((lesson) => {
                            const Icon = statusIcons[lesson.status as keyof typeof statusIcons];
                            return (
                              <div key={lesson.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group transition-colors">
                                <div className="flex items-center gap-3">
                                  <Icon className={`h-4 w-4 ${statusStyles[lesson.status as keyof typeof statusStyles]}`} />
                                  <div>
                                    <p className={`text-sm font-medium ${lesson.status === 'completed' ? 'text-muted-foreground line-through decoration-border' : ''}`}>
                                      {lesson.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">{lesson.duration}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon-sm" title="Upload Notes">
                                    <Upload className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon-sm" title="View Details">
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Progress & Quick Upload */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Progress</CardTitle>
                <CardDescription>Term completion status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Syllabus Covered</span>
                    <span className="text-muted-foreground">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Practical Work</span>
                    <span className="font-medium">60%</span>
                  </div>
                   <Progress value={60} className="h-1.5 bg-secondary/20" />
                   
                   <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assignments</span>
                    <span className="font-medium">85%</span>
                  </div>
                   <Progress value={85} className="h-1.5 bg-success/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Quick Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:bg-background transition-colors cursor-pointer">
                  <FileText className="h-8 w-8 mx-auto text-primary/50 mb-2" />
                  <p className="text-sm font-medium">Drop teacher notes here</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX up to 10MB</p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    
  );
}