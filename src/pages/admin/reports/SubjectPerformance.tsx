import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

// Static Data
const subjectPerformanceData = [
  { 
    subject: 'Mathematics',
    average: 68.5,
    highest: 100,
    lowest: 18,
    passRate: 72.4,
    totalStudents: 486,
    passed: 352,
    failed: 134,
    difficulty: 'hard',
    trend: 'stable',
    classWise: [
      { class: '10A', avg: 76 },
      { class: '10B', avg: 70 },
      { class: '9A', avg: 80 },
      { class: '9B', avg: 65 },
      { class: '8A', avg: 74 },
      { class: '8B', avg: 68 },
    ]
  },
  { 
    subject: 'Science',
    average: 74.2,
    highest: 100,
    lowest: 25,
    passRate: 81.5,
    totalStudents: 486,
    passed: 396,
    failed: 90,
    difficulty: 'medium',
    trend: 'up',
    classWise: [
      { class: '10A', avg: 82 },
      { class: '10B', avg: 75 },
      { class: '9A', avg: 85 },
      { class: '9B', avg: 70 },
      { class: '8A', avg: 78 },
      { class: '8B', avg: 72 },
    ]
  },
  { 
    subject: 'English',
    average: 71.8,
    highest: 98,
    lowest: 22,
    passRate: 78.2,
    totalStudents: 486,
    passed: 380,
    failed: 106,
    difficulty: 'medium',
    trend: 'down',
    classWise: [
      { class: '10A', avg: 74 },
      { class: '10B', avg: 72 },
      { class: '9A', avg: 79 },
      { class: '9B', avg: 68 },
      { class: '8A', avg: 73 },
      { class: '8B', avg: 69 },
    ]
  },
  { 
    subject: 'Hindi',
    average: 66.3,
    highest: 96,
    lowest: 15,
    passRate: 68.9,
    totalStudents: 486,
    passed: 335,
    failed: 151,
    difficulty: 'hard',
    trend: 'down',
    classWise: [
      { class: '10A', avg: 71 },
      { class: '10B', avg: 68 },
      { class: '9A', avg: 76 },
      { class: '9B', avg: 64 },
      { class: '8A', avg: 70 },
      { class: '8B', avg: 65 },
    ]
  },
  { 
    subject: 'Social Studies',
    average: 73.1,
    highest: 99,
    lowest: 28,
    passRate: 79.8,
    totalStudents: 486,
    passed: 388,
    failed: 98,
    difficulty: 'medium',
    trend: 'up',
    classWise: [
      { class: '10A', avg: 78 },
      { class: '10B', avg: 74 },
      { class: '9A', avg: 82 },
      { class: '9B', avg: 69 },
      { class: '8A', avg: 75 },
      { class: '8B', avg: 71 },
    ]
  },
];

const SubjectPerformance: React.FC = () => {
  const getDifficultyBadge = (difficulty: string) => {
    switch(difficulty) {
      case 'hard':
        return <Badge className="bg-red-100 text-red-800">Hard</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'easy':
        return <Badge className="bg-green-100 text-green-800">Easy</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart className="h-5 w-5 text-blue-600" />
          Subject-wise Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Average %</TableHead>
                <TableHead>Highest</TableHead>
                <TableHead>Lowest</TableHead>
                <TableHead>Pass Rate</TableHead>
                <TableHead>Pass/Fail</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectPerformanceData.map((subject) => (
                <TableRow key={subject.subject} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{subject.subject}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={subject.average} className="w-16 h-2" />
                      <span className="font-bold">{subject.average}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">{subject.highest}</TableCell>
                  <TableCell className="text-red-600 font-medium">{subject.lowest}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={subject.passRate} className="w-16 h-2" />
                      <span>{subject.passRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">P:{subject.passed}</Badge>
                      <Badge className="bg-red-100 text-red-800">F:{subject.failed}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{getDifficultyBadge(subject.difficulty)}</TableCell>
                  <TableCell>{getTrendIcon(subject.trend)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Class-wise Subject Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectPerformanceData.map((subject) => (
            <Card key={subject.subject}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{subject.subject}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subject.classWise.map((cls) => (
                    <div key={cls.class} className="flex items-center justify-between">
                      <span className="text-sm">Class {cls.class}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={cls.avg} className="w-24 h-2" />
                        <span className="text-sm font-medium">{cls.avg}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectPerformance;
