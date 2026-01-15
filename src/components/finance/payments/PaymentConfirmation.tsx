import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  FileText, 
  Printer, 
  Mail, 
  Download,
  Share2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/finance/currencyFormatter';

function formatDateTime(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface PaymentConfirmationProps {
  paymentId: string;
  studentName: string;
  className: string;
  amount: number;
  paymentMethod: string;
  transactionDate: string;
  transactionId?: string;
  receiptNumber: string;
  onPrint?: () => void;
  onEmail?: () => void;
  onDownload?: () => void;
  onNewPayment?: () => void;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  paymentId,
  studentName,
  className,
  amount,
  paymentMethod,
  transactionDate,
  transactionId,
  receiptNumber,
  onPrint,
  onEmail,
  onDownload,
  onNewPayment
}) => {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Payment Recorded Successfully</h3>
        <p className="text-gray-600 mt-2">
          Receipt #{receiptNumber} has been generated
        </p>
      </div>
      
      {/* Receipt Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          {/* Receipt Header */}
          <div className="text-center mb-8">
            <div className="text-2xl font-bold text-gray-900">FEE RECEIPT</div>
            <div className="text-gray-600 mt-1">ABC Public School</div>
            <Badge className="mt-2" variant="outline">
              #{receiptNumber}
            </Badge>
          </div>
          
          <Separator className="my-6" />
          
          {/* Receipt Details */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Payment ID</div>
                <div className="font-mono font-medium text-gray-900">{paymentId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Date & Time</div>
                <div className="font-medium text-gray-900">
                  {formatDateTime(transactionDate)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Student Name</div>
                <div className="font-medium text-gray-900">{studentName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Class</div>
                <div className="font-medium text-gray-900">{className}</div>
              </div>
            </div>
            
            {transactionId && (
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  {paymentMethod === 'Cheque' ? 'Cheque Number' : 'Transaction ID'}
                </div>
                <div className="font-mono font-medium text-gray-900">{transactionId}</div>
              </div>
            )}
            
            <div>
              <div className="text-sm text-gray-600 mb-1">Payment Method</div>
              <Badge variant="secondary" className="text-base py-1 px-3">
                {paymentMethod}
              </Badge>
            </div>
            
            <Separator />
            
            {/* Amount Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-2xl font-bold">
                <div className="text-gray-900">Total Amount</div>
                <div className="text-green-700">
                  {formatCurrency(amount)}
                </div>
              </div>
              <div className="text-sm text-gray-600 text-center mt-2">
                (Rupees {amount.toLocaleString('en-IN')} only)
              </div>
            </div>
            
            <Separator />
            
            {/* Footer */}
            <div className="text-center text-sm text-gray-500 space-y-1">
              <div>This is a computer generated receipt</div>
              <div>No signature required</div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                For any queries, contact: accounts@abcschool.edu.in | +91 9876543210
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          onClick={onPrint}
          className="flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        
        <Button
          variant="outline"
          onClick={onEmail}
          className="flex items-center justify-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
        
        <Button
          variant="outline"
          onClick={onDownload}
          className="flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        
        <Button
          variant="outline"
          onClick={onNewPayment}
          className="flex items-center justify-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
      
      {/* Continue Button */}
      <div className="text-center">
        <Button
          onClick={onNewPayment}
          size="lg"
          className="px-8"
        >
          Record Another Payment
        </Button>
        <div className="text-sm text-gray-500 mt-2">
          Or return to the fees dashboard
        </div>
      </div>
    </div>
  );
};