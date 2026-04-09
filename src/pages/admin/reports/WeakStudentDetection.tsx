import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Eye,
  TrendingDown,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

// Static Data
const weakStudentsData = [
  { 
    id: 1,
    name: 'Rahul Kumar', 
    rollNo: '101',
    class: '10A', 
    admissionNo: 'ADM2023001',
    photo: null,
    weakSubjects: ['Mathematics', 'Science'], 
    marks: { math: 35, science: 38, english: 58, hindi: 62, sst: 55 },
    attendance: 65,
    previousAttendance: 72,
    attendanceTrend: 'down',
    riskLevel: 'high',
    parentContact: '9876543210',
    email: 'parent.rahul@email.com',
    lastAlert: '2025-04-10',
    teacherRemark: 'Needs extra attention in Mathematics. Poor performance in tests.'
  },
  { 
    id: 2,
    name: 'Priya Singh', 
    rollNo: '205',
    class: '9B', 
    admissionNo: 'ADM2023156',
    photo: null,
    weakSubjects: ['English'], 
    marks: { math: 72, science: 68, english: 42, hindi: 65, sst: 70 },
    attendance: 72,
    previousAttendance: 75,
    attendanceTrend: 'down',
    riskLevel: 'medium',
    parentContact: '9876543211',
    email: 'parent.priya@email.com',
    lastAlert: '2025-04-08',
    teacherRemark: 'Struggling with English grammar and comprehension.'
  },
  { 
    id: 3,
    name: 'Arun Sharma', 
    rollNo: '312',
    class: '8C', 
    admissionNo: 'ADM2022890',
    photo: null,
    weakSubjects: ['Hindi', 'Social Studies'], 
    marks: { math: 68, science: 72, english: 65, hindi: 38, sst: 42 },
    attendance: 58,
    previousAttendance: 62,
    attendanceTrend: 'down',
    riskLevel: 'critical',
    parentContact: '9876543212',
    email: 'parent.arun@email.com',
    lastAlert: '2025-04-12',
    teacherRemark: 'Very low attendance. Missing classes regularly.'
  },
  { 
    id: 4,
    name: 'Neha Gupta', 
    rollNo: '428',
    class: '10A', 
    admissionNo: 'ADM2023123',
    photo: null,
    weakSubjects: ['Science'], 
    marks: { math: 82, science: 40, english: 75, hindi: 78, sst: 80 },
    attendance: 80,
    previousAttendance: 78,
    attendanceTrend: 'up',
    riskLevel: 'low',
    parentContact: '9876543213',
    email: 'parent.neha@email.com',
    lastAlert: '2025-04-05',
    teacherRemark: 'Good in other subjects but struggling with Science concepts.'
  },
  { 
    id: 5,
    name: 'Ravi Verma', 
    rollNo: '531',
    class: '7B', 
    admissionNo: 'ADM2022789',
    photo: null,
    weakSubjects: ['Mathematics', 'English', 'Hindi'], 
    marks: { math: 28, science: 45, english: 35, hindi: 30, sst: 48 },
    attendance: 45,
    previousAttendance: 52,
    attendanceTrend: 'down',
    riskLevel: 'critical',
    parentContact: '9876543214',
    email: 'parent.ravi@email.com',
    lastAlert: '2025-04-15',
    teacherRemark: 'Critical situation. Multiple subjects failing. Attendance very low.'
  },
  { 
    id: 6,
    name: 'Sneha Reddy', 
    rollNo: '642',
    class: '6A', 
    admissionNo: 'ADM2023301',
    photo: null,
    weakSubjects: ['Mathematics'], 
    marks: { math: 40, science: 75, english: 82, hindi: 78, sst: 80 },
    attendance: 82,
    previousAttendance: 80,
    attendanceTrend: 'up',
    riskLevel: 'low',
    parentContact: '9876543215',
    email: 'parent.sneha@email.com',
    lastAlert: '2025-04-02',
    teacherRemark: 'Only struggling with Mathematics. Can improve with practice.'
  },
];

const WeakStudentDetection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const getRiskBadge = (risk: string) => {
    switch(risk) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical Risk</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Risk</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Low Risk</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance < 60) return 'text-red-600 font-bold';
    if (attendance < 75) return 'text-orange-600 font-bold';
    return 'text-green-600';
  };

  const getMarksColor = (marks: number) => {
    if (marks < 35) return 'text-red-600 font-bold';
    if (marks < 50) return 'text-orange-600';
    return 'text-gray-600';
  };

  const filteredStudents = weakStudentsData.filter(student => {
    // Search filter
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNo.includes(searchTerm) ||
                         student.admissionNo.includes(searchTerm);
    
    // Risk filter
    const matchesRisk = riskFilter === 'all' || student.riskLevel === riskFilter;
    
    // Class filter
    const matchesClass = classFilter === 'all' || student.class === classFilter;
    
    return matchesSearch && matchesRisk && matchesClass;
  });

  const criticalCount = weakStudentsData.filter(s => s.riskLevel === 'critical').length;
  const highCount = weakStudentsData.filter(s => s.riskLevel === 'high').length;
  const mediumCount = weakStudentsData.filter(s => s.riskLevel === 'medium').length;
  const lowCount = weakStudentsData.filter(s => s.riskLevel === 'low').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Weak Student Detection & Intervention</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Notify Parents
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export List
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Risk</p>
                  <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Immediate intervention needed</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                  <p className="text-2xl font-bold text-orange-600">{highCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Requires attention</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Medium Risk</p>
                  <p className="text-2xl font-bold text-yellow-600">{mediumCount}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Monitor regularly</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Low Risk</p>
                  <p className="text-2xl font-bold text-blue-600">{lowCount}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Minor concerns</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, roll no, admission no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="10A">10A</SelectItem>
              <SelectItem value="9B">9B</SelectItem>
              <SelectItem value="8C">8C</SelectItem>
              <SelectItem value="7B">7B</SelectItem>
              <SelectItem value="6A">6A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Students Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class/Roll</TableHead>
                <TableHead>Weak Subjects</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Last Alert</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.admissionNo}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{student.class}</p>
                      <p className="text-xs text-muted-foreground">Roll: {student.rollNo}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.weakSubjects.map((subject, idx) => (
                        <Badge key={idx} variant="outline" className="bg-red-50">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        <span className={getMarksColor(student.marks.math)}>M:{student.marks.math}</span>
                        <span className={getMarksColor(student.marks.science)}>S:{student.marks.science}</span>
                        <span className={getMarksColor(student.marks.english)}>E:{student.marks.english}</span>
                      </div>
                      <Progress 
                        value={(student.marks.math + student.marks.science + student.marks.english) / 3} 
                        className="h-1 w-20" 
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className={getAttendanceColor(student.attendance)}>
                        {student.attendance}%
                      </span>
                      {student.attendanceTrend === 'down' && (
                        <TrendingDown className="h-3 w-3 text-red-500 inline ml-1" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getRiskBadge(student.riskLevel)}</TableCell>
                  <TableCell>
                    <span className="text-sm">{student.lastAlert}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* AI Recommendations */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              AI-Powered Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <Badge className="bg-red-600">Critical</Badge>
                <div>
                  <p className="font-semibold">Ravi Verma (7B)</p>
                  <p className="text-sm">Immediate parent-teacher meeting required. Attendance below 50%. Failing in 3 subjects.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <Badge className="bg-orange-600">High</Badge>
                <div>
                  <p className="font-semibold">Rahul Kumar (10A)</p>
                  <p className="text-sm">Enroll in remedial classes for Mathematics. Score has dropped 15% in last two tests.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <Badge className="bg-yellow-600">Medium</Badge>
                <div>
                  <p className="font-semibold">Priya Singh (9B)</p>
                  <p className="text-sm">Extra practice worksheets recommended for English grammar.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default WeakStudentDetection;
