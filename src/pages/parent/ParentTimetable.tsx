import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '@/Services/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, BookOpen, RefreshCw, Users, Target, CheckCircle, ChevronLeft, User } from 'lucide-react';
import { toast } from 'sonner';

interface ChildInfo {
  id: string;
  name: string;
  className: string;
  section: string;
}

interface TimetableSlot {
  _id: string;
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
}

export default function ParentTimetable() {
  const navigate = useNavigate();
  const { childId: urlChildId } = useParams<{ childId: string }>();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');
  const [refreshKey, setRefreshKey] = useState(0);

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const HOLIDAY_INDEX = 0;
  const getTodayIndex = () => new Date().getDay();
  const todayIndex = getTodayIndex();
  const isTodayHoliday = todayIndex === HOLIDAY_INDEX;

  // Step 1: If childId is in URL, use it directly and fetch child info. Otherwise fetch children list.
  useEffect(() => {
    if (urlChildId) {
      setSelectedChild(urlChildId);
      // Also fetch this specific child's info for the header
      (async () => {
        try {
          const res = await apiClient.get('/parent/dashboard');
          const dashboardChildren = res.data?.data?.children || [];
          setChildren(dashboardChildren);
        } catch (err: any) {
          console.error('Error fetching child info:', err);
        }
      })();
      return;
    }
    (async () => {
      try {
        const res = await apiClient.get('/parent/dashboard');
        const dashboardChildren = res.data?.data?.children || [];
        setChildren(dashboardChildren);
        if (dashboardChildren.length > 0) {
          setSelectedChild(String(dashboardChildren[0].id));
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching children:', err);
        toast.error('Failed to load children');
        setLoading(false);
      }
    })();
  }, [urlChildId]);

  // Step 2: Fetch timetable when selectedChild changes
  useEffect(() => {
    if (!selectedChild) return;

    (async () => {
      try {
        setLoading(true);

        // Use parent-specific timetable endpoint (no admin access needed)
        const timetableRes = await apiClient.get(`/parent/child/${selectedChild}/timetable`);
        const timetableData = timetableRes.data?.data;
        const rawSlots = timetableData?.slots || [];
        setSlots(Array.isArray(rawSlots) ? rawSlots : []);

        // Extract time slots from the timetable data
        const uniqueTimeSlots: any[] = [];
        const seen = new Set();
        for (const slot of rawSlots) {
          if (slot.timeSlotId && slot.timeSlotId._id && !seen.has(slot.timeSlotId._id)) {
            seen.add(slot.timeSlotId._id);
            uniqueTimeSlots.push(slot.timeSlotId);
          }
        }
        uniqueTimeSlots.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
        setTimeSlots(uniqueTimeSlots);
      } catch (err: any) {
        console.error('Error fetching timetable:', err);
        if (err.response?.status === 404) {
          setSlots([]);
          setTimeSlots([]);
        } else {
          toast.error(err.response?.data?.message || 'Failed to load timetable');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedChild, refreshKey]);

  const getSlotForDayTime = (dayOfWeek: number, timeSlotId: string) => {
    return slots.find(slot => slot.dayOfWeek === dayOfWeek && slot.timeSlotId?._id === timeSlotId);
  };

  const getTeachingPeriods = () => {
    return timeSlots.filter((slot: any) => slot.slotType === 'period');
  };

  const selectedChildData = children.find(c => String(c.id) === selectedChild) || null;

  const todaySlots = slots.filter(slot => slot.dayOfWeek === todayIndex)
    .sort((a, b) => (a.timeSlotId?.startTime || '').localeCompare(b.timeSlotId?.startTime || ''));

  const subjectsCount = new Set(slots.map(s => s.subjectId?.subjectName).filter(Boolean)).size;
  const teachersCount = new Set(slots.map(s => s.teacherId?.name).filter(Boolean)).size;

  // Show loading if we haven't resolved selectedChild yet
  if (loading && !selectedChild) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!urlChildId && children.length === 0 && !loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Children Linked</h3>
          <p className="text-muted-foreground mb-4">No children are linked to your account.</p>
          <Button variant="outline" onClick={() => navigate('/parent/dashboard')}>
            <ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/parent/dashboard')} className="rounded-full">
            <ChevronLeft className="h-4 w-4 mr-1" />Home
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
            {selectedChildData ? (
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{selectedChildData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">
                  {selectedChildData.name} • Class {selectedChildData.className} — Section {selectedChildData.section}
                </p>
              </div>
            ) : urlChildId ? (
              <p className="text-sm text-muted-foreground">Loading child information...</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {children.length > 1 && (
            <select
              value={selectedChild}
              onChange={(e) => {
                setLoading(true);
                setSelectedChild(e.target.value);
              }}
              className="text-sm border rounded-lg px-3 py-2"
            >
              {children.map(c => <option key={String(c.id)} value={String(c.id)}>{c.name}</option>)}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)} className="rounded-full">
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Subjects</p>
            <p className="text-3xl font-bold">{subjectsCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Teachers</p>
            <p className="text-3xl font-bold">{teachersCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Today's Classes</p>
            <p className="text-3xl font-bold">{isTodayHoliday ? 'Holiday' : todaySlots.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-4">
          <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 mr-1.5" />
            {isTodayHoliday ? 'Holiday' : "Today's Schedule"}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 mr-1.5" />
            Weekly View
          </TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="mt-0">
          {isTodayHoliday ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Holiday!</h3>
                <p className="text-muted-foreground">No classes scheduled today.</p>
              </CardContent>
            </Card>
          ) : todaySlots.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Classes Today</h3>
                <p className="text-muted-foreground">No periods scheduled for today.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todaySlots.map((slot) => (
                <Card key={slot._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {slot.timeSlotId?.slotName?.replace('Period ', 'P') || '?'}
                        </div>
                        <div>
                          <h4 className="font-semibold">{slot.subjectId?.subjectName || 'Unassigned'}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{slot.teacherId?.name || 'TBA'}</span>
                            {slot.roomNumber && <span>Room {slot.roomNumber}</span>}
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{slot.timeSlotId?.startTime} - {slot.timeSlotId?.endTime}</span>
                          </div>
                        </div>
                      </div>
                      {slot.isLabSession && <Badge className="bg-amber-50 text-amber-700 border-amber-200">Lab</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Weekly Tab */}
        <TabsContent value="weekly" className="mt-0">
          {slots.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Timetable Available</h3>
                <p className="text-muted-foreground">The class timetable hasn't been created yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Weekly Timetable</CardTitle>
                <CardDescription>Class {selectedChildData?.className} — Section {selectedChildData?.section}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Time</th>
                        {DAYS.filter((_, idx) => idx !== HOLIDAY_INDEX).map((day, idx) => {
                          const dayIdx = idx + 1;
                          const isToday = dayIdx === todayIndex;
                          return (
                            <th key={idx} className={`text-center p-3 font-semibold min-w-28 ${isToday ? 'text-primary underline underline-offset-4' : ''}`}>
                              {day}
                              {isToday && <span className="text-xs block text-primary">(Today)</span>}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {getTeachingPeriods().map((timeSlot: any) => (
                        <tr key={timeSlot._id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium whitespace-nowrap">
                            <p className="font-semibold">{timeSlot.slotName}</p>
                            <p className="text-xs text-muted-foreground">{timeSlot.startTime} - {timeSlot.endTime}</p>
                          </td>
                          {DAYS.filter((_, idx) => idx !== HOLIDAY_INDEX).map((_, filteredIdx) => {
                            const dayIdx = filteredIdx + 1;
                            const slot = getSlotForDayTime(dayIdx, timeSlot._id);
                            const isToday = dayIdx === todayIndex;
                            return (
                              <td key={`${dayIdx}-${timeSlot._id}`} className={`p-2 text-center ${isToday ? 'bg-primary/5' : ''}`}>
                                {slot ? (
                                  <div className={`rounded-lg border p-2 text-xs ${isToday ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 border-muted'}`}>
                                    <p className="font-semibold truncate">{slot.subjectId?.subjectName || 'N/A'}</p>
                                    <p className="text-muted-foreground truncate">{slot.teacherId?.name || 'TBA'}</p>
                                    {slot.roomNumber && <p className="text-muted-foreground/60 mt-0.5">Rm {slot.roomNumber}</p>}
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground text-xs p-2 rounded bg-muted/20">Free</div>
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
      </Tabs>
    </div>
  );
}
