import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Search, 
  Award,
  ShieldCheck,
  History,
  User,
  GraduationCap,
  BookOpen,
  HeartPulse,
  FileCheck,
  Users,
  Eye,
  FileSignature,
  CalendarDays,
  School
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Local fallback QR code generator returning a data URL.
 * This replaces the missing `generateQRCode` export from '@/lib/utils'.
 * It renders a simple deterministic pseudo-QR pattern to a canvas and returns a PNG data URL.
 */
const generateQRCode = async (data: string): Promise<string> => {
  if (typeof document === 'undefined') return '';
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  // white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // deterministic hash from input
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }

  // draw a pseudo-QR grid using hash bits (placeholder)
  const grid = 21;
  const cell = Math.floor(size / grid);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const bit = (Math.abs((hash >> ((x + y) % 32)) & 1));
      if (bit) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  // add a small central marker for visual clarity
  ctx.fillStyle = '#000';
  const markerSize = Math.max(2, Math.floor(grid / 6));
  const markerStart = Math.floor((grid - markerSize) / 2) * cell;
  ctx.fillRect(markerStart, markerStart, markerSize * cell, markerSize * cell);

  return canvas.toDataURL('image/png');
};

// Mock Data: Issued Certificates
const issuedCertificates = [
  { 
    id: 'CERT-2024-001', 
    student: 'Arjun Verma', 
    studentId: 'STU-001',
    type: 'Study Certificate', 
    date: '2024-11-15', 
    status: 'verified',
    course: 'Class 10',
    reason: 'Outstanding Academic Performance'
  },
  { 
    id: 'CERT-2024-002', 
    student: 'Priya Patel', 
    studentId: 'STU-045',
    type: 'Sports Achievement', 
    date: '2024-11-10', 
    status: 'verified',
    course: 'Class 12',
    reason: 'State Level Basketball Championship'
  },
  { 
    id: 'CERT-2024-003', 
    student: 'Rohit Sharma', 
    studentId: 'STU-078',
    type: 'Medical Certificate', 
    date: '2024-11-05', 
    status: 'pending',
    course: 'Class 9',
    reason: 'Medical Leave - Dengue Fever'
  },
  { 
    id: 'CERT-2024-004', 
    student: 'Kavya Singh', 
    studentId: 'STU-112',
    type: 'School Leaving', 
    date: '2024-10-28', 
    status: 'verified',
    course: 'Class 12',
    reason: 'Transfer Certificate'
  },
];

// Certificate Types for School
const certificateTypes = [
  { value: 'study', label: 'Study Certificate', icon: BookOpen },
  { value: 'medical', label: 'Medical Certificate', icon: HeartPulse },
  { value: 'transfer', label: 'School Leaving Certificate', icon: Users },
  { value: 'character', label: 'Character Certificate', icon: User },
  { value: 'sports', label: 'Sports Achievement', icon: Award },
  { value: 'merit', label: 'Merit Certificate', icon: GraduationCap },
  { value: 'bonafide', label: 'Bonafide Certificate', icon: FileCheck },
  { value: 'conduct', label: 'Conduct Certificate', icon: ShieldCheck },
];

export default function Certificates() {
  const [activeTab, setActiveTab] = useState('generate');
  const [searchQuery, setSearchQuery] = useState('');
  const certificateRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  // State for Generator
  const [formData, setFormData] = useState({
    studentName: 'Arjun Verma',
    studentId: 'STU-001',
    fatherName: 'Rajesh Verma',
    motherName: 'Sunita Verma',
    address: '123, Gandhi Road, Mumbai - 400001',
    course: 'Class 10 (Section A)',
    type: 'study',
    date: new Date().toISOString().split('T')[0],
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: 'For scholarship application purposes',
    additionalNotes: '',
    academicYear: '2024-2025',
    rollNumber: '1024',
    percentage: '92.5%',
    attendance: '95%'
  });

  // Generate certificate ID
  const certificateId = `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  // Generate QR code on component mount and when data changes
  useEffect(() => {
    const generateQR = async () => {
      const qrData = {
        id: certificateId,
        student: formData.studentName,
        studentId: formData.studentId,
        date: formData.date,
        type: certificateTypes.find(t => t.value === formData.type)?.label || formData.type,
        verifyUrl: `https://verify.aischoolerp.com/certificates/${certificateId}`
      };
      
      const qrCode = await generateQRCode(JSON.stringify(qrData));
      setQrCodeDataUrl(qrCode);
    };
    
    generateQR();
  }, [formData.studentName, formData.studentId, formData.date, formData.type, certificateId]);

  // State for Verification
  const [verifyId, setVerifyId] = useState('');
  const [verificationResult, setVerificationResult] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [verifiedCertificate, setVerifiedCertificate] = useState<any>(null);

  // Filter certificates based on search
  const filteredCertificates = issuedCertificates.filter(cert =>
    cert.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVerify = () => {
    if (!verifyId.trim()) {
      toast.error('Please enter a Certificate ID');
      return;
    }
    
    const foundCert = issuedCertificates.find(cert => 
      cert.id.toLowerCase() === verifyId.toLowerCase().trim()
    );
    
    if (foundCert) {
      setVerificationResult('valid');
      setVerifiedCertificate(foundCert);
      toast.success('Certificate verified successfully!');
    } else {
      setVerificationResult('invalid');
      setVerifiedCertificate(null);
      toast.error('Invalid Certificate ID');
    }
  };

  const handlePrint = () => {
    if (certificateRef.current) {
      // Create a clone of the certificate for printing
      const printContent = certificateRef.current.cloneNode(true) as HTMLDivElement;
      
      // Remove any interactive elements and add print-specific styles
      const buttons = printContent.querySelectorAll('button');
      buttons.forEach(button => button.remove());
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Certificate - ${formData.studentName}</title>
              <meta charset="UTF-8">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
                
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                @media print {
                  @page {
                    size: A4 landscape;
                    margin: 0;
                  }
                  
                  body {
                    margin: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  .no-print {
                    display: none !important;
                  }
                }
                
                body {
                  font-family: 'Inter', sans-serif;
                  background: white;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  padding: 20px;
                }
                
                .certificate-container {
                  width: 100%;
                  max-width: 297mm;
                  min-height: 210mm;
                  padding: 40px;
                  position: relative;
                }
                
                .print-only {
                  display: block !important;
                }
                
                .screen-only {
                  display: none !important;
                }
              </style>
            </head>
            <body>
              <div class="certificate-container">
                ${printContent.innerHTML}
              </div>
              <script>
                window.onload = function() {
                  window.focus();
                  setTimeout(() => {
                    window.print();
                    setTimeout(() => window.close(), 1000);
                  }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const generatePDF = async () => {
    if (!certificateRef.current) {
      toast.error('Certificate preview not available');
      return;
    }

    toast.loading('Generating PDF...');
    
    try {
      // Clone the certificate for PDF generation
      const certificateClone = certificateRef.current.cloneNode(true) as HTMLDivElement;
      
      // Add PDF-specific styles
      certificateClone.style.padding = '40px';
      certificateClone.style.maxWidth = '100%';
      
      const canvas = await html2canvas(certificateClone, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const certificateDiv = clonedDoc.getElementById('certificate-preview');
          if (certificateDiv) {
            certificateDiv.style.width = '297mm';
            certificateDiv.style.height = '210mm';
            certificateDiv.style.padding = '40px';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add certificate image
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      
      // Add metadata
      pdf.setProperties({
        title: `Certificate - ${formData.studentName}`,
        subject: certificateTypes.find(t => t.value === formData.type)?.label || 'Certificate',
        author: 'AI School ERP',
        keywords: 'certificate, school, education',
        creator: 'AI School ERP Certificate System'
      });
      
      const fileName = `Certificate_${formData.studentName.replace(/\s+/g, '_')}_${certificateId}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleGenerate = () => {
    if (!formData.studentName.trim() || !formData.course.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success('Certificate generated successfully!');
    
    // In a real app, you would save to backend here
    const newCertificate = {
      id: certificateId,
      student: formData.studentName,
      studentId: formData.studentId,
      type: certificateTypes.find(t => t.value === formData.type)?.label || formData.type,
      date: formData.date,
      status: 'verified' as const,
      course: formData.course,
      reason: formData.reason
    };

    // Add to history (in real app, this would be API call)
    issuedCertificates.unshift(newCertificate);
    
    toast.info('Certificate saved to history');
  };

  const getCertificateText = () => {
    switch(formData.type) {
      case 'study':
        return `This is to certify that ${formData.studentName} (Student ID: ${formData.studentId}, Roll No: ${formData.rollNumber}) has successfully completed ${formData.course} for the academic year ${formData.academicYear} with ${formData.percentage} marks and ${formData.attendance} attendance.`;
      case 'medical':
        return `This is to certify that ${formData.studentName} is medically certified to be suffering from ${formData.reason} and is granted leave from ${formData.validFrom} to ${formData.validTo}.`;
      case 'transfer':
        return `This is to certify that ${formData.studentName} has studied in ${formData.course} during the academic year ${formData.academicYear} and his/her conduct has been satisfactory. This certificate is issued for the purpose of transfer to another institution.`;
      case 'character':
        return `This is to certify that ${formData.studentName} has been a student of this institution from ${formData.academicYear}. During this period, his/her conduct and character have been exemplary and commendable.`;
      case 'sports':
      case 'merit':
        return `This is to certify that ${formData.studentName} has shown outstanding performance in ${formData.reason} during the academic year ${formData.academicYear} while studying in ${formData.course}.`;
      case 'bonafide':
        return `This is to certify that ${formData.studentName} is a bonafide student of this institution studying in ${formData.course} for the academic year ${formData.academicYear}.`;
      case 'conduct':
        return `This is to certify that ${formData.studentName} has maintained excellent conduct and discipline during his/her studies in ${formData.course} for the academic year ${formData.academicYear}.`;
      default:
        return `This is to certify that ${formData.studentName} has been associated with our institution.`;
    }
  };

  return (
   
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Certificates & Documents</h1>
            <p className="text-muted-foreground text-sm md:text-base">Generate, manage, and verify official school documents</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveTab('history')}>
              <History className="h-4 w-4 mr-2" />
              View History
            </Button>
            <Button size="sm" onClick={() => setActiveTab('generate')}>
              <FileSignature className="h-4 w-4 mr-2" />
              New Certificate
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Issued"
            value={issuedCertificates.length.toString()}
            subtitle="This academic year"
            icon={FileText}
            variant="primary"
          />
          <StatCard
            title="Verified"
            value="98%"
            subtitle="Authenticity rate"
            icon={ShieldCheck}
            variant="success"
          />
          <StatCard
            title="Certificate Types"
            value={certificateTypes.length.toString()}
            subtitle="Available formats"
            icon={Award}
            variant="warning"
          />
          <StatCard
            title="Pending"
            value={issuedCertificates.filter(c => c.status === 'pending').length.toString()}
            subtitle="Awaiting approval"
            icon={History}
            variant="default"
          />
        </div>

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="generate" className="text-xs md:text-sm">
              <FileSignature className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              Generate New
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs md:text-sm">
              <History className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              History & Logs
            </TabsTrigger>
            <TabsTrigger value="verify" className="text-xs md:text-sm">
              <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              Verify
            </TabsTrigger>
          </TabsList>

          {/* GENERATE TAB */}
          <TabsContent value="generate" className="space-y-4 md:space-y-6">
            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
              
              {/* Left: Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Certificate Details</CardTitle>
                  <CardDescription className="text-sm md:text-base">Fill in student details to generate certificate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName" className="text-sm font-medium">Student Name *</Label>
                    <Input 
                      id="studentName"
                      value={formData.studentName} 
                      onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                      placeholder="Enter student full name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="studentId" className="text-sm font-medium">Student ID</Label>
                      <Input 
                        id="studentId"
                        value={formData.studentId} 
                        onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                        placeholder="STU-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber" className="text-sm font-medium">Roll Number</Label>
                      <Input 
                        id="rollNumber"
                        value={formData.rollNumber} 
                        onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                        placeholder="1024"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certificateType" className="text-sm font-medium">Certificate Type *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(val) => setFormData({...formData, type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select certificate type" />
                      </SelectTrigger>
                      <SelectContent>
                        {certificateTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course" className="text-sm font-medium">Class / Course *</Label>
                    <Input 
                      id="course"
                      value={formData.course} 
                      onChange={(e) => setFormData({...formData, course: e.target.value})}
                      placeholder="Class 10 (Section A)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="academicYear" className="text-sm font-medium">Academic Year</Label>
                    <Input 
                      id="academicYear"
                      value={formData.academicYear} 
                      onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                      placeholder="2024-2025"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">Purpose / Reason *</Label>
                    <Textarea 
                      id="reason"
                      value={formData.reason} 
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      placeholder="Describe the purpose of this certificate"
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-medium">Issue Date</Label>
                      <Input 
                        id="date"
                        type="date"
                        value={formData.date} 
                        onChange={(e) => setFormData({...formData, date: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validTo" className="text-sm font-medium">Valid Until</Label>
                      <Input 
                        id="validTo"
                        type="date"
                        value={formData.validTo} 
                        onChange={(e) => setFormData({...formData, validTo: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes" className="text-sm font-medium">Additional Notes</Label>
                    <Textarea 
                      id="additionalNotes"
                      value={formData.additionalNotes} 
                      onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                      placeholder="Any additional information or remarks"
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <Button className="w-full mt-2" onClick={handleGenerate}>
                    <FileSignature className="h-4 w-4 mr-2" />
                    Generate Certificate
                  </Button>
                </CardContent>
              </Card>

              {/* Right: Live Preview */}
              <div className="lg:col-span-2">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <CardTitle>Live Preview</CardTitle>
                          <CardDescription className="text-sm">
                            Real-time preview of your certificate
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
                            <Printer className="h-4 w-4 mr-2"/>
                            Print
                          </Button>
                          <Button variant="outline" size="sm" onClick={generatePDF} className="no-print">
                            <Download className="h-4 w-4 mr-2"/>
                            Download PDF
                          </Button>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="flex-1 bg-gradient-to-br from-muted/10 to-muted/20 p-3 md:p-6 overflow-auto">
                    
                    {/* CERTIFICATE TEMPLATE - Optimized for Print/PDF */}
                    <div 
                      id="certificate-preview"
                      ref={certificateRef}
                      className="bg-white p-4 md:p-8 w-full mx-auto border-8 border-double border-primary/40 text-center relative shadow-lg print:shadow-none print:border-4"
                      style={{
                        minHeight: '210mm',
                        maxWidth: '297mm'
                      }}
                    >
                      {/* Watermark */}
                      <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none">
                        <div className="text-[100px] md:text-[120px] font-bold rotate-45 text-primary">
                          AI SCHOOL ERP
                        </div>
                      </div>

                      {/* Decorative Border */}
                      <div className="absolute top-3 md:top-6 left-3 md:left-6 right-3 md:right-6 bottom-3 md:bottom-6 border-2 border-primary/20 pointer-events-none"></div>
                      <div className="absolute top-1 md:top-2 left-1 md:left-2 right-1 md:right-2 bottom-1 md:bottom-2 border border-primary/10 pointer-events-none"></div>

                      {/* School Header */}
                      <div className="mb-6 md:mb-8">
                        <div className="flex flex-col items-center mb-4">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                            <School className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                          </div>
                          <div className="text-center">
                            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-wider">AI SCHOOL ERP</h1>
                            <p className="text-muted-foreground text-sm md:text-base italic mt-1">
                              Empowering Education Through Technology
                            </p>
                          </div>
                        </div>
                        <Separator className="my-2 md:my-4" />
                      </div>

                      {/* Certificate Title */}
                      <div className="mb-6 md:mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-primary tracking-wide uppercase mb-2">
                          {certificateTypes.find(t => t.value === formData.type)?.label || 'CERTIFICATE'}
                        </h2>
                        <p className="text-muted-foreground italic text-sm md:text-base">
                          This certificate is proudly awarded to
                        </p>
                      </div>

                      {/* Student Name */}
                      <div className="my-6 md:my-10 py-4 md:py-6 border-y border-primary/20">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-wide mb-2">
                          {formData.studentName}
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">
                          Student ID: {formData.studentId} | Roll No: {formData.rollNumber}
                        </p>
                      </div>

                      {/* Certificate Body */}
                      <div className="my-6 md:my-10">
                        <div className="text-base md:text-lg leading-relaxed max-w-3xl mx-auto space-y-4">
                          <p className="font-medium">
                            {getCertificateText()}
                          </p>
                          
                          {formData.additionalNotes && (
                            <div className="mt-4 p-3 md:p-4 bg-muted/20 rounded-lg border border-muted/30">
                              <p className="italic text-sm md:text-base">"{formData.additionalNotes}"</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="mt-8 md:mt-12 grid grid-cols-3 gap-4 md:gap-8">
                        <div className="text-center">
                          <div className="h-px bg-foreground/50 w-24 md:w-32 mx-auto mb-3 md:mb-4"></div>
                          <p className="font-semibold text-sm md:text-base">Class Teacher</p>
                          <p className="text-xs text-muted-foreground mt-1">Signature</p>
                        </div>
                        <div className="text-center">
                          <div className="h-px bg-foreground/50 w-24 md:w-32 mx-auto mb-3 md:mb-4"></div>
                          <p className="font-semibold text-sm md:text-base">Principal</p>
                          <p className="text-xs text-muted-foreground mt-1">AI School ERP</p>
                        </div>
                        <div className="text-center">
                          <div className="h-px bg-foreground/50 w-24 md:w-32 mx-auto mb-3 md:mb-4"></div>
                          <p className="font-semibold text-sm md:text-base">
                            Date: <span className="font-normal">{new Date(formData.date).toLocaleDateString('en-GB')}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Valid until: {new Date(formData.validTo).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-8 md:mt-12 pt-4 md:pt-6 border-t border-primary/20">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="text-left">
                            <p className="text-xs md:text-sm font-mono font-medium">
                              Certificate ID: {certificateId}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Verified Online: verify.aischoolerp.com/certificates/{certificateId}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Issued by: AI School ERP Management System
                            </p>
                          </div>
                          <div className="flex flex-col items-center">
                            {qrCodeDataUrl ? (
                              <img 
                                src={qrCodeDataUrl} 
                                alt="QR Code" 
                                className="h-16 w-16 md:h-20 md:w-20"
                              />
                            ) : (
                              <div className="h-16 w-16 md:h-20 md:w-20 border border-dashed border-muted-foreground/30 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">QR Code</span>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Scan to verify</p>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Seal */}
                      <div className="absolute bottom-4 right-4 opacity-80 hidden md:block">
                        <div className="w-16 h-16 rounded-full border-4 border-primary/30 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full border-2 border-primary/50 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary/70">SEAL</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        Note: This is a preview. The actual printed/PDF certificate will have higher quality.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg md:text-xl">Issued Certificates</CardTitle>
                    <CardDescription>View and manage all issued certificates</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search certificates..." 
                        className="pl-10 w-full sm:w-[250px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[120px]">Certificate ID</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Class/Course</TableHead>
                          <TableHead className="w-[100px]">Date</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCertificates.map((cert) => (
                          <TableRow key={cert.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs">{cert.id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{cert.student}</p>
                                <p className="text-xs text-muted-foreground">{cert.studentId}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const type = certificateTypes.find(t => t.label === cert.type);
                                  const Icon = type?.icon || FileText;
                                  return <Icon className="h-4 w-4 text-primary" />;
                                })()}
                                <span className="text-sm">{cert.type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{cert.course}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{cert.date}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(cert.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={cert.status === 'verified' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {cert.status === 'verified' ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <History className="h-3 w-3 mr-1" />
                                )}
                                {cert.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon-sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon-sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VERIFY TAB */}
          <TabsContent value="verify">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Certificate Verification</CardTitle>
                  <CardDescription>
                    Enter the Certificate ID found on the document to verify its authenticity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="verifyId">Certificate ID</Label>
                      <Input 
                        id="verifyId"
                        placeholder="Enter Certificate ID (e.g. CERT-2024-001)" 
                        className="text-center text-lg font-mono tracking-wider uppercase mt-2"
                        value={verifyId}
                        onChange={(e) => {
                          setVerifyId(e.target.value);
                          setVerificationResult('idle');
                        }}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Find the Certificate ID at the bottom of your certificate document
                      </p>
                    </div>
                    
                    <Button className="w-full" onClick={handleVerify}>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Verify Certificate
                    </Button>
                  </div>

                  {/* Verification Result */}
                  {verificationResult === 'valid' && verifiedCertificate && (
                    <div className="rounded-lg border-2 border-success bg-success/5 p-6 text-center animate-in fade-in duration-500">
                      <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                      <h3 className="font-bold text-success text-xl mb-2">✅ Valid Certificate</h3>
                      <p className="text-muted-foreground mb-4">
                        This certificate is authentic and was issued by AI School ERP
                      </p>
                      
                      <div className="bg-white p-4 rounded-lg border space-y-3 text-left">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Student:</span>
                          <span className="font-medium">{verifiedCertificate.student}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Certificate Type:</span>
                          <span className="font-medium">{verifiedCertificate.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date Issued:</span>
                          <span className="font-medium">{verifiedCertificate.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="default" className="bg-success/20 text-success">
                            Verified
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {verificationResult === 'invalid' && (
                    <div className="rounded-lg border-2 border-destructive bg-destructive/5 p-6 text-center animate-in fade-in duration-500">
                      <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                      <h3 className="font-bold text-destructive text-xl mb-2">❌ Invalid Certificate</h3>
                      <p className="text-muted-foreground mb-4">
                        We could not find any record matching this Certificate ID
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Please check the ID and try again. If you believe this is an error, contact the school administration.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    
  );
}