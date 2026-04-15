// src/pages/fees/Structure.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  FileText, Download, Printer, Info, CheckCircle, AlertCircle, TrendingUp, Loader2
} from 'lucide-react';
import { feesService, MyFeeStructure } from '@/api/services/feesService';

const FeeStructure = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feeStructures, setFeeStructures] = useState<MyFeeStructure[]>([]);
  const [activeStructure, setActiveStructure] = useState<string>('');

  useEffect(() => {
    const fetchFeeStructure = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await feesService.getMyFeeStructure();
        const structures = Array.isArray(data) ? data : data ? [data] : [];
        setFeeStructures(structures);
        if (structures.length > 0 && !activeStructure) {
          setActiveStructure(String(structures[0]._id || structures[0].admissionNumber || '0'));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load fee structure';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchFeeStructure();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'partial': return <Badge className="bg-amber-100 text-amber-800">Partially Paid</Badge>;
      case 'pending': return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
      case 'overdue': return <Badge className="bg-red-200 text-red-900">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <div className="p-6 flex items-center justify-center min-h-screen"><div className="text-center"><Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" /><p className="text-lg text-muted-foreground">Loading fee structure...</p></div></div>;

  if (error || feeStructures.length === 0) {
    return (
      <div className="p-6">
        <Card className="border-red-200"><CardHeader><CardTitle className="flex items-center gap-2 text-red-600"><AlertCircle className="h-5 w-5" />Unable to Load Fee Structure</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground mb-4">{error || 'Fee structure not found for your account.'}</p><Button onClick={() => window.location.reload()}>Retry</Button></CardContent></Card>
      </div>
    );
  }

  const grandTotal = feeStructures.reduce((sum, fs) => sum + (fs.summary?.totalFee || fs.totalFee || 0), 0);
  const grandPaid = feeStructures.reduce((sum, fs) => sum + (fs.summary?.totalPaid || fs.totalPaid || 0), 0);
  const grandDue = feeStructures.reduce((sum, fs) => sum + (fs.summary?.totalDue || fs.totalDue || 0), 0);

  const renderFeeStructure = (fs: MyFeeStructure) => {
    const totalAnnual = fs.summary?.totalFee || fs.totalFee || 0;
    const totalPaid = fs.summary?.totalPaid || fs.totalPaid || 0;
    const totalRemaining = fs.summary?.totalDue || fs.totalDue || 0;
    const paidPercentage = fs.summary?.paidPercentage || 0;

    return (
      <div className="space-y-6">
        {/* Student Info */}
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-muted-foreground">Student Name</p><p className="font-semibold">{fs.studentName}</p></div>
              <div><p className="text-xs text-muted-foreground">Class</p><p className="font-semibold">{fs.className}</p></div>
              <div><p className="text-xs text-muted-foreground">Section</p><p className="font-semibold">{fs.section}</p></div>
              <div><p className="text-xs text-muted-foreground">Admission Number</p><p className="font-semibold">{fs.admissionNumber}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Components */}
        <Card>
          <CardHeader><CardTitle>Fee Breakdown by Component</CardTitle></CardHeader>
          <CardContent>
            {fs.feeComponents && fs.feeComponents.length > 0 ? (
              <div className="space-y-4">
                {fs.feeComponents.map((fee, index) => {
                  const feeAmount = fee.amount || 0;
                  const paidAmount = fee.paidAmount || 0;
                  const remainingAmount = feeAmount - paidAmount;
                  const percentage = feeAmount > 0 ? (paidAmount / feeAmount) * 100 : 0;
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{fee.componentName}</h3>
                            {getStatusBadge(fee.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{fee.frequency} • {fee.isMandatory ? 'Mandatory' : 'Optional'}</p>
                          {fee.dueDate && <p className="text-sm text-muted-foreground">Due Date: {new Date(fee.dueDate).toLocaleDateString('en-IN')}</p>}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold mb-1">{formatCurrency(feeAmount)}</div>
                          <p className="text-sm text-green-600">Paid: {formatCurrency(paidAmount)}</p>
                          <p className="text-sm text-amber-600">Remaining: {formatCurrency(remainingAmount)}</p>
                        </div>
                      </div>
                      {remainingAmount > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1"><span>Payment Progress</span><span>{percentage.toFixed(1)}%</span></div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${percentage}%` }} /></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-center text-muted-foreground py-4">No fee components found</p>}
          </CardContent>
        </Card>

        {/* Payment Schedule */}
        {fs.paymentSchedule && fs.paymentSchedule.length > 0 && (
          <Card><CardHeader><CardTitle>Payment Schedule (Installments)</CardTitle></CardHeader><CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 px-2">Installment</th><th className="text-left py-2 px-2">Due Date</th><th className="text-right py-2 px-2">Amount</th><th className="text-center py-2 px-2">Status</th><th className="text-left py-2 px-2">Receipt</th></tr></thead>
                <tbody>
                  {fs.paymentSchedule.map((schedule, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">Phase {schedule.installmentNo}</td>
                      <td className="py-3 px-2">{new Date(schedule.dueDate).toLocaleDateString('en-IN')}</td>
                      <td className="text-right py-3 px-2 font-semibold">{formatCurrency(schedule.amount)}</td>
                      <td className="text-center py-3 px-2">{getStatusBadge(schedule.status)}</td>
                      <td className="py-3 px-2">{schedule.receiptNo ? <span className="text-blue-600 text-xs">{schedule.receiptNo}</span> : <span className="text-gray-400 text-xs">-</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        )}

        {/* Transport */}
        {fs.transportOpted && (
          <Card className="bg-indigo-50"><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Transport Fee</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Annual Transport Fee</p><p className="text-2xl font-bold">{formatCurrency(fs.transportFee)}</p></div>
              <div><p className="text-sm text-muted-foreground">Status</p><p className="text-lg font-semibold">Active</p></div>
            </div>
          </CardContent></Card>
        )}

        {/* Notes */}
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-500" />Important Information</CardTitle></CardHeader><CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /><span>Late payment may attract a penalty of 1% per month.</span></li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /><span>Fee can be paid in installments as per the plan.</span></li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /><span>For fee-related queries, contact the accounts department.</span></li>
          </ul>
        </CardContent></Card>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Fee Structure</h2>
        <p className="text-muted-foreground">
          {feeStructures.length > 1 ? `Detailed breakdown for all ${feeStructures.length} children` : `Detailed breakdown for ${feeStructures[0]?.studentName}`}
        </p>
      </div>

      {/* Grand Totals (multi-child) */}
      {feeStructures.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total All Children</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(grandTotal)}</div><p className="text-xs text-muted-foreground">{feeStructures.length} children enrolled</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(grandPaid)}</div><p className="text-xs text-muted-foreground">{grandTotal > 0 ? ((grandPaid / grandTotal) * 100).toFixed(1) : 0}% paid</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Remaining</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{formatCurrency(grandDue)}</div><p className="text-xs text-muted-foreground">Balance across all children</p></CardContent></Card>
        </div>
      )}

      {/* Tabs for multi-child */}
      {feeStructures.length > 1 ? (
        <Tabs value={activeStructure} onValueChange={setActiveStructure}>
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            {feeStructures.map(fs => (
              <TabsTrigger key={String(fs._id || fs.admissionNumber)} value={String(fs._id || fs.admissionNumber)} className="gap-2">
                <Avatar className="h-5 w-5"><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{(fs.studentName || '?').charAt(0)}</AvatarFallback></Avatar>
                {fs.studentName || fs.admissionNumber}
              </TabsTrigger>
            ))}
          </TabsList>
          {feeStructures.map(fs => (
            <TabsContent key={String(fs._id || fs.admissionNumber)} value={String(fs._id || fs.admissionNumber)}>
              {renderFeeStructure(fs)}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        renderFeeStructure(feeStructures[0])
      )}
    </div>
  );
};

export default FeeStructure;
