import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Printer, Share2, Award, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import examService from '@/Services/exam.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateData {
  certificateId: string;
  studentName: string;
  examName: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  date: string;
  grade?: string;
  isPassed: boolean;
}

const Certificate: React.FC = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificateData();
  }, [examId]);

  const loadCertificateData = async () => {
    try {
      const response = await examService.getCertificate(examId!);
      if (response.success && response.data) {
        if (response.data.isPassed) {
          setCertificateData(response.data);
        } else {
          toast.error('Certificate is only available for passed exams');
        }
      }
    } catch (error) {
      console.error('Failed to load certificate:', error);
      toast.error('Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      toast.info('Generating certificate...');
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
      pdf.save(`certificate-${examId}.pdf`);
      
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Failed to download certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const shareData = {
      title: 'Exam Certificate',
      text: certificateData ? `Check out my certificate for ${certificateData.examName}` : 'Check out my certificate',
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificateData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-8 text-center max-w-md">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Certificate Not Available</h2>
          <p className="text-gray-600 mb-4">
            You need to pass the exam to receive a certificate
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/exams')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
            <Button variant="outline" onClick={() => navigate(`/exams/${examId}/results`)}>
              View Results
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => navigate('/exams')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={downloadCertificate}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Certificate */}
          <div 
            ref={certificateRef}
            className="bg-white shadow-2xl rounded-lg overflow-hidden"
            style={{
              border: '16px solid',
              borderImage: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%) 1'
            }}
          >
            {/* Ornamental Border */}
            <div className="relative p-8 bg-gradient-to-br from-yellow-50 to-amber-50">
              {/* Corner Decorations */}
              <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-yellow-500 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-yellow-500 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-yellow-500 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-yellow-500 rounded-br-lg"></div>

              <div className="bg-white rounded-lg p-12 shadow-inner">
                {/* Header */}
                <div className="text-center mb-8">
                  <Award className="h-24 w-24 text-yellow-500 mx-auto mb-4" />
                  <h1 className="text-5xl font-bold text-gray-800 mb-3 font-serif">
                    Certificate of Achievement
                  </h1>
                  <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 mx-auto rounded-full"></div>
                  <p className="text-xl text-gray-600 mt-4">This is to certify that</p>
                </div>

                {/* Student Name */}
                <div className="text-center mb-10">
                  <div className="relative inline-block">
                    <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-600 font-serif">
                      {certificateData.studentName}
                    </h2>
                    <div className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-3 rounded-full"></div>
                  </div>
                </div>

                {/* Achievement Details */}
                <div className="text-center mb-8 space-y-3">
                  <p className="text-xl text-gray-700">
                    has successfully completed the examination
                  </p>
                  <p className="text-3xl font-bold text-gray-800 my-4">
                    {certificateData.examName}
                  </p>
                  <p className="text-xl text-gray-700">
                    with an outstanding score of
                  </p>
                  <div className="inline-flex items-center gap-4 bg-gradient-to-r from-yellow-100 to-amber-100 px-8 py-4 rounded-lg mt-3">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-yellow-700">
                        {certificateData.percentage}%
                      </p>
                      <p className="text-sm text-gray-600">
                        ({certificateData.obtainedMarks}/{certificateData.totalMarks} marks)
                      </p>
                    </div>
                    {certificateData.grade && (
                      <>
                        <div className="w-px h-12 bg-yellow-400"></div>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-yellow-700">
                            {certificateData.grade}
                          </p>
                          <p className="text-sm text-gray-600">Grade</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Date and Certificate ID */}
                <div className="flex justify-between items-center mt-12 pt-8 border-t-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Date of Issue</p>
                    <p className="font-semibold text-gray-800 text-lg">
                      {new Date(certificateData.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Certificate ID</p>
                    <p className="font-mono font-semibold text-gray-800 text-lg">
                      {certificateData.certificateId}
                    </p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 mt-12">
                  <div className="text-center">
                    <div className="border-t-2 border-gray-800 pt-2 mb-2"></div>
                    <p className="font-semibold text-gray-800">Director of Education</p>
                    <p className="text-sm text-gray-600">Academic Authority</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t-2 border-gray-800 pt-2 mb-2"></div>
                    <p className="font-semibold text-gray-800">Examination Controller</p>
                    <p className="text-sm text-gray-600">Verification Authority</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    This certificate is digitally generated and can be verified online
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Certificate ID: {certificateData.certificateId}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Actions */}
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={() => navigate(`/exams/${examId}/results`)}>
              View Detailed Results
            </Button>
            <Button variant="outline" onClick={() => navigate('/exams')}>
              Back to Exams
            </Button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-print, #certificate-print * {
            visibility: visible;
          }
          #certificate-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Certificate;
