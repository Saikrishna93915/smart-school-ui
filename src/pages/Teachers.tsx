import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, GraduationCap, Users, Clock, BookOpen, Mail, Phone, MoreVertical } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const teachersData = [
  {
    id: 1,
    name: 'Priya Sharma',
    email: 'priya.sharma@school.edu',
    phone: '+91 98765 43210',
    department: 'Mathematics',
    classes: ['10-A', '9-B', '10-B', '8-A'],
    subjects: ['Mathematics', 'Statistics'],
    experience: '8 years',
    attendance: 96,
    workload: 85,
    status: 'active',
  },
  {
    id: 2,
    name: 'Rahul Verma',
    email: 'rahul.verma@school.edu',
    phone: '+91 98765 43211',
    department: 'English',
    classes: ['10-A', '10-B', '9-A'],
    subjects: ['English', 'Literature'],
    experience: '5 years',
    attendance: 92,
    workload: 72,
    status: 'active',
  },
  {
    id: 3,
    name: 'Meera Nair',
    email: 'meera.nair@school.edu',
    phone: '+91 98765 43212',
    department: 'Science',
    classes: ['10-A', '10-B', '9-A', '9-B'],
    subjects: ['Physics', 'Chemistry'],
    experience: '10 years',
    attendance: 98,
    workload: 90,
    status: 'active',
  },
  {
    id: 4,
    name: 'Vikram Singh',
    email: 'vikram.singh@school.edu',
    phone: '+91 98765 43213',
    department: 'Computer Science',
    classes: ['10-A', '10-B', '9-A', '9-B', '8-A', '8-B'],
    subjects: ['Computer Science', 'IT'],
    experience: '6 years',
    attendance: 94,
    workload: 95,
    status: 'active',
  },
  {
    id: 5,
    name: 'Anita Desai',
    email: 'anita.desai@school.edu',
    phone: '+91 98765 43214',
    department: 'Hindi',
    classes: ['9-A', '9-B', '8-A'],
    subjects: ['Hindi', 'Sanskrit'],
    experience: '12 years',
    attendance: 88,
    workload: 65,
    status: 'on-leave',
  },
];

const staffStats = [
  { label: 'Total Teachers', value: 45, icon: GraduationCap },
  { label: 'Support Staff', value: 28, icon: Users },
  { label: 'Avg. Attendance', value: '94%', icon: Clock },
  { label: 'Classes/Day', value: 6.2, icon: BookOpen },
];

export default function Teachers() {
  return (
   
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Teachers & Staff</h1>
            <p className="text-muted-foreground">Manage teaching and support staff</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {staffStats.map((stat) => (
            <StatCard
              key={stat.label}
              title={stat.label}
              value={stat.value}
              icon={stat.icon}
              variant="primary"
            />
          ))}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, subject, or department..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Filter by Department</Button>
            </div>
          </CardContent>
        </Card>

        {/* Teachers Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">All Teachers</CardTitle>
              <Badge variant="secondary">{teachersData.length} teachers</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Teacher</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachersData.map((teacher) => (
                    <TableRow key={teacher.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarFallback className="bg-secondary/20 text-secondary text-sm font-medium">
                              {teacher.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{teacher.name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {teacher.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{teacher.department}</p>
                          <p className="text-xs text-muted-foreground">
                            {teacher.subjects.join(', ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {teacher.classes.slice(0, 3).map((cls) => (
                            <Badge key={cls} variant="outline" className="text-xs">
                              {cls}
                            </Badge>
                          ))}
                          {teacher.classes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{teacher.classes.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{teacher.workload}%</span>
                          </div>
                          <Progress
                            value={teacher.workload}
                            className={`h-2 ${
                              teacher.workload >= 90
                                ? '[&>div]:bg-destructive'
                                : teacher.workload >= 75
                                ? '[&>div]:bg-warning'
                                : '[&>div]:bg-success'
                            }`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          teacher.attendance >= 95
                            ? 'text-success'
                            : teacher.attendance >= 85
                            ? 'text-warning'
                            : 'text-destructive'
                        }`}>
                          {teacher.attendance}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={teacher.status === 'active' ? 'success' : 'warning'}
                        >
                          {teacher.status}
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
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit Details</DropdownMenuItem>
                            <DropdownMenuItem>View Schedule</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Remove
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
    
  );
}
