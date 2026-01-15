import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  FileText,
  IndianRupee,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { usePaymentProcessing } from '@/lib/hooks/finance/usePaymentProcessing';
import { formatCurrency } from '@/lib/utils/finance/currencyFormatter';
import {  formatDate } from '@/lib/utils/finance/dateCalculator';

interface StudentInfo {
  id: string;
  name: string;
  className: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  outstandingBalance: number;
  dueDate: string;
  totalFees: number;
  paidAmount: number;
  overdueDays: number;
}

interface RecordPaymentFormProps {
  student?: StudentInfo;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

const paymentMethods = [
  { value: 'UPI', label: 'UPI Payment', icon: Smartphone, description: 'Instant payment via UPI' },
  { value: 'Card', label: 'Credit/Debit Card', icon: CreditCard, description: 'Card payment' },
  { value: 'NetBanking', label: 'Net Banking', icon: Building, description: 'Internet banking' },
  { value: 'BankTransfer', label: 'Bank Transfer', icon: Banknote, description: 'NEFT/RTGS/IMPS' },
  { value: 'Cash', label: 'Cash', icon: IndianRupee, description: 'Cash payment' },
  { value: 'Cheque', label: 'Cheque/DD', icon: FileText, description: 'Cheque or Demand Draft' },
];

export const RecordPaymentForm: React.FC<RecordPaymentFormProps> = ({
  student: propStudent,
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate();
  
  // Mock student data - in real app, this would come from props or API
  const defaultStudent: StudentInfo = {
    id: 'STU2024001',
    name: 'Priya Patel',
    className: '10-A',
    parentName: 'Rakesh Patel',
    parentEmail: 'rakesh.patel@email.com',
    parentPhone: '+91 98765 43210',
    outstandingBalance: 15000,
    dueDate: '2024-12-15',
    totalFees: 60000,
    paidAmount: 45000,
    overdueDays: 25
  };
  
  const student = propStudent || defaultStudent;
  const { processing, error, success, processPayment, validatePayment } = usePaymentProcessing();
  
  const [step, setStep] = useState<'details' | 'review' | 'confirmation'>('details');
  const [formData, setFormData] = useState({
    amount: student.outstandingBalance,
    paymentMethod: 'UPI',
    transactionId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
    sendReceipt: true,
    receiptEmail: student.parentEmail,
  });
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };
  
  const handleReview = () => {
    const errors = validatePayment({
      studentId: student.id,
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      transactionId: formData.transactionId,
      transactionDate: formData.transactionDate,
      notes: formData.notes,
      sendReceipt: formData.sendReceipt
    }, student.outstandingBalance);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    setStep('review');
  };
  
  const handleConfirmPayment = async () => {
    const response = await processPayment({
      studentId: student.id,
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      transactionId: formData.transactionId,
      transactionDate: formData.transactionDate,
      notes: formData.notes,
      sendReceipt: formData.sendReceipt
    });
    
    if (response.success) {
      setStep('confirmation');
      if (onSuccess) {
        onSuccess(response.paymentId || '');
      }
    }
  };
  
  const handleNewPayment = () => {
    navigate('/finance/fees');
  };
  
  const handlePrintReceipt = () => {
    window.print();
  };
  
  const requiresTransactionId = ['UPI', 'Card', 'NetBanking', 'BankTransfer', 'Cheque'].includes(formData.paymentMethod);
  
  if (step === 'confirmation') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Payment Recorded Successfully</h3>
          <p className="text-gray-600 mt-2">
            Transaction completed and receipt generated
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Receipt Number</Label>
                  <div className="font-mono font-bold text-lg text-gray-900">
                    RCP{Date.now().toString().slice(-8)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Date & Time</Label>
                  <div className="font-medium text-gray-900">
                    {new Date().toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-600">Student Name</Label>
                  <div className="font-medium text-gray-900">{student.name}</div>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-gray-600">Class</Label>
                  <div className="font-medium text-gray-900">{student.className}</div>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-gray-600">Payment Method</Label>
                  <div className="font-medium text-gray-900">{formData.paymentMethod}</div>
                </div>
                {formData.transactionId && (
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-600">Transaction ID</Label>
                    <div className="font-mono text-sm text-gray-900">{formData.transactionId}</div>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-lg">
                  <Label className="font-semibold text-gray-900">Amount Paid</Label>
                  <div className="font-bold text-green-700 text-xl">
                    {formatCurrency(formData.amount)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                onClick={handlePrintReceipt}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button
                onClick={handleNewPayment}
                className="flex-1"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Record Another Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
          <p className="text-gray-600 mt-1">
            Complete financial transaction for {student.name}
          </p>
        </div>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Student Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Student Name</div>
              <div className="text-lg font-semibold text-gray-900">{student.name}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Class</div>
                <div className="font-medium">{student.className}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Student ID</div>
                <div className="font-mono font-medium">{student.id}</div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="text-sm text-gray-600 mb-1">Parent/Guardian</div>
              <div className="font-medium">{student.parentName}</div>
              <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {student.parentEmail}
              </div>
              <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {student.parentPhone}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-gray-700">Total Fees</div>
                <div className="font-medium">{formatCurrency(student.totalFees)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-700">Paid Amount</div>
                <div className="font-medium text-green-700">
                  {formatCurrency(student.paidAmount)}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-700">Outstanding</div>
                <div className="font-bold text-amber-700">
                  {formatCurrency(student.outstandingBalance)}
                </div>
              </div>
            </div>
            
            {student.overdueDays > 0 && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Payment overdue by {student.overdueDays} days
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        {/* Payment Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {step === 'details' ? 'Payment Details' : 'Review & Confirm Payment'}
            </CardTitle>
            <CardDescription>
              {step === 'details' 
                ? 'Enter payment information and verify details'
                : 'Verify all information before confirming payment'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 'details' ? (
              <div className="space-y-6">
                {/* Amount Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="amount" className="text-base font-medium">
                      Payment Amount
                    </Label>
                    <div className="text-sm text-gray-600">
                      Outstanding: {formatCurrency(student.outstandingBalance)}
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      className="pl-10 text-lg font-semibold py-6"
                      min="0"
                      max={student.outstandingBalance}
                      step="100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('amount', student.outstandingBalance)}
                    >
                      Pay Full Amount
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('amount', Math.floor(student.outstandingBalance / 2))}
                    >
                      Pay 50%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('amount', Math.floor(student.outstandingBalance / 4))}
                    >
                      Pay 25%
                    </Button>
                  </div>
                </div>
                
                {/* Payment Method */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Payment Method</Label>
                  <Tabs 
                    defaultValue="UPI" 
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <TabsList className="grid grid-cols-3 h-auto">
                      {paymentMethods.map((method) => (
                        <TabsTrigger 
                          key={method.value} 
                          value={method.value}
                          className="flex flex-col h-auto py-3"
                        >
                          <method.icon className="h-5 w-5 mb-1" />
                          <span className="text-xs">{method.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    <TabsContent value={formData.paymentMethod} className="mt-4">
                      <div className="space-y-4">
                        {requiresTransactionId && (
                          <div>
                            <Label htmlFor="transactionId">
                              {formData.paymentMethod === 'UPI' ? 'UPI Transaction ID' :
                               formData.paymentMethod === 'Card' ? 'Card Transaction ID' :
                               formData.paymentMethod === 'Cheque' ? 'Cheque Number' :
                               'Transaction Reference'}
                            </Label>
                            <Input
                              id="transactionId"
                              value={formData.transactionId}
                              onChange={(e) => handleInputChange('transactionId', e.target.value)}
                              placeholder={`Enter ${formData.paymentMethod} reference`}
                            />
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor="transactionDate">Transaction Date</Label>
                          <Input
                            id="transactionDate"
                            type="date"
                            value={formData.transactionDate}
                            onChange={(e) => handleInputChange('transactionDate', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                {/* Additional Details */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Add any notes about this payment..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sendReceipt"
                      checked={formData.sendReceipt}
                      onChange={(e) => handleInputChange('sendReceipt', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="sendReceipt">
                      Send receipt to {student.parentEmail}
                    </Label>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between">
                  {onCancel ? (
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  <Button
                    onClick={handleReview}
                    className="px-8"
                    disabled={formData.amount <= 0 || processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Review Payment'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Review Step
              <div className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    Please review all payment details before confirming. This action cannot be undone.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Student</div>
                        <div className="font-medium">{student.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Payment Method</div>
                        <div className="font-medium">{formData.paymentMethod}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Transaction Date</div>
                        <div className="font-medium">
                          {formatDate(formData.transactionDate, 'long')}
                        </div>
                      </div>
                      {formData.transactionId && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            {formData.paymentMethod === 'Cheque' ? 'Cheque Number' : 'Transaction ID'}
                          </div>
                          <div className="font-mono font-medium">{formData.transactionId}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Payment Breakdown</div>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <div className="text-gray-700">Amount to be paid</div>
                        <div className="font-medium">{formatCurrency(formData.amount)}</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-gray-700">Transaction fee</div>
                        <div className="font-medium">₹0.00</div>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <div>Total Amount</div>
                        <div className="text-green-700">
                          {formatCurrency(formData.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label htmlFor="confirmationNotes">Add Final Notes (Optional)</Label>
                    <Textarea
                      id="confirmationNotes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('details')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Edit
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={processing}
                    className="px-8 bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm & Record Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};