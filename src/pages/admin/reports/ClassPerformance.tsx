import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Download
} from 'lucide-react';

// Static Data
const classPerformanceData = [
  { 
    id: 1,
    className: '10', 
    section: 'A', 
    students: 42,
    average: 78.5, 
    highest: 98, 
    lowest: 35,
    passRate: 92.8,
    previousAverage: 76.2,
    trend: 'up',
    topStudent: 'Priya Singh',
    weakStudents: 3,
    subjectAverages: {
      math: 76,
      science: 82,
      english: 74,
      hindi: 71,
      sst: 78
    }
  },
  { 
    id: 2,
    className: '10', 
    section: 'B', 
    students: 40,
    average: 72.4, 
    highest: 94, 
    lowest: 32,
    passRate: 85.0,
    previousAverage: 73.8,
    trend: 'down',
    topStudent: 'Rahul Kumar',
    weakStudents: 5,
    subjectAverages: {
      math: 70,
      science: 75,
      english: 72,
      hindi: 68,
      sst: 74
    }
  },
  { 
    id: 3,
    className: '9', 
    section: 'A', 
    students: 38,
    average: 81.2, 
    highest: 100, 
    lowest: 42,
    passRate: 94.7,
    previousAverage: 79.4,
    trend: 'up',
    topStudent: 'Ananya Gupta',
    weakStudents: 2,
    subjectAverages: {
      math: 80,
      science: 85,
      english: 79,
      hindi: 76,
      sst: 82
    }
  },
  { 
    id: 4,
    className: '9', 
    section: 'B', 
    students: 41,
    average: 68.9, 
    highest: 89, 
    lowest: 28,
    passRate: 78.0,
    previousAverage: 70.1,
    trend: 'down',
    topStudent: 'Arjun Reddy',
    weakStudents: 8,
    subjectAverages: {
      math: 65,
      science: 70,
      english: 68,
      hindi: 64,
      sst: 69
    }
  },
  { 
    id: 5,
    className: '8', 
    section: 'A', 
    students: 39,
    average: 75.6, 
    highest: 96, 
    lowest: 38,
    passRate: 89.7,
    previousAverage: 75.6,
    trend: 'stable',
    topStudent: 'Neha Sharma',
    weakStudents: 4,
    subjectAverages: {
      math: 74,
      science: 78,
      english: 73,
      hindi: 70,
      sst: 75
    }
  },
  { 
    id: 6,
    className: '8', 
    section: 'B', 
    students: 37,
    average: 70.1, 
    highest: 88, 
    lowest: 31,
    passRate: 81.1,
    previousAverage: 72.3,
    trend: 'down',
    topStudent: 'Vikram Singh',
    weakStudents: 6,
    subjectAverages: {
      math: 68,
      science: 72,
      english: 69,
      hindi: 65,
      sst: 71
    }
  },
];

const ClassPerformance: React.FC = () => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (passRate: number) => {
    if (passRate >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (passRate >= 80) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (passRate >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Class-wise Performance Analysis</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Average %</TableHead>
                <TableHead>Highest</TableHead>
                <TableHead>Lowest</TableHead>
                <TableHead>Pass Rate</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Weak Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classPerformanceData.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(row.id)}>
                    <TableCell>
                      {expandedRow === row.id ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </TableCell>
                    <TableCell className="font-medium">Class {row.className}</TableCell>
                    <TableCell>{row.section}</TableCell>
                    <TableCell>{row.students}</TableCell>
                    <TableCell className="font-bold">{row.average}%</TableCell>
                    <TableCell className="text-green-600 font-medium">{row.highest}%</TableCell>
                    <TableCell className="text-red-600 font-medium">{row.lowest}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={row.passRate} className="w-16 h-2" />
                        <span>{row.passRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getTrendIcon(row.trend)}</TableCell>
                    <TableCell>{getStatusBadge(row.passRate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-50">
                        {row.weakStudents} students
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row - Subject Details */}
                  {expandedRow === row.id && (
                    <TableRow className="bg-blue-50/50">
                      <TableCell colSpan={12} className="p-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Subject-wise Averages - Class {row.className}{row.section}</h4>
                          <div className="grid grid-cols-5 gap-4">
                            <div className="text-center p-2 bg-white rounded border">
                              <p className="text-xs text-gray-500">Mathematics</p>
                              <p className="text-lg font-bold text-blue-600">{row.subjectAverages.math}%</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                              <p className="text-xs text-gray-500">Science</p>
                              <p className="text-lg font-bold text-green-600">{row.subjectAverages.science}%</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                              <p className="text-xs text-gray-500">English</p>
                              <p className="text-lg font-bold text-purple-600">{row.subjectAverages.english}%</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                              <p className="text-xs text-gray-500">Hindi</p>
                              <p className="text-lg font-bold text-amber-600">{row.subjectAverages.hindi}%</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                              <p className="text-xs text-gray-500">Social Studies</p>
                              <p className="text-lg font-bold text-indigo-600">{row.subjectAverages.sst}%</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <p className="text-sm">
                              <span className="font-semibold">Top Student:</span> {row.topStudent} ({row.highest}%)
                            </p>
                            <Button size="sm" variant="outline">View Class Details</Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Overall Average</p>
              <p className="text-2xl font-bold">74.5%</p>
              <Progress value={74.5} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Highest Class</p>
              <p className="text-2xl font-bold text-green-600">9A (81.2%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Lowest Class</p>
              <p className="text-2xl font-bold text-red-600">9B (68.9%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Classes Above 80%</p>
              <p className="text-2xl font-bold">2/6 classes</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassPerformance;
