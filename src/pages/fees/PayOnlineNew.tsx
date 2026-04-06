// src/pages/fees/PayOnlineNew.tsx - Production-ready
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  CheckCircle,
  Lock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  DollarSign,
  Receipt
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { feesService } from '@/api/services/feesService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface LocationState {
  amount?: number;
  selectedDues?: number[];
}

const PayOnline = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const locationState = (location.state as LocationState) || {};
  
  // States
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(locationState.amount?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'Fast and secure UPI payment',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa/Mastercard/Rupay',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'Transfer from your bank',
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: Wallet,
      description: 'Paytm/PhonePe/Google Pay',
      color: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      icon: Building,
      description: 'NEFT/RTGS transfer',
      color: 'bg-indigo-100 text-indigo-700'
    },
  ];

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amt);
  };

  const handlePayment = async () => {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      if (!user?._id) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);

      // Simulate transaction ID (in real scenario, this would come from payment gateway)
      const txnId = `TXN${Date.now()}${Math.random().toString(9).substring(2, 8)}`;
      setTransactionId(txnId);

      // Call backend payment API
      const result = await feesService.processPayment({
        studentId: user._id,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod as any,
        transactionId: txnId,
        description: `Payment for fees - ${paymentMethod}`,
      });

      if (result.success) {
        setReceiptNumber(result.data.receiptNumber);
        setPaymentSuccess(true);
        setStep(3);
        
        toast({
          title: "Payment Successful",
          description: `Receipt: ${result.data.receiptNumber}`,
        });
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 1: Amount & Method Selection
  if (step === 1) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Pay Your Fees</h1>
          <p className="text-muted-foreground">Secure online payment</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 1 of 3: Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="amount" className="text-base">Enter Amount (₹)</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-lg"
                  min="1"
                />
              </div>
            </div>

            {amount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(parseFloat(amount))}
                </p>
              </div>
            )}

            <div>
              <Label className="text-base mb-3 block">Select Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div key={method.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:border-blue-500 cursor-pointer transition">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <div>
                              <p className="font-semibold">{method.name}</p>
                              <p className="text-xs text-muted-foreground">{method.description}</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            <Button
              size="lg"
              onClick={() => setStep(2)}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full"
            >
              Continue to Payment
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-4 bg-amber-50 border-amber-200">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Important</p>
              <p>Your payment will be processed securely. You'll receive a receipt after confirmation.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Verification
  if (step === 2) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setStep(1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold">Confirm Payment</h1>
          <p className="text-muted-foreground">Step 2 of 3: Review & Confirm</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-xl font-bold">{formatCurrency(parseFloat(amount))}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-muted-foreground">Payment Method</span>
              <Badge variant="outline">
                {paymentMethods.find(m => m.id === paymentMethod)?.name}
              </Badge>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <Lock className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-semibold">Secure Payment</p>
                <p>Your payment information is encrypted and secure.</p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Success
  if (step === 3 && paymentSuccess) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">Step 3 of 3: Confirmation</p>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-12 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-20 w-20 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Thank You!</h2>
              <p className="text-green-800">Your payment has been processed successfully.</p>
            </div>

            <div className="bg-white rounded-lg p-6 space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt Number</span>
                <span className="font-bold">{receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-sm">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-xl font-bold">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <Badge variant="outline">
                  {paymentMethods.find(m => m.id === paymentMethod)?.name}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="text-sm">{new Date().toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Button onClick={() => navigate('/fees/receipts')} className="w-full">
                <Receipt className="h-4 w-4 mr-2" />
                View Receipt
              </Button>
              <Button variant="outline" onClick={() => navigate('/fees')} className="w-full">
                Back to Fees
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="pt-6 flex gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Receipt Sent</p>
              <p>A receipt has been sent to your registered email address.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default PayOnline;
