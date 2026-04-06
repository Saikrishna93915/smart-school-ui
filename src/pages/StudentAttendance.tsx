import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  Moon,
  Sun,
  CalendarDays,
  TrendingUp,
  Award,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';

interface StudentInfo {
  _id: string;
  admissionNumber: string;
  className?: string;
  student?: {
    firstName: string;
    lastName: string;
  };
  firstName?: string;
  lastName?: string;
  class?: {
    className?: string;
    classNumericValue?: number;
  };
  section?: string;
  profilePic?: string;
}

interface AttendanceRecord {
  _id?: string;
  date: string;
  morning: boolean | null;
  afternoon: boolean | null;
  status: 'present' | 'absent' | 'partial' | 'pending';
  markedAt?: string;
  markedBy?: string;
}

const StudentAttendance: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'month' | 'year' | 'summary'>('month');
  const [stats, setStats] = useState({
    today: { morning: null as boolean | null, afternoon: null as boolean | null, status: 'pending' as string },
    weekly: { present: 0, total: 0, rate: 0 },
    monthly: { present: 0, total: 0, rate: 0 },
    yearly: { present: 0, total: 0, rate: 0 }
  });

  // Fetch student data and attendance
  useEffect(() => {
    const loadStudentAttendance = async () => {
      try {
        setLoading(true);
        
        // Generate mock student info from auth context
        const fullName = user?.name || 'Student User';
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ') || 'User';
        
        const mockStudentInfo: StudentInfo = {
          _id: user?.email || '',
          admissionNumber: 'ADM2024001',
          firstName: firstName,
          lastName: lastName,
          className: '10',
          section: 'A'
        };
        
        setStudentInfo(mockStudentInfo);
        
        // Generate mock attendance data for the selected month
        const mockData = generateMockAttendanceData(selectedMonth);
        setAttendanceData(mockData);
        calculateStats(mockData);

      } catch (error) {
        console.error('Failed to load attendance:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load attendance data"
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudentAttendance();
  }, [user, selectedMonth, toast]);

  // Generate mock data for demonstration
  const generateMockAttendanceData = (month: Date): AttendanceRecord[] => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = getDay(date);
      
      // Skip Sundays
      if (dayOfWeek === 0) {
        return {
          date: dateStr,
          morning: null,
          afternoon: null,
          status: 'pending'
        };
      }

      // Generate random attendance (present/absent/partial)
      const rand = Math.random();
      let morning: boolean | null = null;
      let afternoon: boolean | null = null;
      let status: 'present' | 'absent' | 'partial' | 'pending' = 'pending';

      if (date > new Date()) {
        status = 'pending';
      } else if (rand < 0.75) {
        morning = true;
        afternoon = true;
        status = 'present';
      } else if (rand < 0.90) {
        morning = true;
        afternoon = false;
        status = 'partial';
      } else {
        morning = false;
        afternoon = false;
        status = 'absent';
      }

      return {
        date: dateStr,
        morning,
        afternoon,
        status,
        markedAt: date <= new Date() ? format(date, 'yyyy-MM-dd HH:mm:ss') : undefined,
        markedBy: date <= new Date() ? 'Class Teacher' : undefined
      };
    });
  };

  // Calculate statistics from attendance data
  const calculateStats = (data: AttendanceRecord[]) => {
    // Today's status
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayRecord = data.find(d => d.date === today);
    
    // Weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekData = data.filter(d => {
      const dDate = parseISO(d.date);
      return dDate >= weekAgo && dDate <= new Date() && d.status !== 'pending';
    });
    
    const weekPresent = weekData.filter(d => d.status === 'present').length;
    
    // Monthly stats
    const monthData = data.filter(d => d.status !== 'pending');
    const monthPresent = monthData.filter(d => d.status === 'present').length;
    const monthPartial = monthData.filter(d => d.status === 'partial').length;
    const monthTotal = monthData.length;

    setStats({
      today: {
        morning: todayRecord?.morning ?? null,
        afternoon: todayRecord?.afternoon ?? null,
        status: todayRecord?.status || 'pending'
      },
      weekly: {
        present: weekPresent,
        total: weekData.length,
        rate: weekData.length ? Math.round((weekPresent / weekData.length) * 100) : 0
      },
      monthly: {
        present: monthPresent,
        total: monthTotal,
        rate: monthTotal ? Math.round(((monthPresent + monthPartial * 0.5) / monthTotal) * 100) : 0
      },
      yearly: {
        present: 0,
        total: 0,
        rate: 0
      }
    });
  };

  // Generate calendar days for the month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = attendanceData.find(d => d.date === dateStr);
      
      let status: 'present' | 'absent' | 'partial' | 'pending' | 'future' = 'pending';
      let morning = false;
      let afternoon = false;

      if (record) {
        morning = record.morning === true;
        afternoon = record.afternoon === true;
        
        if (morning && afternoon) status = 'present';
        else if (!morning && !afternoon && record.morning !== null) status = 'absent';
        else if (morning || afternoon) status = 'partial';
        else status = record.status;
      } else if (date > new Date()) {
        status = 'future';
      }

      return {
        date,
        dateStr,
        day: date.getDate(),
        isToday: isToday(date),
        isCurrentMonth: isSameMonth(date, selectedMonth),
        status,
        morning,
        afternoon,
        record
      };
    });
  }, [selectedMonth, attendanceData]);

  // Get status color and icon
  const getStatusDetails = (status: string, morning?: boolean, afternoon?: boolean) => {
    switch (status) {
      case 'present':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle2,
          label: 'Present',
          textColor: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'absent':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: XCircle,
          label: 'Absent',
          textColor: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      case 'partial':
        return {
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: AlertCircle,
          label: morning && !afternoon ? 'Morning Only' : 'Afternoon Only',
          textColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50'
        };
      case 'future':
        return {
          color: 'bg-gray-50 text-gray-400 border-gray-200',
          icon: Clock,
          label: 'Upcoming',
          textColor: 'text-gray-400',
          bgColor: 'bg-gray-50'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-500 border-gray-200',
          icon: Clock,
          label: 'Pending',
          textColor: 'text-gray-500',
          bgColor: 'bg-gray-50'
        };
    }
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    // Don't allow future months beyond current
    if (newDate <= new Date()) {
      setSelectedMonth(newDate);
    }
  };

  // Format date for display
  const formatDisplayDate = (date: Date) => {
    return format(date, 'MMMM yyyy');
  };

  // Calculate attendance percentage for month
  const monthAttendancePercentage = useMemo(() => {
    const workingDays = calendarDays.filter(d => 
      d.status !== 'future' && 
      d.status !== 'pending' && 
      getDay(d.date) !== 0
    );
    
    const presentDays = workingDays.filter(d => d.status === 'present').length;
    const partialDays = workingDays.filter(d => d.status === 'partial').length;
    
    const totalPoints = presentDays + (partialDays * 0.5);
    return workingDays.length ? Math.round((totalPoints / workingDays.length) * 100) : 0;
  }, [calendarDays]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>

          {/* Calendar Skeleton */}
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const fullName = studentInfo?.firstName && studentInfo?.lastName 
    ? `${studentInfo.firstName} ${studentInfo.lastName}`
    : user?.name || 'Student';
  const firstName = fullName.split(' ')[0];
  const lastName = fullName.split(' ')[1] || '';
  const className = studentInfo?.className || user?.name?.split(' ')[0] || 'N/A';
  const section = studentInfo?.section || 'N/A';
  const admissionNumber = studentInfo?.admissionNumber || 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Student Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-blue-200 shadow-md">
              {studentInfo?.profilePic ? (
                <AvatarImage src={studentInfo.profilePic} alt="Student" />
              ) : null}
              <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                {firstName[0]}{lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                My Attendance
              </h1>
              <p className="text-slate-600 text-sm md:text-base">
                {firstName} {lastName} • Class {className}-{section} • {admissionNumber}
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard/student')}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 whitespace-nowrap"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Today's Status Card */}
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Today's Attendance</p>
                  <p className="text-lg md:text-xl font-bold">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
                {/* Morning Session */}
                <div className={`px-3 md:px-4 py-2 rounded-lg border flex-1 md:flex-none ${
                  stats.today.morning === true ? 'bg-green-50 border-green-200' :
                  stats.today.morning === false ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sun className={`h-4 w-4 ${
                      stats.today.morning === true ? 'text-green-600' :
                      stats.today.morning === false ? 'text-red-600' :
                      'text-gray-400'
                    }`} />
                    <span className="text-xs md:text-sm font-medium">Morning</span>
                  </div>
                  <p className={`text-sm md:text-lg font-bold mt-1 ${
                    stats.today.morning === true ? 'text-green-600' :
                    stats.today.morning === false ? 'text-red-600' :
                    'text-gray-400'
                  }`}>
                    {stats.today.morning === true ? 'Present' :
                     stats.today.morning === false ? 'Absent' :
                     'Pending'}
                  </p>
                </div>

                {/* Afternoon Session */}
                <div className={`px-3 md:px-4 py-2 rounded-lg border flex-1 md:flex-none ${
                  stats.today.afternoon === true ? 'bg-green-50 border-green-200' :
                  stats.today.afternoon === false ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Moon className={`h-4 w-4 ${
                      stats.today.afternoon === true ? 'text-green-600' :
                      stats.today.afternoon === false ? 'text-red-600' :
                      'text-gray-400'
                    }`} />
                    <span className="text-xs md:text-sm font-medium">Afternoon</span>
                  </div>
                  <p className={`text-sm md:text-lg font-bold mt-1 ${
                    stats.today.afternoon === true ? 'text-green-600' :
                    stats.today.afternoon === false ? 'text-red-600' :
                    'text-gray-400'
                  }`}>
                    {stats.today.afternoon === true ? 'Present' :
                     stats.today.afternoon === false ? 'Absent' :
                     'Pending'}
                  </p>
                </div>

                {/* Full Day Status */}
                <div className={`px-3 md:px-4 py-2 rounded-lg border flex-1 md:flex-none ${
                  stats.today.status === 'present' ? 'bg-green-50 border-green-200' :
                  stats.today.status === 'absent' ? 'bg-red-50 border-red-200' :
                  stats.today.status === 'partial' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <UserCheck className={`h-4 w-4 ${
                      stats.today.status === 'present' ? 'text-green-600' :
                      stats.today.status === 'absent' ? 'text-red-600' :
                      stats.today.status === 'partial' ? 'text-yellow-600' :
                      'text-gray-400'
                    }`} />
                    <span className="text-xs md:text-sm font-medium">Full Day</span>
                  </div>
                  <p className={`text-sm md:text-lg font-bold mt-1 ${
                    stats.today.status === 'present' ? 'text-green-600' :
                    stats.today.status === 'absent' ? 'text-red-600' :
                    stats.today.status === 'partial' ? 'text-yellow-600' :
                    'text-gray-400'
                  }`}>
                    {stats.today.status === 'present' ? 'Present' :
                     stats.today.status === 'absent' ? 'Absent' :
                     stats.today.status === 'partial' ? 'Partial' :
                     'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-full bg-green-100">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  This Week
                </Badge>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.weekly.rate}%</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.weekly.present} out of {stats.weekly.total} days
              </p>
              <Progress value={stats.weekly.rate} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-full bg-blue-100">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  This Month
                </Badge>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.monthly.rate}%</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.monthly.present} out of {stats.monthly.total} days
              </p>
              <Progress value={stats.monthly.rate} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-full bg-purple-100">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  This Year
                </Badge>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.yearly.rate}%</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.yearly.present} out of {stats.yearly.total} days
              </p>
              <Progress value={stats.yearly.rate} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-full bg-amber-100">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Overall
                </Badge>
              </div>
              <p className="text-2xl font-bold text-amber-600">{monthAttendancePercentage}%</p>
              <p className="text-sm text-slate-500 mt-1">
                Month performance
              </p>
              <Progress value={monthAttendancePercentage} className="h-1.5 mt-3" />
            </CardContent>
          </Card>
        </div>

        {/* View Tabs */}
        <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="month">Monthly View</TabsTrigger>
            <TabsTrigger value="year">Yearly View</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* Monthly Calendar View */}
          <TabsContent value="month" className="space-y-4">
            <Card>
              <CardHeader className="border-b bg-slate-50/50">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Attendance Calendar - {formatDisplayDate(selectedMonth)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateMonth('prev')}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonth(new Date())}
                      className="h-8 text-xs"
                    >
                      Current
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateMonth('next')}
                      className="h-8 w-8"
                      disabled={selectedMonth >= new Date()}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Month Summary */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Month Progress</p>
                      <p className="text-2xl font-bold text-blue-600">{monthAttendancePercentage}%</p>
                    </div>
                    <div className="hidden md:block h-8 w-px bg-slate-200" />
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">Partial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                      <span className="text-sm">Pending</span>
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 md:gap-3">
                  {/* Weekday Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs md:text-sm font-medium text-slate-500 py-2">
                      {day}
                    </div>
                  ))}

                  {/* Calendar Days */}
                  {calendarDays.map((day, index) => {
                    const statusDetails = getStatusDetails(day.status, day.morning, day.afternoon);
                    const StatusIcon = statusDetails.icon;

                    return (
                      <div
                        key={index}
                        className={`
                          relative p-2 md:p-3 rounded-lg border transition-all text-xs md:text-sm
                          ${day.isToday ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                          ${statusDetails.color}
                          ${day.status === 'future' ? 'opacity-50' : 'hover:shadow-md cursor-pointer'}
                        `}
                        onClick={() => {
                          if (day.status !== 'future' && day.status !== 'pending') {
                            toast({
                              title: format(day.date, 'EEEE, MMMM dd, yyyy'),
                              description: `Morning: ${day.morning ? 'Present' : day.morning === false ? 'Absent' : 'Not Marked'} • Afternoon: ${day.afternoon ? 'Present' : day.afternoon === false ? 'Absent' : 'Not Marked'}`,
                            });
                          }
                        }}
                      >
                        <div className="text-right mb-1 md:mb-2">
                          <span className={`font-bold ${
                            day.status === 'future' ? 'text-gray-400' : 'text-gray-700'
                          }`}>
                            {day.day}
                          </span>
                        </div>
                        
                        <div className="space-y-0.5 md:space-y-1">
                          {day.status !== 'future' && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500 text-xs">AM</span>
                                <StatusIcon className={`h-3 w-3 ${statusDetails.textColor}`} />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500 text-xs">PM</span>
                                <StatusIcon className={`h-3 w-3 ${statusDetails.textColor}`} />
                              </div>
                            </>
                          )}
                          
                          {day.status === 'future' && (
                            <div className="text-center py-1 md:py-2">
                              <Clock className="h-3 w-3 md:h-4 md:w-4 mx-auto text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Yearly View */}
          <TabsContent value="year">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Yearly Attendance Summary - {new Date().getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = new Date();
                    month.setMonth(i);
                    const monthName = format(month, 'MMMM');
                    
                    const monthData = attendanceData.filter(d => {
                      const dDate = parseISO(d.date);
                      return dDate.getMonth() === i && dDate.getFullYear() === new Date().getFullYear();
                    });

                    const present = monthData.filter(d => d.status === 'present').length;
                    const partial = monthData.filter(d => d.status === 'partial').length;
                    const total = monthData.filter(d => d.status !== 'pending').length;
                    const rate = total ? Math.round(((present + partial * 0.5) / total) * 100) : 0;

                    return (
                      <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm">{monthName}</h3>
                            <Badge className={
                              rate >= 85 ? 'bg-green-600' :
                              rate >= 75 ? 'bg-blue-600' :
                              rate > 0 ? 'bg-yellow-600' :
                              'bg-gray-400'
                            }>
                              {rate}%
                            </Badge>
                          </div>
                          <Progress value={rate} className="h-2 mb-2" />
                          <p className="text-xs text-slate-500">
                            {present} present {partial > 0 ? `, ${partial} partial` : ''} of {total} days
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary View */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Attendance Summary & Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Overall Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-shadow">
                      <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-green-600">
                        {attendanceData.filter(d => d.status === 'present').length}
                      </p>
                      <p className="text-sm text-slate-600">Total Present Days</p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-red-50 to-rose-50 hover:shadow-md transition-shadow">
                      <UserX className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-red-600">
                        {attendanceData.filter(d => d.status === 'absent').length}
                      </p>
                      <p className="text-sm text-slate-600">Total Absent Days</p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md transition-shadow">
                      <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-blue-600">
                        {stats.monthly.rate}%
                      </p>
                      <p className="text-sm text-slate-600">Current Rate</p>
                    </div>
                  </div>

                  {/* Monthly Breakdown Table */}
                  <div>
                    <h3 className="font-semibold mb-4">Monthly Breakdown</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-slate-600">Month</th>
                              <th className="px-4 py-2 text-center font-medium text-slate-600">Present</th>
                              <th className="px-4 py-2 text-center font-medium text-slate-600">Partial</th>
                              <th className="px-4 py-2 text-center font-medium text-slate-600">Absent</th>
                              <th className="px-4 py-2 text-right font-medium text-slate-600">Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 12 }, (_, i) => {
                              const month = new Date();
                              month.setMonth(i);
                              const monthName = format(month, 'MMM');
                              
                              const monthData = attendanceData.filter(d => {
                                const dDate = parseISO(d.date);
                                return dDate.getMonth() === i && dDate.getFullYear() === new Date().getFullYear();
                              });

                              const present = monthData.filter(d => d.status === 'present').length;
                              const partial = monthData.filter(d => d.status === 'partial').length;
                              const absent = monthData.filter(d => d.status === 'absent').length;
                              const total = present + partial + absent;
                              const rate = total ? Math.round(((present + partial * 0.5) / total) * 100) : 0;
                              
                              return (
                                <tr key={i} className="border-t hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-2 font-medium">{monthName}</td>
                                  <td className="px-4 py-2 text-center text-green-600 font-semibold">{present}</td>
                                  <td className="px-4 py-2 text-center text-yellow-600 font-semibold">{partial}</td>
                                  <td className="px-4 py-2 text-center text-red-600 font-semibold">{absent}</td>
                                  <td className="px-4 py-2 text-right font-bold text-blue-600">
                                    {rate}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Attendance Information</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                        <li><strong>Morning session:</strong> 9:00 AM - 12:30 PM</li>
                        <li><strong>Afternoon session:</strong> 1:30 PM - 4:00 PM</li>
                        <li><strong>Full day:</strong> Requires attendance in both morning and afternoon sessions</li>
                        <li><strong>Partial:</strong> Present in either morning or afternoon session only</li>
                        <li><strong>Marked by:</strong> Class teacher or school administration</li>
                        <li>For any discrepancies, please contact the school office</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Legend and Info Footer */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs md:text-sm">Present (Both Sessions)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs md:text-sm">Partial (One Session)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs md:text-sm">Absent (No Sessions)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-xs md:text-sm">Pending/Not Marked</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 w-full md:w-auto text-right">
                Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm a')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAttendance;
