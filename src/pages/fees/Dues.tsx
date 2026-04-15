// src/pages/fees/Dues.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  Calendar,
  Loader2,
  CheckCircle,
  TrendingUp,
  Info,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { feesService, StudentDue, StudentDuesResponse } from '@/api/services/feesService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const CurrentDues = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duesData, setDuesData] = useState<StudentDuesResponse | null>(null);
  const [selectedDues, setSelectedDues] = useState<number[]>([]);

  // Fetch student dues on mount
  useEffect(() => {
    const fetchDues = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await feesService.getStudentDues();
        setDuesData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dues';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDues();
  }, [toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string, daysOverdue: number) => {
    if (status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    if (status === 'overdue') {
      return <Badge className="bg-red-200 text-red-900">Overdue by {daysOverdue} days</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
  };

  const getPriorityColor = (daysOverdue: number, status: string) => {
    if (status === 'paid') return 'border-l-4 border-l-green-500';
    if (daysOverdue > 30) return 'border-l-4 border-l-red-600';
    if (daysOverdue > 0) return 'border-l-4 border-l-orange-500';
    return 'border-l-4 border-l-amber-500';
  };

  const toggleDueSelection = (installmentNo: number) => {
    setSelectedDues((prev) =>
      prev.includes(installmentNo)
        ? prev.filter((id) => id !== installmentNo)
        : [...prev, installmentNo]
    );
  };

  const calculateSelectedTotal = () => {
    if (!duesData) return 0;
    return duesData.dues.penalties
      .filter((p) => selectedDues.includes(p.installmentNo))
      .reduce((sum, p) => sum + p.total, 0);
  };

  const handlePaySelected = () => {
    const total = calculateSelectedTotal();
    if (total > 0) {
      navigate('/fees/pay', { state: { amount: total, selectedDues } });
    }
  };

  const handlePayAll = () => {
    if (duesData?.dues.totalWithPenalty) {
      navigate('/fees/pay', { state: { amount: duesData.dues.totalWithPenalty } });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading your dues...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !duesData) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Unable to Load Dues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error || 'Unable to fetch your fee dues.'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Your Fee Dues</h2>
        <p className="text-muted-foreground">
          Manage your pending payments and installments
        </p>
      </div>

      {/* No dues state */}
      {duesData.dues.totalDue === 0 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">All Fees Paid</h3>
            <p className="text-green-700">Congratulations! Your fees are fully paid for the academic year.</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(duesData.dues.totalDue)}
            </div>
            <p className="text-xs text-muted-foreground">Before penalties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Late Penalties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(duesData.dues.totalPenalty)}
            </div>
            <p className="text-xs text-muted-foreground">{duesData.dues.penalties.filter(p => p.penalty > 0).length} installments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(duesData.dues.totalWithPenalty)}
            </div>
            <p className="text-xs text-muted-foreground">Including penalties</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Info */}
      <Card className="bg-blue-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-semibold">{duesData.student.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admission Number</p>
              <p className="font-semibold">{duesData.student.admissionNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Class</p>
              <p className="font-semibold">{duesData.student.className}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Section</p>
              <p className="font-semibold">{duesData.student.section}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Dues List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Installments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {duesData.dues.penalties && duesData.dues.penalties.length > 0 ? (
              duesData.dues.penalties.map((due, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${getPriorityColor(due.daysOverdue, due.status)} ${
                    selectedDues.includes(due.installmentNo) ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleDueSelection(due.installmentNo)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedDues.includes(due.installmentNo)}
                          onChange={() => toggleDueSelection(due.installmentNo)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <h3 className="font-semibold">
                          Installment {due.installmentNo}
                        </h3>
                        {getStatusBadge(due.status, due.daysOverdue)}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(due.dueDate).toLocaleDateString('en-IN')}
                        </div>

                        {due.daysOverdue > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <Clock className="h-4 w-4" />
                            {due.daysOverdue} days overdue
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold mb-1">
                        {formatCurrency(due.amount)}
                      </div>
                      {due.penalty > 0 && (
                        <div className="text-red-600 text-sm">
                          +{formatCurrency(due.penalty)} penalty
                        </div>
                      )}
                      <div className="text-muted-foreground text-sm font-semibold mt-1">
                        Total: {formatCurrency(due.total)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-6">No pending dues</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {duesData.dues.totalDue > 0 && user?.role !== 'parent' && (
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={handlePaySelected}
            disabled={selectedDues.length === 0}
            className="flex-1"
          >
            Pay Selected (
            {selectedDues.length > 0
              ? formatCurrency(calculateSelectedTotal())
              : 'Select dues'}
            )
          </Button>
          <Button
            size="lg"
            variant="default"
            onClick={handlePayAll}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Pay All (
            {formatCurrency(duesData.dues.totalWithPenalty)})
          </Button>
        </div>
      )}

      {/* Locked message for parents */}
      {duesData.dues.totalDue > 0 && user?.role === 'parent' && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Online Payment Unavailable</p>
                <p className="text-xs text-amber-700 mt-0.5">Online payments are currently not available for parents. Please contact the school accounts office to make fee payments.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Late payment incurs a penalty of 1% per month on the due amount.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>You can pay installments individually or all at once.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Payment receipts are generated automatically after confirmation.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <span>Contact the accounts office for payment plan adjustments.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentDues;