// app/(dashboard)/communication/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  MessageSquare,
  Mail,
  Smartphone,
  Send,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  History,
  User,
  Users,
  FileText,
  Calendar,
  Clock,
  Download,
  Filter,
  MoreVertical,
  Eye,
  Copy,
  BarChart,
  Settings,
  RefreshCw,
  BellRing,
  Phone,
  Video,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Volume2,
  Newspaper,
  Shield,
  CreditCard,
  MapPin,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Clock as ClockIcon
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
// Local fallback hook for authentication; replace with your project's actual hook import if available.
const useAuth = (): { user: any; role: string } => {
  // provide a safe default to avoid compile-time errors in environments without auth
  return { user: { name: 'Demo User' }, role: 'admin' };
};
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Enhanced Mock Data Structure
const communicationData = {
  broadcastHistory: [
    {
      id: 'B001',
      title: 'School Closed Tomorrow Due to Heavy Rain',
      type: 'emergency',
      channel: 'whatsapp',
      recipientType: 'all_parents',
      recipients: 452,
      sentBy: 'Principal Sharma',
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'delivered',
      readRate: '92%',
      replyRate: '15%',
      attachments: [{ name: 'weather-alert.pdf', size: '1.2MB' }]
    },
    {
      id: 'B002',
      title: 'Annual Examination Schedule Released',
      type: 'academic',
      channel: 'email',
      recipientType: 'specific_classes',
      recipients: 120,
      sentBy: 'Academic Dept',
      sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      status: 'read',
      readRate: '85%',
      replyRate: '8%',
      attachments: [{ name: 'exam-schedule.xlsx', size: '2.5MB' }]
    },
    {
      id: 'B003',
      title: 'Fee Payment Reminder for December 2024',
      type: 'finance',
      channel: 'sms',
      recipientType: 'fee_defaulters',
      recipients: 28,
      sentBy: 'Accounts Dept',
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'failed',
      readRate: '45%',
      replyRate: '30%',
      attachments: []
    },
    {
      id: 'B004',
      title: 'Annual Day Celebration Invitation',
      type: 'event',
      channel: 'whatsapp',
      recipientType: 'all_staff',
      recipients: 65,
      sentBy: 'Event Committee',
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'delivered',
      readRate: '98%',
      replyRate: '42%',
      attachments: [{ name: 'invitation-card.pdf', size: '3.1MB' }]
    }
  ],
  studentHistory: [
    {
      id: 'S001',
      student: {
        id: 'STU001',
        name: 'Arjun Verma',
        class: '10-A',
        avatar: 'AV',
        parentName: 'Mr. Rajesh Verma'
      },
      message: 'Student has been absent for 3 consecutive days. Please provide medical certificate.',
      channel: 'whatsapp',
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'read',
      category: 'attendance',
      priority: 'high'
    },
    {
      id: 'S002',
      student: {
        id: 'STU002',
        name: 'Priya Patel',
        class: '11-B',
        avatar: 'PP',
        parentName: 'Mrs. Meena Patel'
      },
      message: 'Congratulations on winning the National Math Olympiad! Certificate ready for collection.',
      channel: 'email',
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'delivered',
      category: 'achievement',
      priority: 'medium'
    },
    {
      id: 'S003',
      student: {
        id: 'STU003',
        name: 'Rohit Sharma',
        class: '9-C',
        avatar: 'RS',
        parentName: 'Mr. Sunil Sharma'
      },
      message: 'Fee payment of ₹15,000 received for December. Receipt #4521 attached.',
      channel: 'sms',
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      status: 'delivered',
      category: 'finance',
      priority: 'low'
    }
  ],
  parentResponses: [
    {
      id: 'R001',
      parent: {
        name: 'Mr. Rajesh Verma',
        phone: '+91 9876543210',
        avatar: 'RV'
      },
      student: 'Arjun Verma (10-A)',
      message: 'Thank you for informing. Arjun has been unwell with viral fever. Doctor has advised 2 more days rest. Medical certificate will be submitted.',
      sentAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      type: 'reply',
      status: 'unread',
      originalMessage: 'Absent for 3 consecutive days'
    },
    {
      id: 'R002',
      parent: {
        name: 'Mrs. Anjali Gupta',
        phone: '+91 8765432109',
        avatar: 'AG'
      },
      student: 'Neha Gupta (12-A)',
      message: 'Will the school remain open this Saturday for revision classes? Need to plan transportation.',
      sentAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      type: 'query',
      status: 'unread',
      originalMessage: null
    },
    {
      id: 'R003',
      parent: {
        name: 'Mr. Sunil Singh',
        phone: '+91 7654321098',
        avatar: 'SS'
      },
      student: 'Vikram Singh (8-B)',
      message: 'Payment done via UPI. Transaction ID: 8829176532. Amount: ₹12,500. Please confirm receipt.',
      sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      type: 'payment',
      status: 'read',
      originalMessage: 'Fee payment reminder'
    }
  ],
  templates: [
    { id: 'T001', name: 'Absence Notification', category: 'attendance', channels: ['whatsapp', 'sms'] },
    { id: 'T002', name: 'Fee Reminder', category: 'finance', channels: ['whatsapp', 'sms', 'email'] },
    { id: 'T003', name: 'Exam Schedule', category: 'academic', channels: ['email', 'whatsapp'] },
    { id: 'T004', name: 'Event Invitation', category: 'event', channels: ['whatsapp', 'email'] },
    { id: 'T005', name: 'Achievement Announcement', category: 'achievement', channels: ['whatsapp', 'email', 'sms'] }
  ]
};

const channelConfig = {
  whatsapp: {
    name: 'WhatsApp Business',
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    status: 'connected',
    balance: 'Unlimited',
    deliveryRate: '98.5%'
  },
  email: {
    name: 'Email Server',
    icon: Mail,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    status: 'connected',
    balance: 'N/A',
    deliveryRate: '99.2%'
  },
  sms: {
    name: 'SMS Gateway',
    icon: Smartphone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    status: 'connected',
    balance: 4200,
    deliveryRate: '96.8%'
  },
  voice: {
    name: 'Voice Call',
    icon: Phone,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    status: 'disabled',
    balance: 50,
    deliveryRate: 'N/A'
  }
};

const typeColors = {
  emergency: 'bg-red-100 text-red-800 border-red-200',
  academic: 'bg-blue-100 text-blue-800 border-blue-200',
  finance: 'bg-amber-100 text-amber-800 border-amber-200',
  event: 'bg-green-100 text-green-800 border-green-200',
  attendance: 'bg-purple-100 text-purple-800 border-purple-200',
  achievement: 'bg-indigo-100 text-indigo-800 border-indigo-200'
};

const statusConfig = {
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-green-600' },
  read: { label: 'Read', icon: CheckCircle, color: 'text-blue-600' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-600' },
  pending: { label: 'Pending', icon: ClockIcon, color: 'text-amber-600' }
};

export default function CommunicationCenter() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('broadcast');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7days');
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);

  // Calculate stats
  const totalMessages = 12450;
  const deliveryRate = 98.2;
  const unreadReplies = 15;
  const smsBalance = 4200;
  const voiceBalance = 50;

  // Filter broadcast history based on selected filters
  const filteredBroadcasts = communicationData.broadcastHistory.filter(item => {
    if (selectedChannel !== 'all' && item.channel !== selectedChannel) return false;
    if (selectedCategory !== 'all' && item.type !== selectedCategory) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Filter student history
  const filteredStudentHistory = communicationData.studentHistory.filter(item => {
    if (searchQuery && !item.student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Handle send message
  const handleSendMessage = () => {
    if (!messageContent.trim()) {
      toast.error('Please enter message content');
      return;
    }

    if (selectedRecipients.length === 0) {
      toast.error('Please select recipients');
      return;
    }

    toast.success(`Message sent to ${selectedRecipients.length} recipients`);
    setComposeOpen(false);
    setMessageContent('');
    setSelectedRecipients([]);
  };

  // Handle schedule message
  const handleScheduleMessage = () => {
    if (!scheduledTime) {
      toast.error('Please select schedule time');
      return;
    }

    toast.success(`Message scheduled for ${format(scheduledTime, 'PPp')}`);
    setComposeOpen(false);
  };

  // Handle copy message
  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast.success('Message copied to clipboard');
  };

  // Handle resend message
  const handleResendMessage = (messageId: string) => {
    toast.success('Message queued for resending');
  };

  return (
    
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Communication Center</h1>
                <p className="text-muted-foreground">
                  {role === 'teacher' ? 'Communicate with students and parents' :
                   role === 'admin' ? 'Manage school-wide announcements' :
                   'Comprehensive communication management system'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={() => setComposeOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Messages"
            value="12,450"
            subtitle="This month"
            icon={Send}
            variant="primary"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Delivery Rate"
            value="98.2%"
            subtitle="Successful delivery"
            icon={CheckCircle2}
            variant="success"
            trend={{ value: 1.2, isPositive: true }}
          />
          <StatCard
            title="Parent Engagement"
            value="68%"
            subtitle="Response rate"
            icon={Users}
            variant="warning"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="SMS Balance"
            value="4,200"
            subtitle="Credits remaining"
            icon={CreditCard}
            variant="default"
            trend={{ value: 30, isPositive: true }}
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left Column - Configuration & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Channel Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Channel Status
                </CardTitle>
                <CardDescription>Communication channels status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(channelConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{config.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={config.status === 'connected' ? 'success' : 'secondary'} 
                              className="text-[10px] h-4"
                            >
                              {config.status}
                            </Badge>
                            {config.balance !== 'N/A' && (
                              <span className="text-xs text-muted-foreground">
                                {typeof config.balance === 'number' ? `${config.balance} credits` : config.balance}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Switch defaultChecked={config.status === 'connected'} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Quick Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {communicationData.templates.map((template) => (
                      <Button
                        key={template.id}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3"
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setMessageContent(`[${template.name}] Enter your message here...`);
                        }}
                      >
                        <div className="text-left w-full">
                          <p className="text-sm font-medium">{template.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {template.channels.map(channel => (
                              <Badge key={channel} variant="outline" className="text-[10px]">
                                {channel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Parent Responses */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Recent Responses
                  </CardTitle>
                  <Badge variant="warning" className="text-xs">
                    3 New
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3 p-4">
                    {communicationData.parentResponses.map((response) => {
                      const isUnread = response.status === 'unread';
                      return (
                        <div 
                          key={response.id} 
                          className={`p-3 rounded-lg border ${isUnread ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'}`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {response.parent.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold">{response.parent.name}</p>
                                <div className="flex items-center gap-1">
                                  {isUnread && (
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(response.sentAt, { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{response.student}</p>
                              <p className="text-sm line-clamp-2">{response.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <Badge 
                                  variant={response.type === 'reply' ? 'secondary' : 
                                          response.type === 'payment' ? 'success' : 'default'}
                                  className="text-[10px]"
                                >
                                  {response.type}
                                </Badge>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-6 w-6">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6">
                                    <MessageSquare className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="pt-3 border-t">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Responses
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column - Main Communication Content */}
          <div className="lg:col-span-3">
            {/* Filters Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="voice">Voice</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Time Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="90days">Last 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 lg:flex-none lg:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search messages..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="broadcast" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Broadcast History
                </TabsTrigger>
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Student Communication
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Broadcast Tab */}
              <TabsContent value="broadcast" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Broadcast Messages</CardTitle>
                        <CardDescription>
                          {filteredBroadcasts.length} messages found • Showing latest broadcasts
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Total Sent: {communicationData.broadcastHistory.length}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredBroadcasts.map((broadcast) => {
                        const ChannelIcon = channelConfig[broadcast.channel as keyof typeof channelConfig]?.icon || MessageSquare;
                        const status = statusConfig[broadcast.status as keyof typeof statusConfig];
                        const StatusIcon = status?.icon || CheckCircle2;
                        
                        return (
                          <div key={broadcast.id} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                                      <ChannelIcon className="h-4 w-4 text-secondary" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">{broadcast.title}</h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge className={`text-xs ${typeColors[broadcast.type as keyof typeof typeColors]}`}>
                                          {broadcast.type.toUpperCase()}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(broadcast.sentAt, { addSuffix: true })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Recipients</p>
                                    <p className="font-medium">{broadcast.recipients.toLocaleString()}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Read Rate</p>
                                    <div className="flex items-center gap-2">
                                      <Progress value={parseInt(broadcast.readRate)} className="h-2 w-20" />
                                      <span className="text-sm font-medium">{broadcast.readRate}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Reply Rate</p>
                                    <p className="font-medium">{broadcast.replyRate}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <div className="flex items-center gap-1">
                                      <StatusIcon className={`h-4 w-4 ${status?.color}`} />
                                      <span className="font-medium">{status?.label}</span>
                                    </div>
                                  </div>
                                </div>

                                {broadcast.attachments.length > 0 && (
                                  <div className="mt-4 pt-4 border-t">
                                    <p className="text-xs text-muted-foreground mb-2">Attachments</p>
                                    <div className="flex gap-2">
                                      {broadcast.attachments.map((attachment, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          <FileText className="h-3 w-3 mr-1" />
                                          {attachment.name} ({attachment.size})
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="ml-2">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleCopyMessage(broadcast.title)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleResendMessage(broadcast.id)}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Resend
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Users className="h-4 w-4 mr-2" />
                                    Recipient List
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredBroadcasts.length} of {communicationData.broadcastHistory.length} broadcasts
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <History className="h-3 w-3 mr-2" />
                        View All
                      </Button>
                      <Button size="sm">
                        <Download className="h-3 w-3 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Student Communication Tab */}
              <TabsContent value="student" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Student Communication Logs</CardTitle>
                        <CardDescription>
                          Individual student communication history
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredStudentHistory.map((item) => {
                        const ChannelIcon = channelConfig[item.channel as keyof typeof channelConfig]?.icon || MessageSquare;
                        const status = statusConfig[item.status as keyof typeof statusConfig];
                        const StatusIcon = status?.icon || CheckCircle2;
                        
                        return (
                          <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {item.student.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold">{item.student.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Class {item.student.class} • {item.student.parentName}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge 
                                      variant={item.priority === 'high' ? 'destructive' : 
                                              item.priority === 'medium' ? 'warning' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {item.priority}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(item.sentAt, { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                                  <p className="text-sm">{item.message}</p>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm text-muted-foreground">{item.channel.toUpperCase()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <StatusIcon className={`h-4 w-4 ${status?.color}`} />
                                      <span className="text-sm">{status?.label}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {item.category}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="ghost">
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Reply
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                      <Phone className="h-3 w-3 mr-1" />
                                      Call
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Channel Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(channelConfig).map(([key, config]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                                {React.createElement(config.icon, { className: `h-4 w-4 ${config.color}` })}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{config.name}</p>
                                <p className="text-xs text-muted-foreground">Delivery Rate: {config.deliveryRate}</p>
                              </div>
                            </div>
                            <Progress value={parseFloat(config.deliveryRate)} className="w-32" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Message Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries({
                          academic: 45,
                          finance: 25,
                          emergency: 15,
                          event: 10,
                          attendance: 5
                        }).map(([category, percentage]) => (
                          <div key={category} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{category}</span>
                              <span className="font-medium">{percentage}%</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Communication Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/20">
                      <div className="text-center">
                        <BarChart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Communication analytics chart will appear here</p>
                        <p className="text-sm text-muted-foreground mt-2">(Shows trends, engagement rates, and patterns)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Communication Guidelines */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Communication Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Timing Rules
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Emergency: Anytime (24/7)</li>
                      <li>• Academic: 8 AM - 8 PM</li>
                      <li>• Finance: 10 AM - 6 PM</li>
                      <li>• Non-urgent: Weekdays only</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-primary" />
                      Priority Levels
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• High: Immediate attention</li>
                      <li>• Medium: Within 24 hours</li>
                      <li>• Low: Within 48 hours</li>
                      <li>• Info: No response needed</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      Best Practices
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Clear subject lines</li>
                      <li>• Concise messages</li>
                      <li>• Proper recipient selection</li>
                      <li>• Follow-up reminders</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}

// Import React if not already imported
import React from 'react';