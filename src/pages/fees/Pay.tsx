// src/pages/fees/Pay.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  CheckCircle,
  Lock,
  Shield,
  SmartphoneIcon,
  QrCode,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PayOnline = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: SmartphoneIcon,
      description: 'Fast and secure UPI payment',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay using Visa/Mastercard/Rupay',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'Transfer from your bank account',
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: Wallet,
      description: 'Paytm, PhonePe, Google Pay',
      color: 'bg-amber-100 text-amber-700'
    }
  ];

  const suggestedAmounts = [5000, 10000, 15000, 20000, 25000];

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      setStep(3);
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Enter Payment Amount</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                
                <div>
                  <Label className="mb-3 block">Quick Select</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {suggestedAmounts.map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant="outline"
                        onClick={() => handleAmountSelect(amt)}
                        className={amount === amt.toString() ? 'border-primary bg-primary/10' : ''}
                      >
                        ₹{amt.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setStep(2)} 
              className="w-full"
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Continue to Payment
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                className="space-y-3"
              >
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label 
                      htmlFor={method.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent">
                        <div className={`p-2 rounded ${method.color}`}>
                          <method.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {method.description}
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800">Secure Payment</h4>
                  <p className="text-sm text-blue-700">
                    Your payment is secured with 256-bit SSL encryption. We never store your card details.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Proceed to Pay'
                )}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-700 mb-2">
                Payment Successful!
              </h3>
              <p className="text-muted-foreground mb-6">
                Your payment has been processed successfully.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono font-medium">TXN{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(parseFloat(amount))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">
                    {paymentMethods.find(m => m.id === paymentMethod)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span>{new Date().toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/fees/history')}
                className="flex-1"
              >
                View History
              </Button>
              <Button
                onClick={() => {
                  alert('Receipt downloaded!');
                  navigate('/fees/receipts');
                }}
                className="flex-1"
              >
                Download Receipt
              </Button>
              <Button
                onClick={() => {
                  setStep(1);
                  setAmount('');
                  setPaymentSuccess(false);
                }}
                className="flex-1"
              >
                Make Another Payment
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/fees/dues')}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dues
          </Button>
        </div>
        <h2 className="text-2xl font-bold">Pay Fees Online</h2>
        <p className="text-muted-foreground">Secure and convenient online payment</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <span className="text-xs mt-1">Enter Amount</span>
          </div>
          <div className={`w-24 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span className="text-xs mt-1">Select Method</span>
          </div>
          <div className={`w-24 h-1 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            <span className="text-xs mt-1">Confirmation</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {renderStep()}
              </CardContent>
            </Card>
          </div>

          {/* Security & Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Payment Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">SSL Secured</div>
                    <div className="text-xs text-muted-foreground">256-bit encryption</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">PCI DSS Compliant</div>
                    <div className="text-xs text-muted-foreground">Payment security standard</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium">No Card Storage</div>
                    <div className="text-xs text-muted-foreground">We don't store card details</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    📞 Call Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📧 Email Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    💬 Live Chat
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* QR Code for UPI */}
            {step === 2 && paymentMethod === 'upi' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Scan & Pay</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg inline-block mb-3">
                    <div className="w-32 h-32 bg-gray-100 flex items-center justify-center">
                      <QrCode className="h-20 w-20 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with any UPI app to pay
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayOnline;