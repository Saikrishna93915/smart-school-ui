import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  User
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

// Mock Data: Recent Broadcasts
const broadcastHistory = [
  { id: 1, title: 'School Closed Tomorrow', type: 'Emergency', channel: 'WhatsApp', recipient: 'All Parents', time: '2 hours ago', status: 'delivered' },
  { id: 2, title: 'Exam Schedule Released', type: 'Academic', channel: 'Email', recipient: 'Class 10-A, 10-B', time: '5 hours ago', status: 'read' },
  { id: 3, title: 'Fee Reminder - Dec', type: 'Finance', channel: 'SMS', recipient: 'Defaulters List', time: '1 day ago', status: 'failed' },
  { id: 4, title: 'Annual Day Invitation', type: 'Event', channel: 'WhatsApp', recipient: 'All Staff', time: '2 days ago', status: 'delivered' },
];

// Mock Data: Student Specific History
const studentHistory = [
  { id: 1, student: 'Arjun Verma', message: 'Absent for 3 consecutive days. Please provide medical certificate.', channel: 'WhatsApp', time: 'Yesterday', status: 'read' },
  { id: 2, student: 'Priya Patel', message: 'Congratulations on winning the Math Olympiad!', channel: 'Email', time: '2 days ago', status: 'delivered' },
  { id: 3, student: 'Rohit Sharma', message: 'Fee payment of ₹15,000 received. Receipt #4521.', channel: 'SMS', time: '1 week ago', status: 'delivered' },
];

// Mock Data: Parent Responses
const parentResponses = [
  { id: 1, parent: 'Mr. Verma', student: 'Arjun Verma', message: 'Noted. He is recovering from fever.', time: '10 mins ago', type: 'reply' },
  { id: 2, parent: 'Mrs. Gupta', student: 'Neha Gupta', message: 'Will the school remain open on Saturday?', time: '1 hour ago', type: 'query' },
  { id: 3, parent: 'Mr. Singh', student: 'Vikram Singh', message: 'Payment done via UPI. Transaction ID: 88291.', time: '3 hours ago', type: 'payment' },
];

const channelIcons = {
  WhatsApp: MessageSquare,
  Email: Mail,
  SMS: Smartphone,
};

const statusColors = {
  delivered: 'text-primary',
  read: 'text-success',
  failed: 'text-destructive',
};

export default function Communication() {
  const [activeTab, setActiveTab] = useState('broadcast');

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Communication Center</h1>
            <p className="text-muted-foreground">Manage notifications, alerts, and parent messaging</p>
          </div>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Compose New Message
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Messages Sent"
            value="12,450"
            subtitle="This month"
            icon={Send}
            variant="primary"
          />
          <StatCard
            title="Delivery Rate"
            value="98.2%"
            subtitle="Successful delivery"
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Parent Replies"
            value="15"
            subtitle="Unread messages"
            icon={MessageSquare}
            variant="warning"
          />
          <StatCard
            title="SMS Balance"
            value="4,200"
            subtitle="Credits remaining"
            icon={Smartphone}
            variant="default"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Left Column: Configuration & Channels (1 Col) */}
          <div className="space-y-6">
            {/* Channel Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Channel Settings</CardTitle>
                <CardDescription>Toggle communication channels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Official Business API</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">SMS Gateway</p>
                      <p className="text-xs text-muted-foreground">Transactional & OTP</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Email Server</p>
                      <p className="text-xs text-muted-foreground">Newsletters & Reports</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Parent Response Log */}
            <Card className="h-[400px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Parent Responses</CardTitle>
                  <Badge variant="warning">3 New</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-6 pb-4">
                  <div className="space-y-4">
                    {parentResponses.map((response) => (
                      <div key={response.id} className="flex gap-3 items-start p-3 rounded-lg bg-muted/30">
                        <Avatar className="h-8 w-8 border">
                          <AvatarFallback className="text-xs">{response.parent.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold">{response.parent}</p>
                            <span className="text-[10px] text-muted-foreground">{response.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">Re: {response.student}</p>
                          <p className="text-sm text-foreground">{response.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Message History (2 Cols) */}
          <div className="lg:col-span-2">
            <Card className="h-full border-none shadow-none bg-transparent">
              <Tabs defaultValue="broadcast" className="h-full space-y-4" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="broadcast">Broadcast History</TabsTrigger>
                    <TabsTrigger value="student">By Student</TabsTrigger>
                  </TabsList>
                  <div className="relative w-64 hidden sm:block">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search messages..." className="pl-8 h-9" />
                  </div>
                </div>

                {/* Broadcast Content */}
                <TabsContent value="broadcast" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Recent Broadcasts</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {broadcastHistory.map((item) => {
                          const Icon = channelIcons[item.channel as keyof typeof channelIcons];
                          return (
                            <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                              <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                <Icon className="h-5 w-5 text-secondary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium truncate">{item.title}</p>
                                  <Badge variant={item.status === 'failed' ? 'destructive' : 'outline'} className="capitalize">
                                    {item.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  <span>{item.recipient}</span>
                                  <span>•</span>
                                  <span>{item.time}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{item.type}</Badge>
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Student Specific Content */}
                <TabsContent value="student" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Student Communication Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {studentHistory.map((item) => {
                           const Icon = channelIcons[item.channel as keyof typeof channelIcons];
                           return (
                            <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                              <Avatar className="h-10 w-10 mt-1">
                                <AvatarFallback className="bg-primary/10 text-primary">{item.student.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">{item.student}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Icon className="h-3 w-3" />
                                    <span>{item.channel}</span>
                                    <span>•</span>
                                    <span>{item.time}</span>
                                  </div>
                                </div>
                                <p className="text-sm mt-1 text-foreground/80">{item.message}</p>
                              </div>
                            </div>
                           )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

        </div>
      </div>
   
  );
}