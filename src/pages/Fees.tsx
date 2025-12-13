import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Download, Send, CreditCard, IndianRupee, AlertTriangle, CheckCircle } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { FeeCollectionChart } from '@/components/dashboard/FeeCollectionChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const feeData = [
  { month: 'Apr', collected: 12.5, pending: 2.1 },
  { month: 'May', collected: 13.2, pending: 1.8 },
  { month: 'Jun', collected: 11.8, pending: 2.5 },
  { month: 'Jul', collected: 14.1, pending: 1.2 },
  { month: 'Aug', collected: 13.8, pending: 1.5 },
  { month: 'Sep', collected: 12.9, pending: 1.9 },
  { month: 'Oct', collected: 15.2, pending: 0.8 },
  { month: 'Nov', collected: 14.5, pending: 1.1 },
];

const defaulters = [
  { id: 1, name: 'Priya Patel', class: '10-A', amount: 15000, dueDate: '2024-11-15', days: 25, parent: 'Rakesh Patel', phone: '+91 98765 43211' },
  { id: 2, name: 'Amit Kumar', class: '10-B', amount: 22500, dueDate: '2024-10-30', days: 40, parent: 'Suresh Kumar', phone: '+91 98765 43214' },
  { id: 3, name: 'Karan Malhotra', class: '10-B', amount: 8500, dueDate: '2024-11-20', days: 20, parent: 'Sunil Malhotra', phone: '+91 98765 43220' },
  { id: 4, name: 'Meera Nair', class: '9-A', amount: 12000, dueDate: '2024-11-25', days: 15, parent: 'Krishna Nair', phone: '+91 98765 43217' },
];

const recentPayments = [
  { id: 1, name: 'Arjun Verma', class: '10-A', amount: 15000, date: '2024-12-01', method: 'UPI', receipt: 'RCP001234' },
  { id: 2, name: 'Kavya Singh', class: '9-A', amount: 12500, date: '2024-12-01', method: 'Cash', receipt: 'RCP001235' },
  { id: 3, name: 'Neha Gupta', class: '9-B', amount: 15000, date: '2024-11-30', method: 'Card', receipt: 'RCP001236' },
  { id: 4, name: 'Rahul Joshi', class: '10-A', amount: 18000, date: '2024-11-30', method: 'UPI', receipt: 'RCP001237' },
];

export default function Fees() {
  return (

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Fees & Finance</h1>
            <p className="text-muted-foreground">Manage fee collection and track payments</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Collect Fee
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Collected"
            value="₹1.08Cr"
            subtitle="This academic year"
            icon={IndianRupee}
            trend={{ value: 12.5, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="This Month"
            value="₹14.5L"
            subtitle="November 2024"
            icon={CreditCard}
            trend={{ value: 8.2, isPositive: true }}
            variant="primary"
          />
          <StatCard
            title="Pending"
            value="₹18.5L"
            subtitle="142 students"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            title="Collection Rate"
            value="85%"
            subtitle="On-time payments"
            icon={CheckCircle}
            variant="success"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Collection (in Lakhs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `₹${value}L`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        `₹${value}L`,
                        name === 'collected' ? 'Collected' : 'Pending',
                      ]}
                    />
                    <Bar dataKey="collected" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <FeeCollectionChart />
        </div>

        {/* Defaulters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Fee Defaulters
              </CardTitle>
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Send Reminders
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Student</TableHead>
                    <TableHead>Parent/Guardian</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaulters.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border">
                            <AvatarFallback className="bg-warning/10 text-warning text-sm">
                              {student.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">Class {student.class}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{student.parent}</p>
                          <p className="text-xs text-muted-foreground">{student.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-destructive">
                          ₹{student.amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={student.days > 30 ? 'destructive' : 'warning'}
                        >
                          {student.days} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            Call
                          </Button>
                          <Button size="sm">
                            Collect
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-success/10 text-success">
                        {payment.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{payment.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Class {payment.class} • {payment.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{payment.method}</Badge>
                    <span className="font-semibold text-success">
                      +₹{payment.amount.toLocaleString()}
                    </span>
                    <Button variant="ghost" size="sm">
                      View Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
   
  );
}
