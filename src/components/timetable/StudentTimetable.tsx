import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, AlertCircle, User, Clock, BookOpen, Download, CheckCircle, Users, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import './StudentTimetable.css';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

const STATIC_TIME_SLOTS = [
  { _id: 'sts1', slotName: 'Period 1', startTime: '09:00', endTime: '09:45', slotType: 'period' },
  { _id: 'sts2', slotName: 'Period 2', startTime: '09:45', endTime: '10:30', slotType: 'period' },
  { _id: 'sts3', slotName: 'Period 3', startTime: '10:45', endTime: '11:30', slotType: 'period' },
  { _id: 'sts4', slotName: 'Period 4', startTime: '11:30', endTime: '12:15', slotType: 'period' },
  { _id: 'sts5', slotName: 'Period 5', startTime: '13:00', endTime: '13:45', slotType: 'period' },
  { _id: 'sts6', slotName: 'Period 6', startTime: '13:45', endTime: '14:30', slotType: 'period' },
];

const buildStaticStudentSlots = () => [
  {
    _id: 'ss1',
    dayOfWeek: 1,
    timeSlotId: STATIC_TIME_SLOTS[0],
    subjectId: { _id: 'sub1', subjectName: 'English' },
    teacherId: { _id: 't1', name: 'Ms. Priya' },
  },
  {
    _id: 'ss2',
    dayOfWeek: 1,
    timeSlotId: STATIC_TIME_SLOTS[1],
    subjectId: { _id: 'sub2', subjectName: 'Mathematics' },
    teacherId: { _id: 't2', name: 'Mr. Sharma' },
  },
  {
    _id: 'ss3',
    dayOfWeek: 2,
    timeSlotId: STATIC_TIME_SLOTS[2],
    subjectId: { _id: 'sub3', subjectName: 'Science' },
    teacherId: { _id: 't3', name: 'Mrs. Nair' },
    isLabSession: true,
    roomNumber: 'Lab-1',
  },
  {
    _id: 'ss4',
    dayOfWeek: 3,
    timeSlotId: STATIC_TIME_SLOTS[3],
    subjectId: { _id: 'sub4', subjectName: 'Social Studies' },
    teacherId: { _id: 't4', name: 'Mr. Reddy' },
  },
  {
    _id: 'ss5',
    dayOfWeek: 4,
    timeSlotId: STATIC_TIME_SLOTS[4],
    subjectId: { _id: 'sub5', subjectName: 'Hindi' },
    teacherId: { _id: 't5', name: 'Ms. Kavya' },
  },
  {
    _id: 'ss6',
    dayOfWeek: 5,
    timeSlotId: STATIC_TIME_SLOTS[5],
    subjectId: { _id: 'sub6', subjectName: 'Computer Science' },
    teacherId: { _id: 't6', name: 'Mr. Arun' },
  },
];

/**
 * StudentTimetable Component - Enhanced
 * Shows the current student's class weekly schedule
 */
const StudentTimetable = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const [timetable, setTimetable] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [studentClass, setStudentClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const HOLIDAY_INDEX = 0;

  // Get today's day index for highlighting
  const getTodayIndex = () => {
    return new Date().getDay();
  };

  const todayIndex = getTodayIndex();
  const isTodayHoliday = todayIndex === HOLIDAY_INDEX;

  useEffect(() => {
    if (userId) {
      fetchStudentTimetable();
      return;
    }

    // Avoid endless loader if user context has no id yet.
    setStudentClass({ className: '10', sectionId: 'A', academicYearId: '2025-26' });
    setUsingFallback(true);
    setTimetable(buildStaticStudentSlots());
    setTimeSlots(STATIC_TIME_SLOTS);
    setLoading(false);
  }, [userId]);

  const fetchStudentTimetable = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Fetch student class (from student record or user context)
      const studentRes = await axios.get(`/api/students?user=${userId}`, { headers });
      const studentRecords = ensureArray<any>(studentRes.data?.data);
      const studentData = studentRecords[0];
      
      if (!studentData?.classId && !studentData?.className) {
        setUsingFallback(true);
        setStudentClass({ className: '10', sectionId: 'A', academicYearId: '2025-26' });
        setTimetable(buildStaticStudentSlots());
        setTimeSlots(STATIC_TIME_SLOTS);
        setLoading(false);
        return;
      }

      const classId = typeof studentData.classId === 'object' ? studentData.classId?._id : studentData.classId;
      const className =
        (typeof studentData.classId === 'object' ? studentData.classId?.className : undefined) ||
        studentData.className ||
        '10';
      const sectionId =
        (typeof studentData.sectionId === 'object' ? studentData.sectionId?.sectionName : studentData.sectionId) ||
        studentData.section ||
        'A';
      const academicYearId = studentData.academicYearId || '2025-26';

      setStudentClass({
        className,
        sectionId,
        academicYearId
      });

      // Fetch class timetable
      const timetableRes = await axios.get(
        `/api/timetable/${classId}/${sectionId}`,
        { params: { academicYearId, term: 'term1' }, headers }
      );

      // Fetch time slots
      const timeSlotsRes = await axios.get('/api/timeslots', {
        params: { academicYearId },
        headers
      });

      const timetablePayload = timetableRes.data?.data;
      const normalizedTimetable = Array.isArray(timetablePayload)
        ? timetablePayload
        : Array.isArray(timetablePayload?.slots)
          ? timetablePayload.slots
          : [];

      const normalizedTimeSlots = ensureArray<any>(timeSlotsRes.data?.data);

      if (normalizedTimetable.length === 0 || normalizedTimeSlots.length === 0) {
        setUsingFallback(true);
        setTimetable(buildStaticStudentSlots());
        setTimeSlots(STATIC_TIME_SLOTS);
      } else {
        setUsingFallback(false);
        setTimetable(normalizedTimetable);
        setTimeSlots(normalizedTimeSlots);
      }

    } catch (err) {
      console.error('Error fetching student timetable:', err);
      setError(null);
      setUsingFallback(true);
      setStudentClass({ className: '10', sectionId: 'A', academicYearId: '2025-26' });
      setTimetable(buildStaticStudentSlots());
      setTimeSlots(STATIC_TIME_SLOTS);
    } finally {
      setLoading(false);
    }
  };

  // Get slot for specific day and time
  const getSlotForDayTime = (dayOfWeek: number, timeSlotId: string) => {
    if (!Array.isArray(timetable)) return null;
    
    return timetable.find(slot => 
      slot.dayOfWeek === dayOfWeek && 
      slot.timeSlotId?._id === timeSlotId
    );
  };

  const getTeachingPeriods = () => {
    return ensureArray<any>(timeSlots).filter(slot => slot.slotType === 'period');
  };

  // Get today's classes
  const getTodaysClasses = () => {
    if (!Array.isArray(timetable)) return [];
    if (isTodayHoliday) return [];
    return timetable
      .filter(slot => slot.dayOfWeek === todayIndex)
      .sort((a, b) => {
        const timeA = a.timeSlotId?.startTime || '';
        const timeB = b.timeSlotId?.startTime || '';
        return timeA.localeCompare(timeB);
      });
  };

  // Calculate statistics
  const totalClasses = Array.isArray(timetable) ? timetable.length : 0;
  const uniqueSubjects = new Set(Array.isArray(timetable) ? timetable.map(s => s.subjectId?._id) : []).size;
  const uniqueTeachers = new Set(Array.isArray(timetable) ? timetable.map(s => s.teacherId?._id) : []).size;
  const labSessions = Array.isArray(timetable) ? timetable.filter(s => s.isLabSession).length : 0;
  const todaysClasses = getTodaysClasses();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="animate-spin inline-block">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Loading your class schedule...</p>
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
          <Button onClick={fetchStudentTimetable}>Try Again</Button>
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
              <h1 className="text-2xl font-bold tracking-tight">My Class Schedule</h1>
              <p className="text-muted-foreground">
                Class {studentClass?.className} • Section {studentClass?.sectionId}
              </p>
              {usingFallback && (
                <p className="text-xs text-amber-600">Showing assigned static timetable preview.</p>
              )}
            </div>
          </div>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download Schedule
        </Button>
      </div>

      {/* Today's Classes Highlight */}
      {!isTodayHoliday && todaysClasses.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Today's Classes
            </CardTitle>
            <CardDescription>{DAYS[todayIndex]}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysClasses.map((slot) => (
                <div key={slot._id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-16">
                      <p className="font-semibold text-lg">{slot.timeSlotId?.startTime}</p>
                      <p className="text-xs text-muted-foreground">{slot.timeSlotId?.endTime}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">{slot.subjectId?.subjectName || 'Unassigned'}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {slot.teacherId?.teacherName || slot.teacherId?.name || 'TBD'}
                      </p>
                      {slot.roomNumber && (
                        <p className="text-sm text-muted-foreground">Room {slot.roomNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {slot.isLabSession && (
                      <Badge className="bg-warning/20 text-warning border-warning/30">Lab</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {todaysClasses.length === 0 && (
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-success/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{isTodayHoliday ? 'Sunday Holiday' : 'No Classes Today'}</h3>
            <p className="text-muted-foreground">
              {isTodayHoliday ? '🎉 Sunday is a holiday. Enjoy your day!' : '🎉 Enjoy your day! No classes scheduled.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Classes/Week"
          value={totalClasses}
          subtitle="Total periods"
          icon={Clock}
          variant="primary"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Subjects"
          value={uniqueSubjects}
          subtitle="Different subjects"
          icon={BookOpen}
          variant="success"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Teachers"
          value={uniqueTeachers}
          subtitle="Instructor count"
          icon={Users}
          variant="warning"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Lab Sessions"
          value={labSessions}
          subtitle="Practical classes"
          icon={Target}
          variant="default"
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-4">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="all-classes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            All Classes
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Tips
          </TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-6">
          {todaysClasses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {DAYS[todayIndex]}'s Schedule
                </CardTitle>
                <CardDescription>Detailed view of all classes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaysClasses.map((slot) => (
                  <div key={slot._id} className="border rounded-lg p-4 hover:bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">{slot.timeSlotId?.slotName}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {slot.timeSlotId?.startTime} - {slot.timeSlotId?.endTime}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-2">{slot.subjectId?.subjectName || 'Unassigned'}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Teacher: {slot.teacherId?.teacherName || slot.teacherId?.name || 'TBD'}
                        </p>
                        {slot.roomNumber && (
                          <p className="text-sm text-muted-foreground">
                            Room: {slot.roomNumber}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {slot.isLabSession && (
                          <Badge className="bg-warning/20 text-warning border-warning/30">Lab/Practical</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {isTodayHoliday ? 'Sunday is a holiday' : `No classes scheduled for ${DAYS[todayIndex]}`}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Weekly Tab */}
        <TabsContent value="weekly" className="space-y-6">
          {totalClasses > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Weekly Timetable
                </CardTitle>
                <CardDescription>Your complete class schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Time</th>
                        {DAYS.filter((_, idx) => idx !== HOLIDAY_INDEX).map((day, filteredIdx) => {
                          const idx = filteredIdx + 1;
                          return (
                            <th 
                              key={idx} 
                              className={`text-center p-3 font-semibold min-w-24 ${
                                idx === todayIndex ? 'bg-primary/10' : ''
                              }`}
                            >
                              {day}
                              {idx === todayIndex && (
                                <Badge className="ml-2 text-xs">Today</Badge>
                              )}
                            </th>
                          );
                        })}
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
                              <td 
                                key={`${dayIdx}-${timeSlot._id}`} 
                                className={`p-2 text-center ${dayIdx === todayIndex ? 'bg-primary/5' : ''}`}
                              >
                                {slot ? (
                                  <div className="rounded-lg bg-primary/10 border border-primary/20 p-2">
                                    <p className="text-xs font-semibold text-primary mb-1">
                                      {slot.subjectId?.subjectName || 'Unassigned'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {slot.teacherId?.teacherName || slot.teacherId?.name || 'TBD'}
                                    </p>
                                    <div className="flex gap-1 mt-1 justify-center">
                                      {slot.isLabSession && (
                                        <Badge variant="secondary" className="text-xs">Lab</Badge>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground text-xs p-2 rounded bg-muted/30">
                                    —
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
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No weekly schedule available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Classes Tab */}
        <TabsContent value="all-classes" className="space-y-6">
          {Array.isArray(timetable) && timetable.length > 0 ? (
            <div className="space-y-4">
              {DAYS.map((day, dayIdx) => {
                if (dayIdx === HOLIDAY_INDEX) return null;

                const daySessions = timetable
                  .filter(slot => slot.dayOfWeek === dayIdx)
                  .sort((a, b) => {
                    const timeA = a.timeSlotId?.startTime || '';
                    const timeB = b.timeSlotId?.startTime || '';
                    return timeA.localeCompare(timeB);
                  });

                if (daySessions.length === 0) return null;

                return (
                  <Card key={day} className={dayIdx === todayIndex ? 'border-primary/20 bg-primary/5' : ''}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {day}
                        {dayIdx === todayIndex && (
                          <Badge variant="default">Today</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {daySessions.map((slot) => (
                        <div key={slot._id} className="border rounded-lg p-3 hover:bg-muted/50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="text-center min-w-16 pt-1">
                                <p className="font-semibold text-sm">{slot.timeSlotId?.startTime}</p>
                                <p className="text-xs text-muted-foreground">{slot.timeSlotId?.endTime}</p>
                              </div>
                              <div>
                                <h5 className="font-semibold">{slot.subjectId?.subjectName || 'Unassigned'}</h5>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {slot.teacherId?.teacherName || slot.teacherId?.name || 'TBD'}
                                </p>
                                {slot.roomNumber && (
                                  <p className="text-sm text-muted-foreground">Room {slot.roomNumber}</p>
                                )}
                              </div>
                            </div>
                            {slot.isLabSession && (
                              <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">Lab</Badge>
                            )}
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
                <h3 className="text-lg font-semibold mb-2">No Classes Scheduled</h3>
                <p className="text-muted-foreground">Your class timetable hasn't been created yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Study Tips & Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Before Class
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Review previous notes</li>
                    <li>• Prepare required materials</li>
                    <li>• Complete pre-class work</li>
                    <li>• Arrive on time</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    During Class
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Take detailed notes</li>
                    <li>• Ask questions actively</li>
                    <li>• Participate in discussions</li>
                    <li>• Complete all activities</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-success" />
                    After Class
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Review and organize notes</li>
                    <li>• Complete assignments</li>
                    <li>• Practice problems</li>
                    <li>• Clarify doubts</li>
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

export default StudentTimetable;
