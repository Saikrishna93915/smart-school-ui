import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { School, Calendar, BookOpen, CreditCard, Bell, Shield, Upload, Save } from 'lucide-react';

export default function Settings() {
  return (
  
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage school profile and application settings</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="school" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="school">School</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* School Profile */}
          <TabsContent value="school" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <School className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>School Profile</CardTitle>
                    <CardDescription>Manage your school's basic information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/50">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label>School Logo</Label>
                    <Button variant="outline" size="sm">
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 2MB. Recommended size: 200x200px
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input id="schoolName" defaultValue="Delhi Public School" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolCode">School Code</Label>
                    <Input id="schoolCode" defaultValue="DPS-DEL-001" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="admin@dpsdelhi.edu" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue="+91 11 2634 5678" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" defaultValue="Mathura Road, New Delhi - 110003" />
                  </div>
                </div>

                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Settings */}
          <TabsContent value="academic" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Academic Year</CardTitle>
                    <CardDescription>Configure current academic session</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Current Academic Year</Label>
                    <Select defaultValue="2024-25">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-25">2024-25</SelectItem>
                        <SelectItem value="2023-24">2023-24</SelectItem>
                        <SelectItem value="2022-23">2022-23</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Session Start</Label>
                    <Input type="date" defaultValue="2024-04-01" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Board & Curriculum</CardTitle>
                    <CardDescription>Select education board and curriculum</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Education Board</Label>
                    <Select defaultValue="cbse">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cbse">CBSE</SelectItem>
                        <SelectItem value="icse">ICSE</SelectItem>
                        <SelectItem value="state">State Board</SelectItem>
                        <SelectItem value="ib">IB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Medium of Instruction</Label>
                    <Select defaultValue="english">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Configure how you receive alerts and updates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: 'Attendance Alerts', description: 'Get notified when attendance falls below threshold', enabled: true },
                  { label: 'Fee Reminders', description: 'Send automatic fee reminders to parents', enabled: true },
                  { label: 'Exam Notifications', description: 'Alert parents and students about upcoming exams', enabled: true },
                  { label: 'AI Insights', description: 'Receive AI-generated alerts for at-risk students', enabled: true },
                  { label: 'SMS Notifications', description: 'Enable SMS for critical alerts', enabled: false },
                  { label: 'WhatsApp Integration', description: 'Send notifications via WhatsApp', enabled: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Subscription & Billing</CardTitle>
                    <CardDescription>Manage your plan and payment details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-success/5 border-success/20">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-success">
                      <Shield className="h-6 w-6 text-success-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">Professional Plan</p>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Unlimited students • All AI features • Priority support
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">₹9,999<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    <p className="text-xs text-muted-foreground">Next billing: Jan 1, 2025</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg border text-center">
                    <p className="text-3xl font-bold text-primary">1,248</p>
                    <p className="text-sm text-muted-foreground">Active Students</p>
                  </div>
                  <div className="p-4 rounded-lg border text-center">
                    <p className="text-3xl font-bold text-secondary">45</p>
                    <p className="text-sm text-muted-foreground">Staff Accounts</p>
                  </div>
                  <div className="p-4 rounded-lg border text-center">
                    <p className="text-3xl font-bold text-success">Unlimited</p>
                    <p className="text-sm text-muted-foreground">AI Predictions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline">View Invoices</Button>
                  <Button variant="outline">Update Payment</Button>
                  <Button>Upgrade Plan</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
   
  );
}
