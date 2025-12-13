import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  QrCode, 
  CheckCircle, 
  XCircle, 
  Search, 
  Award,
  ShieldCheck,
  History
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Separator } from '@/components/ui/separator';

// Mock Data: Issued Certificates
const issuedCertificates = [
  { id: 'CERT-2024-001', student: 'Arjun Verma', type: 'Merit Certificate', date: '2024-11-15', status: 'verified' },
  { id: 'CERT-2024-002', student: 'Priya Patel', type: 'Sports Achievement', date: '2024-11-10', status: 'verified' },
  { id: 'CERT-2024-003', student: 'Rohit Sharma', type: 'Character Certificate', date: '2024-11-05', status: 'pending' },
  { id: 'CERT-2024-004', student: 'Kavya Singh', type: 'School Leaving', date: '2024-10-28', status: 'verified' },
];

export default function Certificates() {
  const [activeTab, setActiveTab] = useState('generate');
  
  // State for Generator
  const [formData, setFormData] = useState({
    studentName: 'Arjun Verma',
    course: 'Class 10',
    type: 'Merit Certificate',
    date: new Date().toISOString().split('T')[0],
    reason: 'Outstanding Performance in Mathematics'
  });

  // State for Verification
  const [verifyId, setVerifyId] = useState('');
  const [verificationResult, setVerificationResult] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const handleVerify = () => {
    if (!verifyId) return;
    // Mock logic: ID starting with "CERT" is valid
    if (verifyId.startsWith('CERT')) {
      setVerificationResult('valid');
    } else {
      setVerificationResult('invalid');
    }
  };

  return (
   
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Certificates & Documents</h1>
            <p className="text-muted-foreground">Generate, manage, and verify official documents</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              View Logs
            </Button>
            <Button>
              <Award className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Issued"
            value="1,240"
            subtitle="All time"
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
            title="Templates"
            value="12"
            subtitle="Active formats"
            icon={Award}
            variant="warning"
          />
          <StatCard
            title="Pending Requests"
            value="5"
            subtitle="Need approval"
            icon={History}
            variant="default"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="generate">Generate New</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="verify">Verify Document</TabsTrigger>
          </TabsList>

          {/* GENERATE TAB */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Left: Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Certificate Details</CardTitle>
                  <CardDescription>Enter details to preview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Student Name</label>
                    <Input 
                      value={formData.studentName} 
                      onChange={(e) => setFormData({...formData, studentName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Certificate Type</label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(val) => setFormData({...formData, type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Merit Certificate">Merit Certificate</SelectItem>
                        <SelectItem value="Sports Achievement">Sports Achievement</SelectItem>
                        <SelectItem value="Character Certificate">Character Certificate</SelectItem>
                        <SelectItem value="School Leaving">School Leaving</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Class / Course</label>
                    <Input 
                      value={formData.course} 
                      onChange={(e) => setFormData({...formData, course: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Achievement / Reason</label>
                    <Input 
                      value={formData.reason} 
                      onChange={(e) => setFormData({...formData, reason: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date of Issue</label>
                    <Input 
                      type="date"
                      value={formData.date} 
                      onChange={(e) => setFormData({...formData, date: e.target.value})} 
                    />
                  </div>
                  <Button className="w-full mt-4">Generate & Save</Button>
                </CardContent>
              </Card>

              {/* Right: Live Preview */}
              <div className="lg:col-span-2">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-2">
                     <div className="flex justify-between">
                        <CardTitle>Live Preview</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2"/> Print</Button>
                          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2"/> PDF</Button>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="flex-1 bg-muted/20 p-8 flex justify-center items-center">
                    
                    {/* CERTIFICATE TEMPLATE */}
                    <div className="bg-white p-8 md:p-12 w-full max-w-2xl border-4 border-double border-primary/40 text-center relative shadow-lg">
                      {/* Decorative Corners */}
                      <div className="absolute top-2 left-2 w-16 h-16 border-t-4 border-l-4 border-primary"></div>
                      <div className="absolute top-2 right-2 w-16 h-16 border-t-4 border-r-4 border-primary"></div>
                      <div className="absolute bottom-2 left-2 w-16 h-16 border-b-4 border-l-4 border-primary"></div>
                      <div className="absolute bottom-2 right-2 w-16 h-16 border-b-4 border-r-4 border-primary"></div>

                      <div className="space-y-6">
                         {/* Header */}
                         <div>
                           <div className="flex justify-center mb-4">
                             <Award className="h-12 w-12 text-primary" />
                           </div>
                           <h2 className="text-3xl font-serif font-bold text-primary tracking-wide uppercase">Certificate of Appreciation</h2>
                           <p className="text-muted-foreground mt-2 font-serif italic">This certificate is proudly presented to</p>
                         </div>

                         {/* Name */}
                         <div className="py-4">
                           <h1 className="text-4xl font-serif font-bold text-foreground border-b-2 border-primary/20 inline-block px-12 pb-2">
                             {formData.studentName}
                           </h1>
                         </div>

                         {/* Body */}
                         <div className="space-y-2">
                           <p className="text-lg">For outstanding performance in <strong>{formData.course}</strong></p>
                           <p className="text-muted-foreground max-w-md mx-auto">
                             We acknowledge the dedication and hard work shown in <strong>{formData.reason}</strong> during the academic year 2024-2025.
                           </p>
                         </div>

                         {/* Footer */}
                         <div className="grid grid-cols-2 gap-12 mt-12 pt-8">
                           <div className="text-center">
                             <div className="h-px bg-foreground/50 w-full mb-2"></div>
                             <p className="font-serif font-bold">Principal Signature</p>
                           </div>
                           <div className="text-center">
                             <div className="h-px bg-foreground/50 w-full mb-2"></div>
                             <p className="font-serif font-bold">Date: {formData.date}</p>
                           </div>
                         </div>

                         {/* QR Placeholder */}
                         <div className="absolute bottom-8 right-1/2 translate-x-1/2 opacity-20">
                            <QrCode className="h-24 w-24" />
                         </div>
                      </div>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Issued Certificates Log</CardTitle>
                  <Input placeholder="Search logs..." className="max-w-sm" />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date Issued</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuedCertificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-mono text-xs">{cert.id}</TableCell>
                        <TableCell className="font-medium">{cert.student}</TableCell>
                        <TableCell>{cert.type}</TableCell>
                        <TableCell>{cert.date}</TableCell>
                        <TableCell>
                          <Badge variant={cert.status === 'verified' ? 'success' : 'secondary'}>
                            {cert.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon-sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VERIFY TAB */}
          <TabsContent value="verify">
            <div className="max-w-2xl mx-auto mt-8">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Certificate Verification</CardTitle>
                  <CardDescription>
                    Enter the Certificate ID found on the document to verify its authenticity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Enter Certificate ID (e.g. CERT-2024-001)" 
                      className="text-center text-lg tracking-widest uppercase"
                      value={verifyId}
                      onChange={(e) => {
                        setVerifyId(e.target.value);
                        setVerificationResult('idle');
                      }}
                    />
                  </div>
                  <Button size="lg" className="w-full" onClick={handleVerify}>
                    Verify Document
                  </Button>

                  {/* Verification Result Area */}
                  {verificationResult === 'valid' && (
                     <div className="rounded-lg border border-success bg-success/5 p-4 text-center animate-scale-in">
                       <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                       <h3 className="font-bold text-success text-lg">Valid Certificate</h3>
                       <p className="text-muted-foreground text-sm">This document was issued by AI School ERP on Nov 15, 2024.</p>
                     </div>
                  )}

                  {verificationResult === 'invalid' && (
                     <div className="rounded-lg border border-destructive bg-destructive/5 p-4 text-center animate-scale-in">
                       <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                       <h3 className="font-bold text-destructive text-lg">Invalid Certificate</h3>
                       <p className="text-muted-foreground text-sm">We could not find a record matching this ID.</p>
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