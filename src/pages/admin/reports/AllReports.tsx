import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Award,
  Users,
  BookOpen
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ClassPerformance from './ClassPerformance';
import WeakStudentDetection from './WeakStudentDetection';
import SubjectPerformance from './SubjectPerformance';
import ToppersList from './ToppersList';
import AttendanceImpact from './AttendanceImpact';

// Static Data
const academicYears = [
  { value: "2025-26", label: "2025-26" },
  { value: "2024-25", label: "2024-25" },
  { value: "2023-24", label: "2023-24" },
];

const examTypes = [
  { value: "all", label: "All Exams" },
  { value: "unit-test-1", label: "Unit Test 1" },
  { value: "unit-test-2", label: "Unit Test 2" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half-yearly", label: "Half Yearly" },
  { value: "annual", label: "Annual" },
];

const classOptions = [
  { value: "all", label: "All Classes" },
  { value: "10", label: "Class 10" },
  { value: "9", label: "Class 9" },
  { value: "8", label: "Class 8" },
  { value: "7", label: "Class 7" },
];

const reportStats = {
  totalClasses: 12,
  totalStudents: 486,
  examsConducted: 6,
  averageAttendance: 86,
  overallPassRate: 78.5,
  weakStudents: 42
};

const AllReports: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState("2025-26");
  const [selectedExam, setSelectedExam] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    alert("Exporting consolidated report...");
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold">{reportStats.totalClasses}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{reportStats.totalStudents}</p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pass Rate</p>
              <p className="text-2xl font-bold">{reportStats.overallPassRate}%</p>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Weak Students</p>
              <p className="text-2xl font-bold text-amber-600">{reportStats.weakStudents}</p>
            </div>
            <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Exam" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map(exam => (
                    <SelectItem key={exam.value} value={exam.value}>
                      {exam.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map(cls => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Reports Tabs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Academic Analytics Dashboard
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50">
            {selectedYear} • {selectedExam === 'all' ? 'All Exams' : selectedExam}
          </Badge>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="class-performance" className="space-y-4">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="class-performance" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Class Performance
              </TabsTrigger>
              <TabsTrigger value="weak-students" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Weak Students
              </TabsTrigger>
              <TabsTrigger value="subject-performance" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Subject Analysis
              </TabsTrigger>
              <TabsTrigger value="toppers" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Top Performers
              </TabsTrigger>
              <TabsTrigger value="attendance-impact" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Attendance Impact
              </TabsTrigger>
            </TabsList>

            <TabsContent value="class-performance">
              <ClassPerformance />
            </TabsContent>

            <TabsContent value="weak-students">
              <WeakStudentDetection />
            </TabsContent>

            <TabsContent value="subject-performance">
              <SubjectPerformance />
            </TabsContent>

            <TabsContent value="toppers">
              <ToppersList />
            </TabsContent>

            <TabsContent value="attendance-impact">
              <AttendanceImpact />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Insights Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">📊 Last Updated: Today 10:30 AM</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Data Source: Unit Test 1, 2, Quarterly</span>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Auto-refresh every 30 mins
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllReports;
