import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/Services/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, AlertCircle, User, Clock, BookOpen, Download, CheckCircle, Users, Target, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { toast } from 'sonner';
import './StudentTimetable.css';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

interface StudentSlot {
  _id?: string;
  dayOfWeek: number;
  dayName?: string;
  timeSlotId?: {
    _id: string;
    slotName?: string;
    startTime?: string;
    endTime?: string;
    slotType?: string;
  };
  subjectId?: { subjectName?: string; subjectCode?: string };
  teacherId?: { name?: string; email?: string };
  roomNumber?: string;
  isLabSession?: boolean;
  isSplitClass?: boolean;
  splitGroup?: string;
}

/**
 * StudentTimetable Component - Fully Dynamic
 * Shows the current student's class weekly schedule
 */
const StudentTimetable = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const [slots, setSlots] = useState<StudentSlot[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [studentClass, setStudentClass] = useState<{ className: string; sectionId: string; academicYearId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('today');

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const HOLIDAY_INDEX = 0;

  // Get today's day index for highlighting
  const getTodayIndex = () => new Date().getDay();
  const todayIndex = getTodayIndex();
  const isTodayHoliday = todayIndex === HOLIDAY_INDEX;

  const fetchStudentTimetable = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch student class info
      const studentRes = await apiClient.get(`/students?user=${userId}`);
      const studentRecords = ensureArray<any>(studentRes.data?.data);
      const studentData = studentRecords[0];

      if (!studentData?.classId && !studentData?.className) {
        setStudentClass(null);
        setSlots([]);
        setTimeSlots([]);
        setLoading(false);
        return;
      }

      const classId = typeof studentData.classId === 'object' ? studentData.classId?._id : studentData.classId;
      const className =
        (typeof studentData.classId === 'object' ? studentData.classId?.className : undefined) ||
        studentData.className ||
        'Unknown';
      const sectionId =
        (typeof studentData.sectionId === 'object' ? studentData.sectionId?.sectionName : studentData.sectionId) ||
        studentData.section ||
        'A';
      const academicYearId = studentData.academicYearId || '2025-26';

      setStudentClass({ className, sectionId, academicYearId });

      // Fetch class timetable
      const timetableRes = await apiClient.get(
        `/timetable/${classId}/${sectionId}`,
        { params: { academicYearId, term: 'annual' } }
      );

      // Fetch time slots
      const timeSlotsRes = await apiClient.get('/timeslots', {
        params: { academicYearId }
      });

      const timetablePayload = timetableRes.data?.data;
      const rawSlots = timetablePayload?.slots || [];
      setSlots(ensureArray<StudentSlot>(rawSlots));
      setTimeSlots(ensureArray<any>(timeSlotsRes.data?.data));
    } catch (err: any) {
      console.error('Error fetching student timetable:', err);
      if (err.response?.status === 404) {
        // Timetable not created yet - show empty state
        setSlots([]);
        setTimeSlots([]);
      } else if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Failed to load timetable');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStudentTimetable();
  }, [fetchStudentTimetable]);

  // Get slot for specific day and time
  const getSlotForDayTime = (dayOfWeek: number, timeSlotId: string) => {
    return slots.find(slot =>
      slot.dayOfWeek === dayOfWeek &&
      slot.timeSlotId?._id === timeSlotId
    );
  };

  // Get today's schedule
  const getTodaySchedule = () => {
    return slots.filter(slot => slot.dayOfWeek === todayIndex)
      .sort((a, b) => {
        const timeA = a.timeSlotId?.startTime || '';
        const timeB = b.timeSlotId?.startTime || '';
        return timeA.localeCompare(timeB);
      });
  };

  // Get teaching periods
  const getTeachingPeriods = () => {
    return ensureArray<any>(timeSlots).filter(slot => slot.slotType === 'period');
  };

  // Calculate statistics
  const subjectsCount = new Set(
    slots.map(s => s.subjectId?.subjectName).filter(Boolean)
  ).size;

  const teachersCount = new Set(
    slots.map(s => s.teacherId?.name).filter(Boolean)
  ).size;

  const totalPeriods = slots.length;
  const labSessions = slots.filter(s => s.isLabSession).length;
  const todaySlots = getTodaySchedule();

  const handleRefresh = async () => {
    await fetchStudentTimetable();
    toast.success('Timetable refreshed');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="animate-spin inline-block">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Loading your timetable...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Timetable</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!studentClass) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Class Assigned</h3>
          <p className="text-muted-foreground">
            You haven't been assigned to a class yet. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  const teachingPeriods = getTeachingPeriods();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Timetable</h1>
              <p className="text-muted-foreground">
                Class {studentClass.className} — Section {studentClass.sectionId}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Timetable
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Subjects"
          value={subjectsCount}
          subtitle="This week"
          icon={BookOpen}
          variant="primary"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Teachers"
          value={teachersCount}
          subtitle="Assigned"
          icon={Users}
          variant="success"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Total Periods"
          value={totalPeriods}
          subtitle="Per week"
          icon={Clock}
          variant="warning"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Today's Classes"
          value={todaySlots.length}
          subtitle={isTodayHoliday ? 'Holiday today' : 'Scheduled'}
          icon={Target}
          variant="default"
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isTodayHoliday ? 'Holiday' : "Today's Schedule"}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly View
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Today's Schedule Tab */}
        <TabsContent value="today" className="space-y-6">
          {isTodayHoliday ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Holiday!</h3>
                <p className="text-muted-foreground">
                  Today is Sunday. No classes scheduled.
                </p>
              </CardContent>
            </Card>
          ) : todaySlots.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Classes Today</h3>
                <p className="text-muted-foreground">
                  Your class doesn't have any periods scheduled for today.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {DAYS[todayIndex]}'s Schedule
                </CardTitle>
                <CardDescription>
                  Class {studentClass.className} — Section {studentClass.sectionId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaySlots.map((slot) => (
                    <div key={slot._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">
                              {slot.timeSlotId?.slotName || 'Period'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {slot.timeSlotId?.startTime} - {slot.timeSlotId?.endTime}
                            </span>
                          </div>
                          <h4 className="font-semibold text-lg mb-1">
                            {slot.subjectId?.subjectName || 'Unassigned'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {slot.teacherId?.name || 'TBA'}
                            </span>
                            {slot.roomNumber && (
                              <span>Room: {slot.roomNumber}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {slot.isLabSession && (
                            <Badge className="bg-yellow-100 text-yellow-800">Lab</Badge>
                          )}
                          {slot.isSplitClass && (
                            <Badge variant="outline">Group {slot.splitGroup}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Weekly View Tab */}
        <TabsContent value="weekly" className="space-y-6">
          {totalPeriods === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Timetable Available</h3>
                <p className="text-muted-foreground">
                  Your class timetable hasn't been created yet. Contact your administrator.
                </p>
              </CardContent>
            </Card>
          ) : teachingPeriods.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Time Slots Configured</h3>
                <p className="text-muted-foreground">
                  Time slots haven't been set up yet. Contact your administrator.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Timetable
                </CardTitle>
                <CardDescription>
                  Class {studentClass.className} — Section {studentClass.sectionId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Time</th>
                        {DAYS.filter((_, idx) => idx !== HOLIDAY_INDEX).map((day, idx) => (
                          <th
                            key={idx + 1}
                            className={`text-center p-3 font-semibold min-w-24 ${
                              idx + 1 === todayIndex ? 'text-primary underline underline-offset-4' : ''
                            }`}
                          >
                            {day}
                            {idx + 1 === todayIndex && <span className="text-xs block text-primary">(Today)</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teachingPeriods.map((timeSlot) => (
                        <tr key={timeSlot._id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">
                            <div>
                              <p className="font-semibold">{timeSlot.slotName}</p>
                              <p className="text-xs text-muted-foreground">
                                {timeSlot.startTime} - {timeSlot.endTime}
                              </p>
                            </div>
                          </td>

                          {DAYS.filter((_, idx) => idx !== HOLIDAY_INDEX).map((_day, filteredIdx) => {
                            const dayIdx = filteredIdx + 1;
                            const slot = getSlotForDayTime(dayIdx, timeSlot._id);
                            const isToday = dayIdx === todayIndex;

                            return (
                              <td
                                key={`${dayIdx}-${timeSlot._id}`}
                                className={`p-2 text-center ${isToday ? 'bg-primary/5' : ''}`}
                              >
                                {slot ? (
                                  <div className={`rounded-lg border p-2 ${
                                    isToday ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 border-muted'
                                  }`}>
                                    <p className="text-xs font-semibold">
                                      {slot.subjectId?.subjectName || 'N/A'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {slot.teacherId?.name || 'TBA'}
                                    </p>
                                    <div className="flex gap-1 mt-1 justify-center">
                                      {slot.isLabSession && (
                                        <Badge variant="secondary" className="text-xs">Lab</Badge>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground text-xs p-2 rounded bg-muted/20">
                                    Free
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Detailed View Tab */}
        <TabsContent value="detailed" className="space-y-6">
          {slots.length > 0 ? (
            <div className="space-y-4">
              {DAYS.map((day, dayIdx) => {
                if (dayIdx === HOLIDAY_INDEX) return null;
                const daySlots = slots.filter(slot => slot.dayOfWeek === dayIdx);
                if (daySlots.length === 0) return null;

                const isToday = dayIdx === todayIndex;

                return (
                  <Card key={day} className={isToday ? 'border-primary/30' : ''}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {day}
                        {isToday && <Badge variant="outline" className="text-xs">Today</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {daySlots
                        .sort((a, b) => {
                          const timeA = a.timeSlotId?.startTime || '';
                          const timeB = b.timeSlotId?.startTime || '';
                          return timeA.localeCompare(timeB);
                        })
                        .map((slot) => (
                          <div key={slot._id} className="border rounded-lg p-4 hover:bg-muted/50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge variant="outline">
                                    {slot.timeSlotId?.slotName}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {slot.timeSlotId?.startTime} - {slot.timeSlotId?.endTime}
                                  </span>
                                </div>
                                <h4 className="font-semibold mb-1">
                                  {slot.subjectId?.subjectName || 'Unassigned'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Teacher: {slot.teacherId?.name || 'TBA'}
                                </p>
                                {slot.roomNumber && (
                                  <p className="text-sm text-muted-foreground">
                                    Room: {slot.roomNumber}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 ml-4">
                                {slot.isLabSession && (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Lab/Practical</Badge>
                                )}
                                {slot.isSplitClass && (
                                  <Badge variant="outline" className="text-xs">Group {slot.splitGroup}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No detailed schedule to display</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Subject Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {slots.length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(
                      slots.reduce((acc, slot) => {
                        const name = slot.subjectId?.subjectName || 'Unassigned';
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([subject, count]) => (
                      <div key={subject} className="flex items-center justify-between">
                        <span className="text-sm">{subject}</span>
                        <Badge variant="outline">{count} periods/week</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No subjects to display</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teacher Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {slots.length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(
                      slots.reduce((acc, slot) => {
                        const name = slot.teacherId?.name || 'TBA';
                        if (!acc[name]) acc[name] = 0;
                        acc[name]++;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([teacher, count]) => (
                      <div key={teacher} className="flex items-center justify-between">
                        <span className="text-sm">{teacher}</span>
                        <Badge variant="outline">{count} periods/week</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No teachers to display</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Weekly Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-primary/10 rounded text-center">
                  <p className="text-sm text-muted-foreground">Total Periods</p>
                  <p className="text-3xl font-bold text-primary">{totalPeriods}</p>
                </div>
                <div className="p-4 bg-green-100 rounded text-center">
                  <p className="text-sm text-muted-foreground">Subjects</p>
                  <p className="text-3xl font-bold text-green-600">{subjectsCount}</p>
                </div>
                <div className="p-4 bg-yellow-100 rounded text-center">
                  <p className="text-sm text-muted-foreground">Lab Sessions</p>
                  <p className="text-3xl font-bold text-yellow-600">{labSessions}</p>
                </div>
                <div className="p-4 bg-blue-100 rounded text-center">
                  <p className="text-sm text-muted-foreground">Teachers</p>
                  <p className="text-3xl font-bold text-blue-600">{teachersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentTimetable;
