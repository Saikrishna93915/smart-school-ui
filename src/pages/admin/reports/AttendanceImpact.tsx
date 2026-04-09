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
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';

// Static Data
const attendanceImpactData = [
  { 
    range: '90-100%',
    students: 124,
    averageMarks: 85.6,
    performance: 'Excellent',
    color: 'green'
  },
  { 
    range: '75-89%',
    students: 186,
    averageMarks: 74.2,
    performance: 'Good',
    color: 'blue'
  },
  { 
    range: '60-74%',
    students: 98,
    averageMarks: 62.8,
    performance: 'Average',
    color: 'yellow'
  },
  { 
    range: 'Below 60%',
    students: 78,
    averageMarks: 45.3,
    performance: 'Poor',
    color: 'red'
  },
];

const studentImpactData = [
  {
    name: 'Ravi Verma',
    class: '7B',
    attendance: 45,
    marks: 38,
    impact: 'Critical',
    trend: 'down'
  },
  {
    name: 'Arun Sharma',
    class: '8C',
    attendance: 58,
    marks: 42,
    impact: 'High',
    trend: 'down'
  },
  {
    name: 'Priya Singh',
    class: '9B',
    attendance: 72,
    marks: 58,
    impact: 'Medium',
    trend: 'stable'
  },
  {
    name: 'Rahul Kumar',
    class: '10A',
    attendance: 65,
    marks: 45,
    impact: 'High',
    trend: 'down'
  },
  {
    name: 'Neha Gupta',
    class: '6A',
    attendance: 82,
    marks: 75,
    impact: 'Low',
    trend: 'up'
  },
];

const AttendanceImpact: React.FC = () => {
  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'Critical': return 'text-red-600 font-bold';
      case 'High': return 'text-orange-600 font-bold';
      case 'Medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Attendance vs Academic Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Correlation Chart */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {attendanceImpactData.map((item) => (
            <Card key={item.range} className={`border-l-4 border-l-${item.color}-500`}>
              <CardContent className="p-4">
                <p className="text-sm font-medium">{item.range}</p>
                <p className="text-2xl font-bold mt-1">{item.students} students</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Avg Marks</span>
                  <span className={`text-lg font-bold text-${item.color}-600`}>
                    {item.averageMarks}%
                  </span>
                </div>
                <Progress 
                  value={item.averageMarks} 
                  className={`h-1.5 mt-2 bg-${item.color}-100`} 
                />
                <Badge className={`mt-2 bg-${item.color}-100 text-${item.color}-800`}>
                  {item.performance}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Insight Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800">Key Insight</h4>
                <p className="text-sm text-blue-700">
                  Students with attendance above 75% score an average of 78% marks. 
                  Students with attendance below 60% score only 45% marks on average.
                  <span className="font-bold block mt-1">
                    Improving attendance by 10% can increase marks by 15-20%.
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Impacted by Low Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Students Severely Impacted by Low Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Average Marks</TableHead>
                  <TableHead>Impact Level</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentImpactData.map((student, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>
                      <span className={student.attendance < 60 ? 'text-red-600 font-bold' : ''}>
                        {student.attendance}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={student.marks < 50 ? 'text-red-600 font-bold' : ''}>
                        {student.marks}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={getImpactColor(student.impact)}>
                        {student.impact}
                      </span>
                    </TableCell>
                    <TableCell>
                      {student.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : student.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <span className="text-gray-400">→</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Recommendation</p>
                <p className="text-sm text-green-700">
                  Focus on improving attendance of 78 students in the "Below 60%" category. 
                  This could potentially increase overall school average by 8-10%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default AttendanceImpact;
