// src/pages/fees/Receipts.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  FileText,
  Printer,
  Mail,
  QrCode,
  CheckCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const Receipts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedType, setSelectedType] = useState('All Types');
  
  const receiptsData = [
    {
      id: 1,
      receiptNo: 'REC202411001',
      date: '2024-11-10',
      feeType: 'Tuition Fee',
      amount: 15000,
      paymentMethod: 'UPI',
      status: 'verified',
      downloadUrl: '#'
    },
    {
      id: 2,
      receiptNo: 'REC202410005',
      date: '2024-10-25',
      feeType: 'Transport Fee',
      amount: 3000,
      paymentMethod: 'Net Banking',
      status: 'verified',
      downloadUrl: '#'
    },
    {
      id: 3,
      receiptNo: 'REC202410003',
      date: '2024-10-15',
      feeType: 'Annual Charges',
      amount: 25000,
      paymentMethod: 'Credit Card',
      status: 'verified',
      downloadUrl: '#'
    },
    {
      id: 4,
      receiptNo: 'REC202409008',
      date: '2024-09-20',
      feeType: 'Tuition Fee',
      amount: 35000,
      paymentMethod: 'Debit Card',
      status: 'verified',
      downloadUrl: '#'
    },
    {
      id: 5,
      receiptNo: 'REC202408012',
      date: '2024-08-05',
      feeType: 'Admission Fee',
      amount: 50000,
      paymentMethod: 'Bank Transfer',
      status: 'verified',
      downloadUrl: '#'
    },
    {
      id: 6,
      receiptNo: 'REC202407015',
      date: '2024-07-18',
      feeType: 'Activity Fee',
      amount: 7500,
      paymentMethod: 'Wallet',
      status: 'verified',
      downloadUrl: '#'
    }
  ];

  const totalReceipts = receiptsData.length;
  const totalAmount = receiptsData.reduce((sum, receipt) => sum + receipt.amount, 0);
  const currentYearTotal = receiptsData
    .filter(r => r.date.startsWith('2024'))
    .reduce((sum, receipt) => sum + receipt.amount, 0);

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

  const handleDownload = (receiptNo: string) => {
    alert(`Downloading receipt: ${receiptNo}`);
  };

  const handlePrint = (receiptNo: string) => {
    alert(`Printing receipt: ${receiptNo}`);
  };

  const handleEmail = (receiptNo: string) => {
    alert(`Email sent for receipt: ${receiptNo}`);
  };

  const handleBulkDownload = () => {
    alert('Downloading all receipts as ZIP file...');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Payment Receipts</h2>
        <p className="text-muted-foreground">Download and manage your payment receipts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceipts}</div>
            <p className="text-xs text-muted-foreground">Payment receipts available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Across all receipts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentYearTotal)}
            </div>
            <p className="text-xs text-muted-foreground">Paid in 2024</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search receipts..."
                  className="pl-10 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <Calendar className="h-3 w-3 mr-2" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <Filter className="h-3 w-3 mr-2" />
                  <SelectValue placeholder="Fee Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Types">All Types</SelectItem>
                  <SelectItem value="Tuition Fee">Tuition Fee</SelectItem>
                  <SelectItem value="Transport Fee">Transport Fee</SelectItem>
                  <SelectItem value="Annual Charges">Annual Charges</SelectItem>
                  <SelectItem value="Activity Fee">Activity Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBulkDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                Email All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptsData.map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">
                      <div>{receipt.receiptNo}</div>
                    </TableCell>
                    <TableCell>{formatDate(receipt.date)}</TableCell>
                    <TableCell>{receipt.feeType}</TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(receipt.amount)}
                    </TableCell>
                    <TableCell>{receipt.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Verified
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(receipt.receiptNo)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePrint(receipt.receiptNo)}
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEmail(receipt.receiptNo)}
                          title="Email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Receipt Preview & Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Receipt Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receipt Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="max-w-md mx-auto">
                {/* Receipt Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold">PMC TECH SCHOOL</h3>
                  <p className="text-sm text-muted-foreground">Smart Education Institution</p>
                  <p className="text-xs text-muted-foreground mt-1">Hosur - Krishnagiri Highways, Tamil Nadu - 635 117</p>
                  <p className="text-xs text-muted-foreground">Receipt No: REC202411001</p>
                </div>
                
                {/* Receipt Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">10 Nov, 2024</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium">UPI</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Student Name</p>
                    <p className="font-medium">Priya Patel</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">Tuition Fee - Installment 2</p>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">₹15,000</p>
                    </div>
                  </div>
                  
                  {/* Signature */}
                  <div className="pt-6 border-t text-center">
                    <div className="inline-block border-t-2 border-gray-400 w-32 mt-8"></div>
                    <p className="text-sm text-muted-foreground mt-2">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Receipt Validity</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>All receipts are digitally signed and verified</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Receipts are valid for income tax purposes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Keep receipts for future reference</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Download Formats</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    JPEG
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">QR Code Verification</h4>
                <div className="p-4 border rounded-lg text-center">
                  <div className="w-24 h-24 bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scan to verify receipt authenticity
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Receipts;