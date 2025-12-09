import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Search, Plus, Filter, Download, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const studentsData = [
  { id: 1, name: 'Arjun Verma', rollNo: '24', class: '10-A', parent: 'Anil Verma', phone: '+91 98765 43210', attendance: 92, status: 'active', feeStatus: 'paid' },
  { id: 2, name: 'Priya Patel', rollNo: '15', class: '10-A', parent: 'Rakesh Patel', phone: '+91 98765 43211', attendance: 88, status: 'active', feeStatus: 'pending' },
  { id: 3, name: 'Rohit Sharma', rollNo: '32', class: '10-B', parent: 'Mohan Sharma', phone: '+91 98765 43212', attendance: 68, status: 'at-risk', feeStatus: 'paid' },
  { id: 4, name: 'Kavya Singh', rollNo: '08', class: '9-A', parent: 'Vikram Singh', phone: '+91 98765 43213', attendance: 95, status: 'active', feeStatus: 'paid' },
  { id: 5, name: 'Amit Kumar', rollNo: '19', class: '10-B', parent: 'Suresh Kumar', phone: '+91 98765 43214', attendance: 75, status: 'active', feeStatus: 'overdue' },
  { id: 6, name: 'Neha Gupta', rollNo: '05', class: '9-B', parent: 'Rajesh Gupta', phone: '+91 98765 43215', attendance: 98, status: 'active', feeStatus: 'paid' },
  { id: 7, name: 'Rahul Joshi', rollNo: '28', class: '10-A', parent: 'Prakash Joshi', phone: '+91 98765 43216', attendance: 82, status: 'active', feeStatus: 'paid' },
  { id: 8, name: 'Meera Nair', rollNo: '12', class: '9-A', parent: 'Krishna Nair', phone: '+91 98765 43217', attendance: 91, status: 'active', feeStatus: 'pending' },
];

const statusStyles = {
  active: 'bg-success/10 text-success border-success/20',
  'at-risk': 'bg-destructive/10 text-destructive border-destructive/20',
  inactive: 'bg-muted text-muted-foreground',
};

const feeStyles = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function Students() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const filteredStudents = studentsData.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.includes(searchQuery);
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Student Management</h1>
            <p className="text-muted-foreground">Manage and view all student information</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="9-A">Class 9-A</SelectItem>
                  <SelectItem value="9-B">Class 9-B</SelectItem>
                  <SelectItem value="10-A">Class 10-A</SelectItem>
                  <SelectItem value="10-B">Class 10-B</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">All Students</CardTitle>
              <Badge variant="secondary">{filteredStudents.length} students</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent/Guardian</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Fee Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {student.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">Roll No. {student.rollNo}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.class}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{student.parent}</p>
                          <p className="text-xs text-muted-foreground">{student.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                student.attendance >= 90
                                  ? 'bg-success'
                                  : student.attendance >= 75
                                  ? 'bg-warning'
                                  : 'bg-destructive'
                              }`}
                              style={{ width: `${student.attendance}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{student.attendance}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={feeStyles[student.feeStatus as keyof typeof feeStyles]}>
                          {student.feeStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusStyles[student.status as keyof typeof statusStyles]}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Student
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
