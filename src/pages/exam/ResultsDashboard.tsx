import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Download,
  Share2,
  Printer,
  Award,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import examService from '@/Services/exam.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '@/contexts/AuthContext';

interface ResultData {
  examName: string;
  studentName: string;
  obtainedMarks: number;
  totalMarks: number;
  passingMarks: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  totalQuestions: number;
  timeTaken: string;
  totalTime: string;
  percentage: number;
  isPassed: boolean;
  averageScore?: number;
  highestScore?: number;
  negativeMarks?: number;
  questionAnalysis?: any[];
  subjectWiseMarks?: any[];
  classStatistics?: any;
}

const ResultsDashboard: React.FC = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const isStudentView = user?.role === 'student';

  useEffect(() => {
    loadResults();
  }, [examId]);

  const loadResults = async () => {
    try {
      const response = isStudentView
        ? await examService.getMyResults(examId!)
        : await examService.getExamResults(examId!);

      if (response.success && response.data) {
        if (isStudentView) {
          setResult(response.data);
        } else {
          const data = response.data;
          const totalMarks = Number(data.totalMarks || 100);
          const passingMarks = Number(data.passingMarks || totalMarks * 0.4);
          const averageScore = Number(data.averageScore || 0);
          const highestScore = Number(data.highestScore || 0);

          setResult({
            examName: data.examName || 'Exam',
            studentName: 'Class Summary',
            obtainedMarks: highestScore,
            totalMarks,
            passingMarks,
            correctAnswers: 0,
            incorrectAnswers: 0,
            unansweredQuestions: 0,
            totalQuestions: 0,
            timeTaken: 'N/A',
            totalTime: `${Number(data.duration || 0)} min`,
            percentage: totalMarks > 0 ? Number(((averageScore / totalMarks) * 100).toFixed(2)) : 0,
            isPassed: averageScore >= passingMarks,
            averageScore,
            highestScore,
            negativeMarks: 0,
            questionAnalysis: [],
            subjectWiseMarks: [],
            classStatistics: {
              totalSubmissions: Number(data.totalSubmissions || 0),
              passCount: Number(data.passCount || 0),
              failCount: Number(data.failCount || 0),
              passPercentage: Number(data.passPercentage || 0)
            }
          });
        }
      } else {
        toast.error('Failed to load results');
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('results-content');
    if (!element) return;

    try {
      toast.info('Generating PDF...');
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`exam-results-${examId}.pdf`);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const shareResults = async () => {
    const shareData = {
      title: 'Exam Results',
      text: result ? `I scored ${result.percentage}% (${result.obtainedMarks}/${result.totalMarks}) in ${result.examName}` : 'Check out my exam results',
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Share failed:', error);
      }
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
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Results Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to load exam results</p>
            <Button onClick={() => navigate('/exams')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const performanceData = [
    { name: isStudentView ? 'Your Score' : 'Highest', value: result.obtainedMarks, fill: result.isPassed ? '#10b981' : '#ef4444' },
    { name: 'Average', value: result.averageScore || 0, fill: '#6366f1' },
    { name: 'Highest', value: result.highestScore || 0, fill: '#f59e0b' }
  ];

  const answerDistribution = [
    { name: 'Correct', value: result.correctAnswers, fill: '#10b981' },
    { name: 'Incorrect', value: result.incorrectAnswers, fill: '#ef4444' },
    { name: 'Unanswered', value: result.unansweredQuestions, fill: '#6b7280' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" onClick={() => navigate('/exams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={shareResults}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Results Content */}
        <div id="results-content" className="space-y-6">
          {/* Certificate Banner for Passed Students */}
          {isStudentView && result.isPassed && (
            <Card className="bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-400">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Trophy className="h-12 w-12 text-yellow-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-yellow-800">Congratulations!</h2>
                    <p className="text-yellow-700">You have successfully passed the exam</p>
                  </div>
                </div>
                <Button 
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => navigate(`/exams/${examId}/certificate`)}
                >
                  <Award className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Result Summary Card */}
          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Exam Name</p>
                  <h3 className="text-xl font-bold truncate">{result.examName}</h3>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Status</p>
                  <Badge className={result.isPassed ? 'bg-green-600' : 'bg-red-600'}>
                    {isStudentView ? (result.isPassed ? 'PASSED' : 'FAILED') : 'SUMMARY'}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">{isStudentView ? 'Score' : 'Highest Score'}</p>
                  <div className="text-3xl font-bold text-primary">
                    {result.obtainedMarks}/{result.totalMarks}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">{isStudentView ? 'Percentage' : 'Avg Percentage'}</p>
                  <div className={`text-3xl font-bold ${result.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {result.percentage}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Passing Marks: {result.passingMarks}</span>
                  <span className="text-sm text-gray-600">
                    {isStudentView
                      ? `${result.obtainedMarks >= result.passingMarks ? '+' : ''}${result.obtainedMarks - result.passingMarks} marks ${result.isPassed ? 'above' : 'below'} passing`
                      : `Submissions: ${result.classStatistics?.totalSubmissions || 0} • Pass: ${result.classStatistics?.passCount || 0} • Fail: ${result.classStatistics?.failCount || 0}`}
                  </span>
                </div>
                <Progress 
                  value={result.percentage} 
                  className={`h-4 ${result.isPassed ? '[&>div]:bg-green-600' : '[&>div]:bg-red-600'}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <span className="text-3xl font-bold">{result.correctAnswers}</span>
                </div>
                <p className="text-gray-600 font-medium">Correct Answers</p>
                <p className="text-sm text-gray-500">Out of {result.totalQuestions} questions</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <span className="text-3xl font-bold">{result.incorrectAnswers}</span>
                </div>
                <p className="text-gray-600 font-medium">Incorrect Answers</p>
                {result.negativeMarks ? (
                  <p className="text-sm text-gray-500">{result.negativeMarks} negative marks</p>
                ) : (
                  <p className="text-sm text-gray-500">No negative marking</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <span className="text-2xl font-bold">{result.timeTaken}</span>
                </div>
                <p className="text-gray-600 font-medium">Time Taken</p>
                <p className="text-sm text-gray-500">Out of {result.totalTime}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Score Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Answer Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={answerDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {answerDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question-wise Analysis */}
          {result.questionAnalysis && result.questionAnalysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Question-wise Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.questionAnalysis.map((q: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium mb-1">Q{index + 1}: {q.question}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{q.marks} marks</Badge>
                            {q.isCorrect ? (
                              <Badge className="bg-green-600">Correct</Badge>
                            ) : q.studentAnswer ? (
                              <Badge variant="destructive">Incorrect</Badge>
                            ) : (
                              <Badge className="bg-gray-500">Unanswered</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-600">Your Answer:</p>
                          <p className={`font-medium ${q.isCorrect ? 'text-green-600' : q.studentAnswer ? 'text-red-600' : 'text-gray-500'}`}>
                            {q.studentAnswer || 'Not answered'}
                          </p>
                          {!q.isCorrect && q.correctAnswer && (
                            <>
                              <p className="text-sm text-gray-600 mt-1">Correct Answer:</p>
                              <p className="font-medium text-green-600">{q.correctAnswer}</p>
                            </>
                          )}
                        </div>
                      </div>
                      {q.explanation && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                          <p className="font-medium mb-1">Explanation:</p>
                          <p className="text-gray-700">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg" onClick={() => navigate('/exams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>
          {isStudentView && result.isPassed && (
            <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700" onClick={() => navigate(`/exams/${examId}/certificate`)}>
              <Award className="h-4 w-4 mr-2" />
              View Certificate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
