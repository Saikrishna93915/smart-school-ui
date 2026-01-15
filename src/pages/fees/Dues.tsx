// src/pages/fees/Dues.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  Calendar,
  Clock,
  CreditCard,
  Download,
  TrendingUp,
  Info,
  CheckCircle,
  Mail,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CurrentDues = () => {
  const navigate = useNavigate();
  const [selectedDues, setSelectedDues] = useState<number[]>([]);
  
  const duesData = [
    {
      id: 1,
      feeType: 'Tuition Fee - Installment 3',
      dueDate: '2024-12-15',
      daysRemaining: 15,
      amount: 15000,
      penalty: 0,
      total: 15000,
      status: 'Pending',
      priority: 'High'
    },
    {
      id: 2,
      feeType: 'Transport Fee - December',
      dueDate: '2024-12-05',
      daysRemaining: 5,
      amount: 3000,
      penalty: 150,
      total: 3150,
      status: 'Overdue',
      priority: 'Critical'
    },
    {
      id: 3,
      feeType: 'Examination Fee - Term 2',
      dueDate: '2024-12-25',
      daysRemaining: 25,
      amount: 4000,
      penalty: 0,
      total: 4000,
      status: 'Pending',
      priority: 'Medium'
    },
    {
      id: 4,
      feeType: 'Activity Fee - Installment 1',
      dueDate: '2024-12-30',
      daysRemaining: 30,
      amount: 7500,
      penalty: 0,
      total: 7500,
      status: 'Pending',
      priority: 'Low'
    }
  ];

  const totalDues = duesData.reduce((sum, due) => sum + due.total, 0);
  const overdueAmount = duesData.filter(d => d.status === 'Overdue').reduce((sum, due) => sum + due.total, 0);
  const pendingAmount = duesData.filter(d => d.status === 'Pending').reduce((sum, due) => sum + due.total, 0);
  const criticalDues = duesData.filter(d => d.priority === 'Critical').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case 'High':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'Low':
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'Pending':
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSelectDues = (id: number) => {
    setSelectedDues(prev => 
      prev.includes(id) 
        ? prev.filter(dueId => dueId !== id)
        : [...prev, id]
    );
  };

  const handlePaySelected = () => {
    const selectedAmount = duesData
      .filter(due => selectedDues.includes(due.id))
      .reduce((sum, due) => sum + due.total, 0);
    
    navigate('/fees/pay', { 
      state: { 
        selectedDues,
        amount: selectedAmount
      }
    });
  };

  const handlePayAll = () => {
    navigate('/fees/pay', { 
      state: { 
        selectedDues: duesData.map(due => due.id),
        amount: totalDues
      }
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Current Dues</h2>
        <p className="text-muted-foreground">Track and manage your pending fee payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Dues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(totalDues)}
            </div>
            <p className="text-xs text-muted-foreground">{duesData.length} pending items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Immediate attention required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Dues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalDues}</div>
            <p className="text-xs text-muted-foreground">Need immediate payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Days Until Next Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Transport fee due soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-medium mb-1">Selected: {selectedDues.length} items</p>
              <p className="text-sm text-muted-foreground">
                Total amount: {formatCurrency(
                  duesData.filter(due => selectedDues.includes(due.id))
                    .reduce((sum, due) => sum + due.total, 0)
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedDues([])}
                disabled={selectedDues.length === 0}
              >
                Clear Selection
              </Button>
              <Button 
                onClick={handlePaySelected}
                disabled={selectedDues.length === 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Selected
              </Button>
              <Button onClick={handlePayAll}>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay All Dues
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dues List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {duesData.map((due) => (
              <div 
                key={due.id}
                className={`border rounded-lg p-4 transition-all ${
                  selectedDues.includes(due.id) ? 'ring-2 ring-primary border-primary' : ''
                }`}
                onClick={() => handleSelectDues(due.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <input 
                        type="checkbox"
                        checked={selectedDues.includes(due.id)}
                        onChange={() => handleSelectDues(due.id)}
                        className="h-4 w-4"
                      />
                      <h3 className="font-semibold text-lg">{due.feeType}</h3>
                      {getPriorityBadge(due.priority)}
                      {getStatusBadge(due.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due Date: {formatDate(due.dueDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className={due.daysRemaining < 0 ? 'text-red-600' : ''}>
                          {due.daysRemaining < 0 
                            ? `${Math.abs(due.daysRemaining)} days overdue`
                            : `${due.daysRemaining} days remaining`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold mb-2">{formatCurrency(due.total)}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Amount:</span>
                        <span>{formatCurrency(due.amount)}</span>
                      </div>
                      {due.penalty > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Late Penalty:</span>
                          <span>+{formatCurrency(due.penalty)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/fees/pay', { state: { selectedDues: [due.id], amount: due.total } });
                    }}
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    Pay Now
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Late Payment Charges</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Late fee penalty: 1% per month on overdue amount</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Payment must be cleared before appearing for exams</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Need Help?</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Accounts Department
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support: +91 9876543210
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentDues;