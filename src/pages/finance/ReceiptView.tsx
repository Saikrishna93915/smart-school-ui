import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/finance/currencyFormatter';
import { settingsApi } from '@/Services/settingsService';
import apiClient from '@/Services/apiClient';

interface ReceiptPayment {
  receiptNumber: string;
  studentName: string;
  admissionNumber: string;
  className?: string;
  section?: string;
  parentName?: string;
  parentPhone?: string;
  paymentDate?: string;
  paymentMethod?: string;
  status?: string;
  amount?: number;
  discount?: number;
  lateFee?: number;
  netAmount?: number;
  transactionId?: string;
  recordedByName?: string;
  description?: string;
}

interface SchoolSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
}

const normalizeReceiptNumber = (value?: string) => {
  if (!value) return '';

  let normalized = decodeURIComponent(value).trim();

  if (normalized.length % 2 === 0) {
    const half = normalized.length / 2;
    if (normalized.slice(0, half) === normalized.slice(half)) {
      normalized = normalized.slice(0, half);
    }
  }

  const standardMatch = normalized.match(/(REC-\d+-\d+|CREDIT-\d+-\d+|INST-\d+-\d+)/i);
  if (standardMatch?.[1]) {
    return standardMatch[1];
  }

  return normalized;
};

const formatDateTime = (dateInput?: string) => {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'N/A';
  // Force IST (Indian Standard Time) - UTC+5:30
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
};

const ReceiptView = () => {
  const navigate = useNavigate();
  const { receiptNumber } = useParams<{ receiptNumber: string }>();

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<ReceiptPayment | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    name: 'PMC Tech School',
    address: 'Hosur - Krishnagiri Highways, Nallaganakothapalli, Near Koneripalli (PO), Hosur, Krishnagiri District, Tamil Nadu - 635 117',
    phone: '+91 XXXXXXXXXX',
    email: 'office@pmctechschool.com',
    logo: null
  });

  const normalizedReceiptNumber = useMemo(
    () => normalizeReceiptNumber(receiptNumber),
    [receiptNumber]
  );

  // Fetch school settings
  useEffect(() => {
    const fetchSchoolSettings = async () => {
      try {
        const response = await settingsApi.getAllSettings();
        if (response.success && response.data.schoolInfo) {
          const info = response.data.schoolInfo;
          setSchoolSettings({
            name: info.name || 'PMC Tech School',
            address: info.address || 'Hosur - Krishnagiri Highways, Nallaganakothapalli, Near Koneripalli (PO), Hosur, Krishnagiri District, Tamil Nadu - 635 117',
            phone: info.phone || '+91 XXXXXXXXXX',
            email: info.email || 'office@pmctechschool.com',
            logo: info.logo || null
          });
        }
      } catch (error) {
        console.error('Failed to fetch school settings:', error);
        // Continue with default settings
      }
    };

    fetchSchoolSettings();
  }, []);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);

        const response = await apiClient.get(`/history/receipt/${encodeURIComponent(normalizedReceiptNumber)}`);

        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.message || 'Receipt not found');
        }

        setReceipt(response.data.data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load receipt');
      } finally {
        setLoading(false);
      }
    };

    if (normalizedReceiptNumber) {
      fetchReceipt();
    } else {
      setLoading(false);
      toast.error('Invalid receipt number');
    }
  }, [navigate, normalizedReceiptNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading receipt...</span>
      </div>
    );
  }

  if (!receipt) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-semibold mb-2">Receipt not found</h2>
          <p className="text-muted-foreground mb-4">The requested receipt could not be loaded.</p>
          <Button onClick={() => navigate('/finance/payment-history')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payment History
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          html, body {
            height: 100%;
            overflow: hidden !important;
            width: 100%;
          }
          body * {
            visibility: hidden;
          }
          #receipt-print-area, #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-wrapper {
            display: flex !important;
            flex-direction: row !important;
            width: 100% !important;
            height: 100vh !important;
            gap: 8px !important;
          }
          .receipts-container {
            display: flex !important;
            flex-direction: row !important;
            gap: 8px !important;
            width: 100% !important;
            height: 100% !important;
          }
          .receipt-card {
            border: 1px solid #000 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            padding: 8px !important;
            margin: 0 !important;
            width: 50% !important;
            flex: 1 !important;
            min-width: 0 !important;
            background: white !important;
            overflow: visible !important;
            height: 100% !important;
            box-sizing: border-box !important;
            position: relative !important;
          }
          .receipt-card * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 1px 0 !important;
            padding: 1px !important;
            max-width: 100% !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          .receipt-header {
            padding-bottom: 4px !important;
            margin-bottom: 4px !important;
            text-align: center !important;
            border-bottom: 2px solid #000 !important;
          }
          .school-name {
            font-size: 11px !important;
            font-weight: 900 !important;
            margin-bottom: 1px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.3px !important;
          }
          .school-info {
            font-size: 5px !important;
            line-height: 1.1 !important;
            color: #444 !important;
          }
          .receipt-title {
            font-size: 9px !important;
            font-weight: 700 !important;
            margin: 3px 0 !important;
            padding: 2px 0 !important;
            text-align: center !important;
            text-transform: uppercase !important;
            letter-spacing: 0.8px !important;
          }
          .receipt-meta {
            background: #f9fafb !important;
            padding: 3px !important;
            margin-bottom: 3px !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 2px !important;
          }
          .receipt-no {
            font-size: 7px !important;
            font-weight: 600 !important;
            margin-bottom: 1px !important;
          }
          .status-badge {
            display: inline-block !important;
            padding: 1px 4px !important;
            background: #dcfce7 !important;
            color: #166534 !important;
            border: 1px solid #86efac !important;
            border-radius: 2px !important;
            font-size: 5px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
          }
          .section-box {
            padding: 3px !important;
            margin-bottom: 3px !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 2px !important;
            background: #f9fafb !important;
          }
          .section-title {
            font-size: 6px !important;
            font-weight: 700 !important;
            margin-bottom: 2px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.3px !important;
            color: #374151 !important;
          }
          .info-item {
            font-size: 5px !important;
            margin-bottom: 1px !important;
            display: flex !important;
            justify-content: space-between !important;
            padding: 0.5px 0 !important;
            border-bottom: 1px dotted #e5e7eb !important;
          }
          .info-item:last-child {
            border-bottom: none !important;
            margin-bottom: 0 !important;
          }
          .info-label {
            font-weight: 600 !important;
            color: #6b7280 !important;
          }
          .info-value {
            font-weight: 600 !important;
            color: #111827 !important;
            text-align: right !important;
          }
          .amount-box {
            padding: 4px !important;
            margin-bottom: 3px !important;
            border: 2px solid #059669 !important;
            border-radius: 2px !important;
            background: #f0fdf4 !important;
          }
          .amount-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 2px !important;
            margin-bottom: 3px !important;
          }
          .amount-item {
            font-size: 5px !important;
            display: flex !important;
            justify-content: space-between !important;
            padding: 0.5px 0 !important;
          }
          .total-amount {
            font-size: 8px !important;
            padding-top: 3px !important;
            margin-top: 3px !important;
            border-top: 2px solid #059669 !important;
            font-weight: 700 !important;
            color: #059669 !important;
          }
          .footer-section {
            padding-top: 3px !important;
            margin-top: 5px !important;
            font-size: 4px !important;
            border-top: 1px solid #e5e7eb !important;
            text-align: center !important;
          }
          .signature-section {
            display: flex !important;
            justify-content: space-between !important;
            margin-top: 5px !important;
            padding-top: 5px !important;
            border-top: 1px solid #e5e7eb !important;
          }
          .signature-box {
            text-align: center !important;
            width: 45% !important;
          }
          .signature-line {
            border-top: 1px solid #9ca3af !important;
            margin-top: 10px !important;
            padding-top: 1px !important;
            font-size: 5px !important;
            font-weight: 600 !important;
            color: #6b7280 !important;
          }
          .divider {
            width: 2px !important;
            border-left: 2px dashed #000 !important;
            height: 100% !important;
            margin: 0 4px !important;
          }
          body {
            font-size: 11px !important;
            transform: scale(0.92);
            transform-origin: top left;
            width: 108% !important;
          }
          h1, h2, h3, h4, h5, h6 {
            font-size: 12px !important;
            white-space: normal !important;
          }
          p, span, div {
            font-size: 10px !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
          .print-wrapper {
            display: flex;
            gap: 15px;
          }
          .receipts-container {
            display: flex;
            flex-direction: row;
            gap: 15px;
          }
          .receipt-card {
            flex: 1;
            min-width: 45%;
          }
          .divider {
            width: 2px;
            border-left: 2px dashed #ccc;
            margin: 0 10px;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
        .receipt-header {
          text-align: center;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .school-logo {
          max-width: 100px;
          max-height: 100px;
          margin: 0 auto 10px;
          display: block;
        }
        .school-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .school-info {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.5;
        }
        .receipt-title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          text-transform: uppercase;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          padding: 10px 0;
        }
      `}</style>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between no-print">
          <Button variant="outline" onClick={() => navigate('/finance/payment-history')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payment History
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print (2 Copies)
          </Button>
        </div>

        <div id="receipt-print-area">
          <div className="receipts-container">
            <Card className="receipt-card">
            {/* Print Header with Logo and School Info */}
            <div className="receipt-header">
              {schoolSettings.logo && (
                <img
                  src={schoolSettings.logo}
                  alt="School Logo"
                  className="school-logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="school-name">PMC TECH SCHOOL</div>
              <div className="school-info">
                Hosur - Krishnagiri Highways, Nallaganakothapalli, Near Koneripalli (PO),<br/>
                Hosur, Krishnagiri District, Tamil Nadu - 635 117<br/>
                Phone: +91 XXXXXXXXXX | Email: office@pmctechschool.com
              </div>
            </div>

            <div className="receipt-title">Fee Payment Receipt</div>

            <CardHeader className="card-header">
              <div className="flex items-center justify-between">
                <CardTitle>Receipt {receipt?.receiptNumber || normalizedReceiptNumber}</CardTitle>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  {(receipt?.status || 'completed').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 card-content">
              {/* Receipt Information */}
              <div className="border rounded-md p-4 bg-gray-50 section-box">
                <h3 className="font-semibold text-sm mb-3 section-title">Receipt Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm info-grid">
                  <div className="info-item">
                    <p className="text-muted-foreground">Receipt No:</p>
                    <p className="font-medium">{receipt?.receiptNumber || normalizedReceiptNumber}</p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Date:</p>
                    <p className="font-medium">{formatDateTime(receipt?.paymentDate)}</p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Time:</p>
                    <p className="font-medium">
                      {receipt?.paymentDate 
                        ? new Date(receipt.paymentDate).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="border rounded-md p-4 section-box">
                <h3 className="font-semibold text-sm mb-3 section-title">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm info-grid">
                  <div className="info-item">
                    <p className="text-muted-foreground">Student Name:</p>
                    <p className="font-medium">{receipt?.studentName || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Admission No:</p>
                    <p className="font-medium">{receipt?.admissionNumber || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Class:</p>
                    <p className="font-medium">
                      {receipt?.className || 'N/A'} {receipt?.section ? `• ${receipt.section}` : ''}
                    </p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Roll No:</p>
                    <p className="font-medium">N/A</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="border rounded-md p-4 section-box">
                <h3 className="font-semibold text-sm mb-3 section-title">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm info-grid">
                  <div className="info-item">
                    <p className="text-muted-foreground">Payment Method:</p>
                    <p className="font-medium">{receipt?.paymentMethod || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Description:</p>
                    <p className="font-medium">{receipt?.description || 'Payment for 0 due payment(s)'}</p>
                  </div>
                  <div className="col-span-2 info-item">
                    <p className="text-muted-foreground">Status:</p>
                    <p className="font-medium">{(receipt?.status || 'COMPLETED').toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className="border-2 border-gray-300 rounded-md p-4 bg-gray-50 amount-box">
                <div className="grid grid-cols-4 gap-3 text-sm mb-3 amount-grid">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold">{formatCurrency(receipt?.amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Discount</p>
                    <p className="font-semibold">{formatCurrency(receipt?.discount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Late Fee</p>
                    <p className="font-semibold">{formatCurrency(receipt?.lateFee || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Amount</p>
                    <p className="font-semibold text-green-700">{formatCurrency(receipt?.netAmount || receipt?.amount || 0)}</p>
                  </div>
                </div>
                <div className="border-t pt-3 mt-3 total-amount">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Amount Paid:</span>
                    <span className="text-2xl font-bold text-green-700">
                      {formatCurrency(receipt?.netAmount || receipt?.amount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-4 mt-6 text-sm footer-section">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-muted-foreground">Collected By:</p>
                    <p className="font-medium">{receipt?.recordedByName || 'System'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium signature-text">Authorized Signature</p>
                    <p className="text-xs text-muted-foreground mt-10 disclaimer-text">
                      This is a computer generated receipt. No signature required.
                    </p>
                  </div>
                </div>
                <div className="text-center mt-4 text-xs text-muted-foreground">
                  PMC Tech School | Hosur - Krishnagiri Highways, Tamil Nadu - 635 117
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Cut Line (Middle) */}
            <div className="cut-line print-only">
              ✂️<br/>C<br/>U<br/>T<br/>H<br/>E<br/>R<br/>E
            </div>

            {/* Second Receipt (Right Side) */}
            <Card className="receipt-card">
            {/* Print Header with Logo and School Info */}
            <div className="receipt-header">
              {schoolSettings.logo && (
                <img
                  src={schoolSettings.logo}
                  alt="School Logo"
                  className="school-logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="school-name">PMC TECH SCHOOL</div>
              <div className="school-info">
                Hosur - Krishnagiri Highways, Nallaganakothapalli, Near Koneripalli (PO),<br/>
                Hosur, Krishnagiri District, Tamil Nadu - 635 117<br/>
                Phone: +91 XXXXXXXXXX | Email: office@pmctechschool.com
              </div>
            </div>

            <div className="receipt-title">Fee Payment Receipt (Duplicate)</div>

            <CardHeader className="card-header">
              <div className="flex items-center justify-between">
                <CardTitle>Receipt {receipt?.receiptNumber || normalizedReceiptNumber}</CardTitle>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  {(receipt?.status || 'completed').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 card-content">
              {/* Receipt Information */}
              <div className="border rounded-md p-4 bg-gray-50 section-box">
                <h3 className="font-semibold text-sm mb-3 section-title">Receipt Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm info-grid">
                  <div className="info-item">
                    <p className="text-muted-foreground">Receipt No:</p>
                    <p className="font-medium">{receipt?.receiptNumber || normalizedReceiptNumber}</p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Date:</p>
                    <p className="font-medium">{formatDateTime(receipt?.paymentDate)}</p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Time:</p>
                    <p className="font-medium">
                      {receipt?.paymentDate
                        ? new Date(receipt.paymentDate).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="border rounded-md p-4 section-box">
                <h3 className="font-semibold text-sm mb-3 section-title">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm info-grid">
                  <div className="info-item">
                    <p className="text-muted-foreground">Student Name:</p>
                    <p className="font-medium">{receipt?.studentName || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Admission No:</p>
                    <p className="font-medium">{receipt?.admissionNumber || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Class:</p>
                    <p className="font-medium">
                      {receipt?.className || 'N/A'} {receipt?.section ? `• ${receipt.section}` : ''}
                    </p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Roll No:</p>
                    <p className="font-medium">N/A</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="border rounded-md p-4 section-box">
                <h3 className="font-semibold text-sm mb-3 section-title">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm info-grid">
                  <div className="info-item">
                    <p className="text-muted-foreground">Payment Method:</p>
                    <p className="font-medium">{receipt?.paymentMethod || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <p className="text-muted-foreground">Description:</p>
                    <p className="font-medium">{receipt?.description || 'Payment for 0 due payment(s)'}</p>
                  </div>
                  <div className="col-span-2 info-item">
                    <p className="text-muted-foreground">Status:</p>
                    <p className="font-medium">{(receipt?.status || 'COMPLETED').toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className="border rounded-md p-4 amount-box">
                <h3 className="font-semibold text-sm mb-3 section-title">Fee Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm amount-grid">
                  <div>
                    <p className="text-muted-foreground">Fee Amount</p>
                    <p className="font-semibold">{formatCurrency(receipt?.amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Discount</p>
                    <p className="font-semibold">{formatCurrency(receipt?.discount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Late Fee</p>
                    <p className="font-semibold">{formatCurrency(receipt?.lateFee || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Amount</p>
                    <p className="font-semibold text-green-700">{formatCurrency(receipt?.netAmount || receipt?.amount || 0)}</p>
                  </div>
                </div>
                <div className="border-t pt-3 mt-3 total-amount">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Amount Paid:</span>
                    <span className="text-2xl font-bold text-green-700">
                      {formatCurrency(receipt?.netAmount || receipt?.amount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-4 mt-6 text-sm footer-section">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-muted-foreground">Collected By:</p>
                    <p className="font-medium">{receipt?.recordedByName || 'System'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium signature-text">Authorized Signature</p>
                    <p className="text-xs text-muted-foreground mt-10 disclaimer-text">
                      This is a computer generated receipt. No signature required.
                    </p>
                  </div>
                </div>
                <div className="text-center mt-4 text-xs text-muted-foreground">
                  PMC Tech School | Hosur - Krishnagiri Highways, Tamil Nadu - 635 117
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptView;