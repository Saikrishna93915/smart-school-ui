import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Wallet,
  Building,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Search,
  Printer,
  Mail,
  FileText,
  IndianRupee,
  Receipt,
  FileSignature,
  Percent,
  Loader2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { FinanceService } from '@/Services/finance.service';
import type { Student } from '@/types/student';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

// Define a universal student interface that handles both structures
interface UniversalStudent {
  // Direct properties (new structure)
  _id: string;
  id?: string;
  admissionNumber: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  class?: {
    className: string;
    section: string;
    academicYear?: string;
  };
  className?: string;
  section?: string;
  parents?: {
    father: {
      name: string;
      phone: string;
      email?: string;
    };
    mother?: {
      name: string;
      phone: string;
      email?: string;
    };
  };
  parentName?: string;
  fatherName?: string;
  phone?: string;
  contact?: string;
  email?: string;
  
  // Nested properties (old structure)
  student?: {
    firstName: string;
    lastName: string;
    name?: string;
  };
  // For old structure compatibility
  admissionNo?: string;
  fullName?: string;
  parentPhone?: string;
  [key: string]: any;
}

const RecordPayment = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UniversalStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UniversalStudent | null>(null);
  const [studentFeeDetails, setStudentFeeDetails] = useState<any>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // School Information
  const schoolInfo = {
    name: "AI School ERP",
    address: "123 Education Street, Smart City, Karnataka 560001",
    phone: "+91 98765 43210",
    email: "accounts@aischoolerp.edu.in",
    principal: "Dr. S. Krishnan",
    registrationNo: "REG-EDU-2024-001",
    gstin: "29AAACI0000A1Z5"
  };

  // Helper function to extract student name from any structure
  const getStudentName = (student: UniversalStudent | null): string => {
    if (!student) return 'Unknown Student';
    
    // Try nested structure first (old format)
    if (student.student?.firstName || student.student?.lastName) {
      return `${student.student.firstName || ''} ${student.student.lastName || ''}`.trim();
    }
    
    // Try direct properties (new format)
    if (student.name) return student.name;
    if (student.fullName) return student.fullName;
    if (student.firstName || student.lastName) {
      return `${student.firstName || ''} ${student.lastName || ''}`.trim();
    }
    
    return 'Unknown Student';
  };

  // Helper function to extract class name
  const getClassName = (student: UniversalStudent | null): string => {
    if (!student) return 'N/A';
    
    // Try nested structure (old format)
    if (student.class?.className) return student.class.className;
    
    // Try direct properties
    if (student.className) return student.className;
    
    return 'N/A';
  };

  // Helper function to extract section
  const getSection = (student: UniversalStudent | null): string => {
    if (!student) return 'A';
    
    // Try nested structure (old format)
    if (student.class?.section) return student.class.section;
    
    // Try direct properties
    if (student.section) return student.section;
    
    return 'A';
  };

  // Helper function to extract parent name
  const getParentName = (student: UniversalStudent | null): string => {
    if (!student) return 'N/A';
    
    // Try nested structure (old format)
    if (student.parents?.father?.name) return student.parents.father.name;
    
    // Try direct properties
    if (student.parentName) return student.parentName;
    if (student.fatherName) return student.fatherName;
    
    return 'N/A';
  };

  // Helper function to extract parent phone
  const getParentPhone = (student: UniversalStudent | null): string => {
    if (!student) return 'N/A';
    
    // Try nested structure (old format)
    if (student.parents?.father?.phone) return student.parents.father.phone;
    
    // Try direct properties
    if (student.phone) return student.phone;
    if (student.contact) return student.contact;
    if (student.parentPhone) return student.parentPhone;
    
    return 'N/A';
  };

  // Helper function to extract admission number
  const getAdmissionNumber = (student: UniversalStudent | null): string => {
    if (!student) return 'N/A';
    return student.admissionNumber || student.admissionNo || 'N/A';
  };

  // Search for students whenever search term changes
  useEffect(() => {
    const searchStudents = async () => {
      if (searchTerm.length >= 2) {
        setIsLoadingStudents(true);
        setError(null);
        
        try {
          console.log('🔍 Searching for:', searchTerm);
          
          // Use the FinanceService
          const response = await FinanceService.searchStudents(searchTerm);
          console.log('🔍 FinanceService response:', response);
          
          let students: UniversalStudent[] = [];
          
          if (response) {
            // Handle different response structures
            if (Array.isArray(response)) {
              students = response;
            } else if (response.data && Array.isArray(response.data)) {
              students = response.data;
            } else if (response.students && Array.isArray(response.students)) {
              students = response.students;
            } else if (response.success && response.data) {
                if (Array.isArray(response.data)) {
                  students = response.data;
                } else if (response.data !== null && typeof response.data === 'object') {
                  // Look for arrays in the data object (guard against null)
                  Object.keys(response.data).forEach(key => {
                    const val = (response.data as any)[key];
                    if (Array.isArray(val)) {
                      students = val;
                    }
                  });
                }
              }
          }
          
          // Ensure we have valid student objects
          students = students.filter(student => 
            student && typeof student === 'object' && 
            (student._id || student.id || getAdmissionNumber(student) || getStudentName(student))
          );
          
          console.log(`✅ Found ${students.length} students`);
          
          // Log first student structure for debugging
          if (students.length > 0) {
            console.log('📋 First student structure:', students[0]);
            console.log('👤 Name extraction test:', {
              nestedName: students[0].student?.firstName + ' ' + students[0].student?.lastName,
              directName: students[0].name,
              fullName: students[0].fullName,
              firstName: students[0].firstName,
              lastName: students[0].lastName,
              finalName: getStudentName(students[0])
            });
          }
          
          setSearchResults(students);
          
          if (students.length === 0 && searchTerm.length >= 2) {
            setError(`No students found for "${searchTerm}"`);
          }
          
        } catch (err: any) {
          console.error("❌ Failed to search students:", err);
          setError(err.message || "Failed to search students. Please try again.");
          setSearchResults([]);
        } finally {
          setIsLoadingStudents(false);
        }
      } else {
        setSearchResults([]);
        setError(null);
      }
    };

    const debounceTimer = setTimeout(searchStudents, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Fetch student fee details when a student is selected
  useEffect(() => {
    const fetchFeeDetails = async () => {
      if (selectedStudent) {
        try {
          const admissionNumber = getAdmissionNumber(selectedStudent);
          console.log('💰 Fetching fee details for:', admissionNumber);
          
          const response = await FinanceService.getStudentFeeDetails(admissionNumber);
          console.log('💰 Fee details response:', response);
          
          let feeData = null;
          
          if (response && (response.success || response.data)) {
            // Normalize response to the underlying data object (guard against ApiResponse wrappers)
            const normalized: any = (response as any).data ?? response;
            feeData = normalized;
            
            // Extract total dues from various possible structures using safe any-based access
            let totalDues = 0;
            
            const maybeTotal = normalized && (
              (normalized.totalDues !== undefined && normalized.totalDues) ||
              normalized.summary?.totalDue ||
              normalized.feeStructure?.totalDue ||
              normalized.feeSummary?.totalDue
            );
            
            if (typeof maybeTotal === 'number' && maybeTotal > 0) {
              totalDues = maybeTotal;
            } else if (typeof maybeTotal === 'string' && !Number.isNaN(Number(maybeTotal))) {
              totalDues = parseFloat(maybeTotal);
            }
            
            if (totalDues > 0) {
              console.log(`💰 Setting default amount: ${totalDues}`);
              setFormData(prev => ({
                ...prev,
                amount: totalDues.toString()
              }));
            }
          }
          
          setStudentFeeDetails(feeData);
          
        } catch (err: any) {
          console.error("❌ Failed to fetch fee details:", err);
          toast({
            title: "Error",
            description: "Failed to load fee details for this student.",
            variant: "destructive",
          });
        }
      }
    };

    if (selectedStudent) {
      fetchFeeDetails();
    }
  }, [selectedStudent, toast]);

  const [formData, setFormData] = useState({
    studentId: '',
    admissionNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    referenceNo: '',
    transactionId: '',
    bankName: '',
    chequeNo: '',
    chequeDate: '',
    utrNo: '',
    upiId: '',
    amount: '',
    discount: '',
    discountReason: '',
    lateFee: '',
    lateFeeReason: '',
    netAmount: '',
    description: '',
    feesPaid: [] as any[],
    sendReceipt: true,
    sendSMS: true,
    sendEmail: true,
    printReceipt: true
  });

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: Wallet, requiresRef: false },
    { value: 'cheque', label: 'Cheque', icon: FileSignature, requiresRef: true },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building, requiresRef: true },
    { value: 'upi', label: 'UPI', icon: Smartphone, requiresRef: true },
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard, requiresRef: true },
    { value: 'online', label: 'Online Payment', icon: Smartphone, requiresRef: true }
  ];

  // Calculate net amount whenever amount, discount, or late fee changes
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const lateFee = parseFloat(formData.lateFee) || 0;
    const netAmount = amount - discount + lateFee;
    
    setFormData(prev => ({
      ...prev,
      netAmount: netAmount > 0 ? netAmount.toFixed(2) : ''
    }));
  }, [formData.amount, formData.discount, formData.lateFee]);

  const handleStudentSelect = async (student: UniversalStudent) => {
    console.log('👤 Student selected:', student);
    console.log('📋 Student details:', {
      name: getStudentName(student),
      admissionNumber: getAdmissionNumber(student),
      class: getClassName(student),
      section: getSection(student),
      parentName: getParentName(student),
      parentPhone: getParentPhone(student)
    });
    
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      studentId: student._id || student.id || '',
      admissionNumber: getAdmissionNumber(student)
    }));
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
  };

  const handleFeeSelection = (feeType: string, checked: boolean) => {
    if (!studentFeeDetails) return;

    // Find fee breakdown from different possible structures
    const feeBreakdown = studentFeeDetails.feeBreakdown || 
                        studentFeeDetails.data?.feeBreakdown || 
                        studentFeeDetails.fees || 
                        studentFeeDetails.feeStructure?.breakdown ||
                        [];
    
    const fee = feeBreakdown.find((f: any) => f.type === feeType || f.name === feeType);
    if (!fee) return;

    setFormData(prev => {
      let updatedFees = [...prev.feesPaid];
      if (checked) {
        updatedFees.push(fee);
      } else {
        updatedFees = updatedFees.filter(f => f.type !== feeType && f.name !== feeType);
      }
      
      // Calculate total amount from selected fees
      const totalAmount = updatedFees.reduce((sum, f) => sum + (f.amount || f.value || 0), 0);
      
      return {
        ...prev,
        feesPaid: updatedFees,
        amount: totalAmount.toString()
      };
    });
  };

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please select a student and enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Prepare payment data
      const paymentData = {
        studentId: selectedStudent._id || selectedStudent.id,
        admissionNumber: getAdmissionNumber(selectedStudent),
        studentName: getStudentName(selectedStudent),
        className: getClassName(selectedStudent),
        section: getSection(selectedStudent),
        parentName: getParentName(selectedStudent),
        parentPhone: getParentPhone(selectedStudent),
        parentEmail: selectedStudent.parents?.father?.email || selectedStudent.email || '',
        
        // Payment details
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        amount: parseFloat(formData.amount),
        discount: parseFloat(formData.discount) || 0,
        discountReason: formData.discountReason,
        lateFee: parseFloat(formData.lateFee) || 0,
        lateFeeReason: formData.lateFeeReason,
        netAmount: parseFloat(formData.netAmount),
        description: formData.description,
        
        // Payment method specific details
        referenceNo: formData.referenceNo,
        transactionId: formData.transactionId,
        bankName: formData.bankName,
        chequeNo: formData.chequeNo,
        chequeDate: formData.chequeDate,
        utrNo: formData.utrNo,
        upiId: formData.upiId,
        
        // Fees paid
        feesPaid: formData.feesPaid,
        
        // Notification preferences
        sendReceipt: formData.sendReceipt,
        sendSMS: formData.sendSMS,
        sendEmail: formData.sendEmail,
        printReceipt: formData.printReceipt
      };

      console.log('💸 Submitting payment data:', paymentData);
      
      // Call API to record payment
      const response = await FinanceService.recordPayment(paymentData);
      console.log('💸 Payment response:', response);
      
      // Extract receipt number
      let receiptNumber = `REC-${Date.now().toString().slice(-8)}`;
      
      if (response) {
        if (response.success && response.data) {
          receiptNumber = response.data.receiptNumber || 
                         response.data.receiptNo || 
                         response.receiptNumber ||
                         receiptNumber;
        } else {
          receiptNumber = response.receiptNumber || receiptNumber;
        }
      }
      
      // Show success message with receipt details
      toast({
        title: "Payment Recorded Successfully!",
        description: `Receipt Number: ${receiptNumber}\nAmount: ₹${parseFloat(formData.amount).toLocaleString()}`,
        variant: "default",
      });
      
      // Reset form
      setSelectedStudent(null);
      setStudentFeeDetails(null);
      setFormData({
        studentId: '',
        admissionNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        referenceNo: '',
        transactionId: '',
        bankName: '',
        chequeNo: '',
        chequeDate: '',
        utrNo: '',
        upiId: '',
        amount: '',
        discount: '',
        discountReason: '',
        lateFee: '',
        lateFeeReason: '',
        netAmount: '',
        description: '',
        feesPaid: [],
        sendReceipt: true,
        sendSMS: true,
        sendEmail: true,
        printReceipt: true
      });
      setStep(1);
      
      // Auto-print receipt if enabled
      if (formData.printReceipt) {
        setTimeout(() => {
          generateAndPrintReceipt(receiptNumber);
        }, 1000);
      }
      
    } catch (error: any) {
      console.error("❌ Failed to record payment:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAndPrintReceipt = (receiptNumber: string) => {
    if (!selectedStudent) return;
    
    const studentName = getStudentName(selectedStudent);
    const className = getClassName(selectedStudent);
    const section = getSection(selectedStudent);
    const parentName = getParentName(selectedStudent);
    const parentPhone = getParentPhone(selectedStudent);
    const admissionNumber = getAdmissionNumber(selectedStudent);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt ${receiptNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .receipt { border: 2px solid #000; padding: 30px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .school-name { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
              .school-info { font-size: 12px; line-height: 1.4; }
              .receipt-title { font-size: 24px; text-align: center; margin: 20px 0; font-weight: bold; }
              .receipt-details { margin: 20px 0; }
              .section { margin: 15px 0; }
              .section-title { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
              .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
              .detail-item { margin: 5px 0; }
              .detail-label { font-weight: bold; }
              .amount-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .amount-table th, .amount-table td { border: 1px solid #000; padding: 8px; text-align: left; }
              .amount-table th { background-color: #f0f0f0; }
              .total-row { font-weight: bold; background-color: #f9f9f9; }
              .amount-words { font-style: italic; margin: 20px 0; padding: 10px; background-color: #f5f5f5; }
              .signature { margin-top: 60px; }
              .signature-line { width: 300px; border-top: 1px solid #000; margin: 40px auto 10px; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <div class="school-name">${schoolInfo.name}</div>
                <div class="school-info">
                  ${schoolInfo.address}<br/>
                  Phone: ${schoolInfo.phone} | Email: ${schoolInfo.email}<br/>
                  Registration No: ${schoolInfo.registrationNo} | GSTIN: ${schoolInfo.gstin}
                </div>
              </div>
              
              <div class="receipt-title">FEE PAYMENT RECEIPT</div>
              
              <div class="receipt-details">
                <div class="section">
                  <div class="section-title">Receipt Details</div>
                  <div class="details-grid">
                    <div class="detail-item"><span class="detail-label">Receipt No:</span> ${receiptNumber}</div>
                    <div class="detail-item"><span class="detail-label">Date:</span> ${new Date(formData.paymentDate).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
                
                <div class="section">
                  <div class="section-title">Student Details</div>
                  <div class="details-grid">
                    <div class="detail-item"><span class="detail-label">Student Name:</span> ${studentName}</div>
                    <div class="detail-item"><span class="detail-label">Admission No:</span> ${admissionNumber}</div>
                    <div class="detail-item"><span class="detail-label">Class:</span> ${className} - ${section}</div>
                    <div class="detail-item"><span class="detail-label">Parent Name:</span> ${parentName}</div>
                    <div class="detail-item"><span class="detail-label">Parent Contact:</span> ${parentPhone}</div>
                  </div>
                </div>
                
                <div class="section">
                  <div class="section-title">Payment Details</div>
                  <div class="details-grid">
                    <div class="detail-item"><span class="detail-label">Payment Method:</span> ${paymentMethods.find(m => m.value === formData.paymentMethod)?.label}</div>
                    <div class="detail-item"><span class="detail-label">Reference No:</span> ${formData.referenceNo || formData.transactionId || formData.chequeNo || formData.utrNo || 'N/A'}</div>
                  </div>
                </div>
                
                <table class="amount-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Fee Amount</td>
                      <td>${parseFloat(formData.amount || '0').toLocaleString('en-IN')}</td>
                    </tr>
                    ${formData.discount ? `
                    <tr>
                      <td>Discount (${formData.discountReason || 'General'})</td>
                      <td>- ${parseFloat(formData.discount).toLocaleString('en-IN')}</td>
                    </tr>
                    ` : ''}
                    ${formData.lateFee ? `
                    <tr>
                      <td>Late Fee (${formData.lateFeeReason || 'Late Payment'})</td>
                      <td>+ ${parseFloat(formData.lateFee).toLocaleString('en-IN')}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                      <td>Total Amount Payable</td>
                      <td>₹ ${parseFloat(formData.netAmount || '0').toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div class="amount-words">
                  <strong>Amount in Words:</strong> ${convertToWords(parseFloat(formData.netAmount || '0'))}
                </div>
                
                <div class="signature">
                  <div class="signature-line"></div>
                  <div style="text-align: center;">
                    <strong>${schoolInfo.principal}</strong><br/>
                    Principal<br/>
                    ${schoolInfo.name}
                  </div>
                  <div style="text-align: center; margin-top: 20px; font-size: 12px;">
                    <em>This is a computer generated receipt. No signature required.</em>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; margin: 10px;">
                Print Receipt
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; cursor: pointer; margin: 10px;">
                Close
              </button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const convertToWords = (num: number): string => {
    if (num === 0) return 'Zero Rupees';
    
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const padded = ('000000000' + Math.floor(Math.abs(num))).slice(-9);
    const n = padded.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    const twoDigitsWords = (s: string) => {
      const val = parseInt(s, 10);
      if (val === 0) return '';
      if (val < 20) return a[val];
      const tens = parseInt(s.charAt(0), 10);
      const ones = parseInt(s.charAt(1), 10);
      return (b[tens] ? b[tens] + ' ' : '') + (a[ones] || '');
    };
    
    let str = '';
    if (Number(n[1]) !== 0) str += `${twoDigitsWords(n[1])}Crore `;
    if (Number(n[2]) !== 0) str += `${twoDigitsWords(n[2])}Lakh `;
    if (Number(n[3]) !== 0) str += `${twoDigitsWords(n[3])}Thousand `;
    if (Number(n[4]) !== 0) str += `${a[Number(n[4])] || ''}Hundred `;
    if (Number(n[5]) !== 0) str += `${str !== '' ? 'and ' : ''}${twoDigitsWords(n[5])}`;
    
    return str.trim() + ' Rupees Only';
  };

  const renderPaymentMethodFields = () => {
    switch (formData.paymentMethod) {
      case 'cheque':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                placeholder="State Bank of India"
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chequeNo">Cheque Number *</Label>
              <Input
                id="chequeNo"
                placeholder="123456"
                value={formData.chequeNo}
                onChange={(e) => handleChange('chequeNo', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chequeDate">Cheque Date</Label>
              <Input
                id="chequeDate"
                type="date"
                value={formData.chequeDate}
                onChange={(e) => handleChange('chequeDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNo">Reference Number</Label>
              <Input
                id="referenceNo"
                placeholder="Optional reference"
                value={formData.referenceNo}
                onChange={(e) => handleChange('referenceNo', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 'bank_transfer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID *</Label>
              <Input
                id="transactionId"
                placeholder="TXN20241115001"
                value={formData.transactionId}
                onChange={(e) => handleChange('transactionId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utrNo">UTR Number *</Label>
              <Input
                id="utrNo"
                placeholder="123456789012"
                value={formData.utrNo}
                onChange={(e) => handleChange('utrNo', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 'upi':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID / Mobile Number *</Label>
              <Input
                id="upiId"
                placeholder="9876543210@upi"
                value={formData.upiId}
                onChange={(e) => handleChange('upiId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="TXN20241115001"
                value={formData.transactionId}
                onChange={(e) => handleChange('transactionId', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 'card':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID *</Label>
              <Input
                id="transactionId"
                placeholder="TXN20241115001"
                value={formData.transactionId}
                onChange={(e) => handleChange('transactionId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNo">Reference Number</Label>
              <Input
                id="referenceNo"
                placeholder="Optional reference"
                value={formData.referenceNo}
                onChange={(e) => handleChange('referenceNo', e.target.value)}
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referenceNo">Reference Number (Optional)</Label>
              <Input
                id="referenceNo"
                placeholder="Receipt/Reference number"
                value={formData.referenceNo}
                onChange={(e) => handleChange('referenceNo', e.target.value)}
              />
            </div>
          </div>
        );
    }
  };

  const renderStudentSearchResults = () => {
    if (isLoadingStudents) {
      return (
        <div className="text-center py-4">
          <Loader2 className="h-5 w-5 inline-block mr-2 animate-spin" />
          <span className="text-sm">Searching students...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-4 text-destructive bg-destructive/10 p-3 rounded">
          <AlertTriangle className="h-5 w-5 inline-block mr-2" />
          <span className="text-sm">{error}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-3 h-7 px-2 text-xs"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      );
    }

    if (searchResults.length === 0 && searchTerm.length >= 2) {
      return (
        <div className="text-center py-4 text-muted-foreground bg-muted/30 p-3 rounded">
          <AlertCircle className="h-5 w-5 inline-block mr-2" />
          <span className="text-sm">No students found for "{searchTerm}"</span>
        </div>
      );
    }

    if (searchResults.length > 0) {
      return (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b">
            Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''}
          </div>
          <div className="p-2">
            {searchResults.map((student, index) => {
              const studentName = getStudentName(student);
              const admissionNumber = getAdmissionNumber(student);
              const className = getClassName(student);
              const section = getSection(student);
              const parentName = getParentName(student);
              const parentPhone = getParentPhone(student);
              
              const initials = studentName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2) || 'ST';
              
              return (
                <div
                  key={student._id || student.id || index}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors duration-150"
                  onClick={() => handleStudentSelect(student)}
                >
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-gray-900">{studentName}</div>
                    <div className="text-xs text-gray-500 truncate">
                      Adm: {admissionNumber} • Class: {className}-{section}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      Parent: {parentName} • {parentPhone}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        const studentName = selectedStudent ? getStudentName(selectedStudent) : '';
        const className = selectedStudent ? getClassName(selectedStudent) : '';
        const section = selectedStudent ? getSection(selectedStudent) : '';
        const parentName = selectedStudent ? getParentName(selectedStudent) : '';
        const parentPhone = selectedStudent ? getParentPhone(selectedStudent) : '';
        const admissionNumber = selectedStudent ? getAdmissionNumber(selectedStudent) : '';
        
        // Extract mother details if available
        const motherName = selectedStudent?.parents?.mother?.name || '';
        const motherPhone = selectedStudent?.parents?.mother?.phone || '';
        
        // Get total dues from fee details
        const totalDues = studentFeeDetails?.totalDues || 
                         studentFeeDetails?.summary?.totalDue || 
                         studentFeeDetails?.feeStructure?.totalDue || 
                         0;
        
        // Get fee breakdown
        const feeBreakdown = studentFeeDetails?.feeBreakdown || 
                           studentFeeDetails?.feeStructure?.breakdown || 
                           [];
        
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Student Search & Selection</h3>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Type at least 2 characters to search
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by Student Name, Admission No, Class, or Parent Name..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="relative mt-1">
                  {renderStudentSearchResults()}
                </div>
              </div>
              
              {selectedStudent && (
                <Card className="mt-6 border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 border-2 border-green-200">
                          <AvatarFallback className="bg-green-100 text-green-700 text-lg font-semibold">
                            {studentName
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-xl text-green-900">
                            {studentName}
                          </div>
                          <div className="text-sm text-green-700">
                            Admission No: {admissionNumber} • Class: {className} - {section}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(null);
                          setStudentFeeDetails(null);
                          setFormData(prev => ({ ...prev, amount: '' }));
                        }}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        Change Student
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Father:</span>
                        <div className="font-medium">{parentName}</div>
                        <div className="text-gray-500">{parentPhone}</div>
                      </div>
                      {motherName && (
                        <div>
                          <span className="text-gray-600">Mother:</span>
                          <div className="font-medium">{motherName}</div>
                          <div className="text-gray-500">{motherPhone}</div>
                        </div>
                      )}
                    </div>
                    
                    {studentFeeDetails && (
                      <div className="mt-6 pt-6 border-t border-green-200">
                        <div className="font-bold text-lg mb-3 text-green-800">Fee Details</div>
                        <div className="space-y-3">
                          {feeBreakdown.map((fee: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  id={`fee-${index}`}
                                  checked={formData.feesPaid.some(f => f.type === (fee.type || fee.name) || f.name === (fee.type || fee.name))}
                                  onCheckedChange={(checked) => handleFeeSelection(fee.type || fee.name, checked as boolean)}
                                />
                                <Label htmlFor={`fee-${index}`} className="cursor-pointer">
                                  <div className="font-medium">{fee.type || fee.name || 'Fee'}</div>
                                  {fee.dueDate && <div className="text-sm text-gray-500">Due: {fee.dueDate}</div>}
                                </Label>
                              </div>
                              <div className="font-bold text-green-700">₹{(fee.amount || fee.value || 0).toLocaleString()}</div>
                            </div>
                          ))}
                          
                          <div className="flex justify-between p-3 border-t pt-4 font-bold text-lg bg-white rounded-lg border border-green-100">
                            <div>Total Dues:</div>
                            <div className="text-amber-600">
                              ₹{totalDues.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="default"
                onClick={() => setStep(2)}
                disabled={!selectedStudent}
                className="px-8"
              >
                Continue to Payment Details
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        const selectedMethod = paymentMethods.find(m => m.value === formData.paymentMethod);
        const requiresRef = selectedMethod?.requiresRef;
        
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Payment Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="text-gray-600"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <Label htmlFor="paymentDate" className="font-medium">Payment Date *</Label>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => handleChange('paymentDate', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="font-medium">Payment Method *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleChange('paymentMethod', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => {
                        const Icon = method.icon;
                        return (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{method.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {requiresRef && (
                <div className="mb-8">
                  <Label className="font-medium mb-4 block">Payment Reference Details *</Label>
                  {renderPaymentMethodFields()}
                </div>
              )}
              
              <div className="mb-8">
                <Label className="font-medium text-lg mb-6 block">Amount Calculation</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-3">
                    <Label htmlFor="amount" className="font-medium">Fee Amount (₹) *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        className="pl-10 text-lg py-6"
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="discount" className="font-medium">Discount (₹)</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="discount"
                        type="number"
                        placeholder="0.00"
                        className="pl-10 text-lg py-6"
                        value={formData.discount}
                        onChange={(e) => handleChange('discount', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="lateFee" className="font-medium">Late Fee (₹)</Label>
                    <Input
                      id="lateFee"
                      type="number"
                      placeholder="0.00"
                      className="text-lg py-6"
                      value={formData.lateFee}
                      onChange={(e) => handleChange('lateFee', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-3">
                    <Label htmlFor="discountReason">Discount Reason (Optional)</Label>
                    <Input
                      id="discountReason"
                      placeholder="e.g., Sibling discount, Early payment"
                      value={formData.discountReason}
                      onChange={(e) => handleChange('discountReason', e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lateFeeReason">Late Fee Reason (Optional)</Label>
                    <Input
                      id="lateFeeReason"
                      placeholder="e.g., Late payment, Installment delay"
                      value={formData.lateFeeReason}
                      onChange={(e) => handleChange('lateFeeReason', e.target.value)}
                    />
                  </div>
                </div>
                
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Net Amount Payable</div>
                        <div className="text-3xl font-bold text-green-600">
                          ₹{parseFloat(formData.netAmount || '0').toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm bg-white p-4 rounded-lg border">
                        <div className="font-medium mb-1">Amount in Words:</div>
                        <div className="text-gray-700 italic">
                          {convertToWords(parseFloat(formData.netAmount || '0'))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="description" className="font-medium">Description / Notes (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional notes or remarks about this payment..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="px-8"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Student
              </Button>
              <Button 
                onClick={() => setStep(3)}
                className="px-8"
              >
                Review & Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        const reviewStudentName = selectedStudent ? getStudentName(selectedStudent) : '';
        const reviewClassName = selectedStudent ? getClassName(selectedStudent) : '';
        const reviewSection = selectedStudent ? getSection(selectedStudent) : '';
        const reviewParentName = selectedStudent ? getParentName(selectedStudent) : '';
        const reviewParentPhone = selectedStudent ? getParentPhone(selectedStudent) : '';
        const reviewParentEmail = selectedStudent?.parents?.father?.email || selectedStudent?.email || '';
        
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-green-900">Ready to Record Payment</h4>
                  <p className="text-green-700">Review all details below before generating receipt</p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Payment Summary</CardTitle>
                <CardDescription>Complete transaction details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Info */}
                <div>
                  <h5 className="font-medium text-gray-600 mb-3">Student Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Student Name</div>
                      <div className="font-bold text-lg">{reviewStudentName}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Admission Number</div>
                      <div className="font-bold text-lg">{getAdmissionNumber(selectedStudent)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Class & Section</div>
                      <div className="font-bold text-lg">{reviewClassName} - {reviewSection}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Parent</div>
                      <div className="font-bold text-lg">{reviewParentName}</div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Payment Details */}
                <div>
                  <h5 className="font-medium text-gray-600 mb-3">Payment Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-lg">
                          {paymentMethods.find(m => m.value === formData.paymentMethod)?.icon &&
                            React.createElement(paymentMethods.find(m => m.value === formData.paymentMethod)!.icon, {
                              className: "h-6 w-6"
                            })}
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Payment Method</div>
                          <div className="font-bold text-lg">
                            {paymentMethods.find(m => m.value === formData.paymentMethod)?.label}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Payment Date</div>
                        <div className="font-bold">{formData.paymentDate}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Reference Number</div>
                      <div className="font-mono bg-gray-100 p-3 rounded-lg">
                        {formData.referenceNo || formData.transactionId || formData.chequeNo || formData.utrNo || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Amount Breakdown */}
                <div>
                  <h5 className="font-medium text-gray-600 mb-3">Amount Breakdown</h5>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <span className="font-medium">Fee Amount</span>
                      <span className="font-bold text-xl">₹{parseFloat(formData.amount || '0').toLocaleString()}</span>
                    </div>
                    
                    {formData.discount && (
                      <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                        <div>
                          <span className="font-medium text-red-700">Discount</span>
                          <div className="text-sm text-red-600">{formData.discountReason || 'General discount'}</div>
                        </div>
                        <span className="font-bold text-xl text-red-700">- ₹{parseFloat(formData.discount).toLocaleString()}</span>
                      </div>
                    )}
                    
                    {formData.lateFee && (
                      <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                        <div>
                          <span className="font-medium text-amber-700">Late Fee</span>
                          <div className="text-sm text-amber-600">{formData.lateFeeReason || 'Late payment'}</div>
                        </div>
                        <span className="font-bold text-xl text-amber-700">+ ₹{parseFloat(formData.lateFee).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <span className="font-bold text-xl">Total Amount Payable</span>
                      <span className="font-bold text-3xl text-green-600">
                        ₹{parseFloat(formData.netAmount || '0').toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Amount in Words</div>
                      <div className="font-medium italic">
                        {convertToWords(parseFloat(formData.netAmount || '0'))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Receipt Options</CardTitle>
                <CardDescription>Choose how to deliver the receipt</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary cursor-pointer">
                    <Checkbox
                      id="sendReceipt"
                      checked={formData.sendReceipt}
                      onCheckedChange={(checked) => handleChange('sendReceipt', checked as boolean)}
                    />
                    <div>
                      <Label htmlFor="sendReceipt" className="font-medium cursor-pointer">Email Receipt</Label>
                      <div className="text-sm text-gray-500 mt-1">
                        Send to {reviewParentEmail || 'parent@email.com'}
                      </div>
                    </div>
                    <Mail className="ml-auto h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary cursor-pointer">
                    <Checkbox
                      id="sendSMS"
                      checked={formData.sendSMS}
                      onCheckedChange={(checked) => handleChange('sendSMS', checked as boolean)}
                    />
                    <div>
                      <Label htmlFor="sendSMS" className="font-medium cursor-pointer">Send SMS</Label>
                      <div className="text-sm text-gray-500 mt-1">
                        To {reviewParentPhone}
                      </div>
                    </div>
                    <FileText className="ml-auto h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary cursor-pointer">
                    <Checkbox
                      id="printReceipt"
                      checked={formData.printReceipt}
                      onCheckedChange={(checked) => handleChange('printReceipt', checked as boolean)}
                    />
                    <div>
                      <Label htmlFor="printReceipt" className="font-medium cursor-pointer">Print Receipt</Label>
                      <div className="text-sm text-gray-500 mt-1">
                        Generate physical copy for records
                      </div>
                    </div>
                    <Printer className="ml-auto h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 py-6 text-lg"
                disabled={loading}
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                Back to Edit
              </Button>
              
              <Button
                variant="outline"
                onClick={() => generateAndPrintReceipt("REC-" + Date.now().toString().slice(-8))}
                className="flex-1 py-6 text-lg"
                disabled={loading}
              >
                <Printer className="mr-2 h-5 w-5" />
                Preview & Print
              </Button>
              
              <Button
                onClick={handleSubmit}
                className="flex-1 py-6 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-3 h-5 w-5" />
                    Confirm & Save Payment
                  </>
                )}
              </Button>
            </div>

            {/* Warning Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Important:</strong> This will create a permanent transaction record in the database. 
                  Please verify all details before confirming. Once recorded, changes can only be made through refund transactions.
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Receipt className="h-8 w-8 text-primary" />
          Record Payment & Generate Receipt
        </h1>
        <p className="text-gray-600 text-lg">
          Record fee payments and generate professional receipts with complete transaction details
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center w-full max-w-2xl">
          <div className={`flex flex-col items-center flex-1 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
              {step > 1 ? <CheckCircle className="h-6 w-6" /> : <User className="h-6 w-6" />}
            </div>
            <span className="text-sm font-medium">Student Selection</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          
          <div className={`flex flex-col items-center flex-1 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
              {step > 2 ? <CheckCircle className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
            </div>
            <span className="text-sm font-medium">Payment Details</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          
          <div className={`flex flex-col items-center flex-1 ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
              <FileText className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">Review & Receipt</span>
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="max-w-5xl mx-auto">
        {renderStep()}
      </div>
    </div>
  );
};

export default RecordPayment;