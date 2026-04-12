import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/Services/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, AlertCircle, Download, Calendar, BookOpen, BarChart, Users, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { toast } from 'sonner';
import './TeacherTimetable.css';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

interface TeacherSlot {
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
  timetableId?: {
    _id?: string;
    classId?: { className?: string };
    sectionId?: string;
  };
  subjectId?: { subjectName?: string };
  teacherId?: { name?: string };
  roomNumber?: string;
  isLabSession?: boolean;
  isSplitClass?: boolean;
  splitGroup?: string;
  alternateWeek?: string;
}

/**
 * TeacherTimetable Component - Fully Dynamic
 * Shows the current teacher's weekly schedule across all classes
 */
const TeacherTimetable = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const [slots, setSlots] = useState<TeacherSlot[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [activeTab, setActiveTab] = useState('schedule');

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const HOLIDAY_INDEX = 0;

  const fetchTeacherTimetable = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch teacher's timetable
      const timetableRes = await apiClient.get(
        `/timetable/teacher/${userId}`,
        { params: { academicYearId: academicYear, term: 'annual' } }
      );

      // Fetch time slots
      const timeSlotsRes = await apiClient.get('/timeslots', {
        params: { academicYearId: academicYear }
      });

      const timetablePayload = timetableRes.data?.data;
      // Backend returns { slots, groupedByDay, totalPeriods } or array of slots
      const rawSlots = Array.isArray(timetablePayload)
        ? timetablePayload
        : Array.isArray(timetablePayload?.slots)
          ? timetablePayload.slots
          : Array.isArray(timetablePayload?.groupedByDay)
            ? Object.values(timetablePayload.groupedByDay).flat()
            : [];

      setSlots(ensureArray<TeacherSlot>(rawSlots));
      setTimeSlots(ensureArray<any>(timeSlotsRes.data?.data));
    } catch (err: any) {
      console.error('Error fetching teacher timetable:', err);
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Failed to load schedule');
      }
      setSlots([]);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  }, [userId, academicYear]);

  useEffect(() => {
    fetchTeacherTimetable();
  }, [fetchTeacherTimetable]);

  // Get slot for specific day and time
  const getSlotForDayTime = (dayOfWeek: number, timeSlotId: string) => {
    return slots.find(slot =>
      slot.dayOfWeek === dayOfWeek &&
      slot.timeSlotId?._id === timeSlotId
    );
  };

  // Get teaching periods only
  const getTeachingPeriods = () => {
    return ensureArray<any>(timeSlots).filter(slot => slot.slotType === 'period');
  };

  // Calculate statistics
  const classCount = new Set(
    slots.map(slot => slot.timetableId?.classId?.className).filter(Boolean)
  ).size;

  const totalPeriods = slots.length;
  const labSessions = slots.filter(s => s.isLabSession).length;
  const teachingDays = new Set(
    slots.filter(s => s.dayOfWeek !== HOLIDAY_INDEX).map(s => s.dayOfWeek)
  ).size;

  const handleRefresh = async () => {
    await fetchTeacherTimetable();
    toast.success('Schedule refreshed');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="animate-spin inline-block">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Loading your schedule...</p>
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
          <h3 className="text-lg font-semibold mb-2">Unable to Load Schedule</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
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
              <h1 className="text-2xl font-bold tracking-tight">My Weekly Schedule</h1>
              <p className="text-muted-foreground">
                Academic Year {academicYear} • {user?.name || 'Teacher'}
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
            Export Schedule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Classes"
          value={classCount}
          subtitle="Assigned classes"
          icon={Users}
          variant="primary"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Total Periods"
          value={totalPeriods}
          subtitle="Per week"
          icon={Clock}
          variant="success"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Lab Sessions"
          value={labSessions}
          subtitle="Practical/Lab periods"
          icon={BookOpen}
          variant="warning"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Teaching Days"
          value={teachingDays}
          subtitle={`${teachingDays}/6 working days`}
          icon={Calendar}
          variant="default"
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-4">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Tips
          </TabsTrigger>
        </TabsList>

        {/* Schedule Tab - Grid View */}
        <TabsContent value="schedule" className="space-y-6">
          {totalPeriods === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
                <p className="text-muted-foreground mb-2">
                  You don't have any classes assigned for {academicYear} yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact the administrator to assign classes.
                </p>
              </CardContent>
            </Card>
          ) : teachingPeriods.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Time Slots Configured</h3>
                <p className="text-muted-foreground">
                  Time slots have not been set up for {academicYear}. Contact your administrator.
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
                <CardDescription>Your complete teaching schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Time</th>
                        {DAYS.filter((_, idx) => idx !== HOLIDAY_INDEX).map((day, idx) => (
                          <th key={idx + 1} className="text-center p-3 font-semibold min-w-24">
                            {day}
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

                            return (
                              <td key={`${dayIdx}-${timeSlot._id}`} className="p-2 text-center">
                                {slot ? (
                                  <div className="rounded-lg bg-primary/10 border border-primary/20 p-2">
                                    <p className="text-xs font-semibold text-primary">
                                      {slot.timetableId?.classId?.className || 'N/A'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {slot.subjectId?.subjectName || 'Unassigned'}
                                    </p>
                                    <div className="flex gap-1 mt-1 justify-center">
                                      {slot.isLabSession && (
                                        <Badge variant="secondary" className="text-xs">Lab</Badge>
                                      )}
                                      {slot.isSplitClass && (
                                        <Badge variant="outline" className="text-xs">Split</Badge>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground text-xs p-2 rounded bg-muted/30">
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

        {/* Detailed View */}
        <TabsContent value="detailed" className="space-y-6">
          {slots.length > 0 ? (
            <div className="space-y-4">
              {DAYS.map((day, dayIdx) => {
                if (dayIdx === HOLIDAY_INDEX) return null;
                const daySessions = slots.filter(slot => slot.dayOfWeek === dayIdx);
                if (daySessions.length === 0) return null;

                return (
                  <Card key={day}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {daySessions
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
                                <h4 className="font-semibold mb-2">
                                  {slot.timetableId?.classId?.className} - Section {slot.timetableId?.sectionId}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Subject: {slot.subjectId?.subjectName || 'Unassigned'}
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
                                {slot.alternateWeek && slot.alternateWeek !== 'both' && (
                                  <Badge variant="outline" className="text-xs">
                                    {slot.alternateWeek === 'odd' ? 'Odd Weeks' : 'Even Weeks'}
                                  </Badge>
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Teaching Load
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Class Distribution</span>
                    <span className="font-bold">{classCount} classes</span>
                  </div>
                  <Progress value={Math.min((classCount / 10) * 100, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Weekly Periods</span>
                    <span className="font-bold">{totalPeriods}</span>
                  </div>
                  <Progress value={Math.min((totalPeriods / 50) * 100, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Lab Sessions</span>
                    <span className="font-bold">{labSessions}</span>
                  </div>
                  <Progress value={totalPeriods > 0 ? (labSessions / totalPeriods) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Schedule Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-primary/10 rounded">
                    <p className="text-sm text-muted-foreground">Total Classes</p>
                    <p className="text-2xl font-bold text-primary">{classCount}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded">
                    <p className="text-sm text-muted-foreground">Teaching Days</p>
                    <p className="text-2xl font-bold text-green-600">{teachingDays}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded">
                    <p className="text-sm text-muted-foreground">Lab Sessions</p>
                    <p className="text-2xl font-bold text-yellow-600">{labSessions}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded">
                    <p className="text-sm text-muted-foreground">Avg. Per Day</p>
                    <p className="text-2xl font-bold text-blue-600">{teachingDays > 0 ? Math.ceil(totalPeriods / teachingDays) : 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources/Tips Tab */}
        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Schedule Management Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Planning
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Review schedule weekly</li>
                    <li>• Plan lessons in advance</li>
                    <li>• Prepare materials ahead</li>
                    <li>• Mark any conflicts early</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    Time Management
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Manage class transitions</li>
                    <li>• Allocate time for demos</li>
                    <li>• Balance theory & practice</li>
                    <li>• Buffer for Q&A sessions</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    Communication
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Notify changes promptly</li>
                    <li>• Coordinate with peers</li>
                    <li>• Share lab schedules</li>
                    <li>• Update on adjustments</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherTimetable;
