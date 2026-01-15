// src/pages/fees/Structure.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Download,
  Printer,
  Info,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const FeeStructure = () => {
  const feeStructure = [
    {
      category: 'Tuition Fee',
      amount: 85000,
      description: 'Annual tuition fee for academic year 2024-25',
      dueDate: '2024-06-15',
      paid: 50000,
      remaining: 35000,
      installments: 3,
      status: 'Partially Paid'
    },
    {
      category: 'Annual Charges',
      amount: 25000,
      description: 'Library, laboratory, sports, and other annual facilities',
      dueDate: '2024-04-30',
      paid: 25000,
      remaining: 0,
      installments: 1,
      status: 'Paid'
    },
    {
      category: 'Transport Fee',
      amount: 36000,
      description: 'Annual bus transportation charges',
      dueDate: 'Monthly',
      paid: 30000,
      remaining: 6000,
      installments: 12,
      status: 'Partially Paid'
    },
    {
      category: 'Examination Fee',
      amount: 12000,
      description: 'Term examination and assessment charges',
      dueDate: 'Before each term',
      paid: 8000,
      remaining: 4000,
      installments: 3,
      status: 'Partially Paid'
    },
    {
      category: 'Activity Fee',
      amount: 15000,
      description: 'Co-curricular and extra-curricular activities',
      dueDate: '2024-07-31',
      paid: 0,
      remaining: 15000,
      installments: 2,
      status: 'Pending'
    }
  ];

  const totalAnnual = feeStructure.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = feeStructure.reduce((sum, fee) => sum + fee.paid, 0);
  const totalRemaining = feeStructure.reduce((sum, fee) => sum + fee.remaining, 0);
  const paidPercentage = (totalPaid / totalAnnual) * 100;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'Partially Paid':
        return <Badge className="bg-amber-100 text-amber-800">Partially Paid</Badge>;
      case 'Pending':
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Fee Structure</h2>
        <p className="text-muted-foreground">Detailed breakdown of fees for academic year 2024-25</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Annual Fee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAnnual)}</div>
            <p className="text-xs text-muted-foreground">For academic year 2024-25</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Amount Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">{paidPercentage.toFixed(1)}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">To be paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Fee structure is subject to change with prior notice</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Fee Structure Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feeStructure.map((fee, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">{fee.category}</h3>
                      {getStatusBadge(fee.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{fee.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Due Date: {fee.dueDate}</span>
                      <span className="text-muted-foreground">Installments: {fee.installments}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold mb-1">{formatCurrency(fee.amount)}</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Paid: {formatCurrency(fee.paid)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600">Remaining: {formatCurrency(fee.remaining)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                {fee.remaining > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Payment Progress</span>
                      <span>{((fee.paid / fee.amount) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(fee.paid / fee.amount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Late payment may attract a penalty of 1% per month on the due amount.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Fee can be paid in installments as per the installment plan.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>For any fee-related queries, please contact the accounts department.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>All payments are recorded and receipts will be issued within 24 hours.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeeStructure;