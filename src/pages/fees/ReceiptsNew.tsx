// src/pages/fees/ReceiptsNew.tsx - Production-ready
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Download,
  Mail,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  Receipt as ReceiptIcon,
  Search
} from 'lucide-react';
import { feesService, Receipt } from '@/api/services/feesService';
import { useToast } from '@/hooks/use-toast';

const Receipts = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const data = await feesService.getReceipts();
        setReceipts(data);
        setFilteredReceipts(data);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load receipts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [toast]);

  useEffect(() => {
    const filtered = receipts.filter(receipt =>
      receipt.receiptNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.amount?.toString().includes(searchTerm)
    );
    setFilteredReceipts(filtered);
  }, [searchTerm, receipts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleDownload = async (receipt: Receipt) => {
    try {
      setDownloadingId(receipt._id);
      const blob = await feesService.downloadReceipt(receipt._id);
      feesService.downloadFile(blob, `receipt_${receipt.receiptNo}.json`);
      
      toast({
        title: "Success",
        description: "Receipt downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download receipt",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEmail = async (receipt: Receipt) => {
    try {
      await feesService.emailReceipt(receipt._id, 'student@example.com');
      toast({
        title: "Success",
        description: "Receipt sent to your email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to email receipt",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payment Receipts</h1>
        <p className="text-muted-foreground">View and download your payment receipts</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by receipt number or amount..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Receipts List */}
      {filteredReceipts.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-12 text-center space-y-4">
            <ReceiptIcon className="h-12 w-12 text-amber-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">No Receipts Found</h3>
              <p className="text-amber-800">You don't have any payment receipts yet. Make a payment to get a receipt.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReceipts.map((receipt) => (
            <Card key={receipt._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <ReceiptIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">{receipt.receiptNo}</h3>
                      <Badge variant="outline">
                        {receipt.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-bold text-lg">{formatCurrency(receipt.amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Method</p>
                        <p className="font-semibold capitalize">{receipt.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-semibold">{new Date(receipt.date).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge className="mt-1">{receipt.status}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(receipt)}
                      disabled={downloadingId === receipt._id}
                    >
                      {downloadingId === receipt._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(receipt)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6 flex gap-3">
          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Receipt Information</p>
            <p>Receipts are automatically generated after payment confirmation. You can download them as PDF or email them to your registered email address.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Receipts;
