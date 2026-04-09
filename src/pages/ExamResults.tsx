import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Download,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import examService from '@/Services/exam.service';
import { Exam, Submission } from '@/types/exam';
import { useAuth } from '@/contexts/AuthContext';

const ExamResults: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      if (!examId) {
        setError('Invalid exam ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let examData: Exam | null = null;

        // Load submission details first
        let mySubmission: Submission | undefined;

        try {
          const submissionsResponse = await examService.getMySubmissions();
          if (submissionsResponse.success && submissionsResponse.data) {
            mySubmission = submissionsResponse.data.find(
              (sub: Submission) =>
                typeof sub.exam === 'string' ? sub.exam === examId : sub.exam?._id === examId
            );
          }
        } catch (mySubmissionsError: any) {
          if (mySubmissionsError?.response?.status !== 404) {
            throw mySubmissionsError;
          }
        }

        if (!mySubmission) {
          // Fallback for older backend builds that don't expose /my-submissions
          const examSubmissionsResponse = await examService.getSubmissions(examId);
          if (examSubmissionsResponse.success && Array.isArray(examSubmissionsResponse.data)) {
            mySubmission = examSubmissionsResponse.data.find((sub: Submission) => {
              const currentUserId = (user as any)?._id;
              const currentUserEmail = (user as any)?.email;
              const currentUserName = (user as any)?.name;
              const studentId =
                typeof sub.student === 'string'
                  ? sub.student
                  : (sub.student as any)?._id;
              const studentEmail = typeof sub.student === 'object' ? (sub.student as any)?.email : undefined;
              const studentName = typeof sub.student === 'object' ? (sub.student as any)?.name : undefined;

              return (
                (currentUserId && studentId && String(studentId) === String(currentUserId)) ||
                (currentUserEmail && studentEmail && String(studentEmail).toLowerCase() === String(currentUserEmail).toLowerCase()) ||
                (currentUserName && studentName && String(studentName).toLowerCase() === String(currentUserName).toLowerCase())
              );
            });
          }
        }

        if (mySubmission) {
          setSubmission(mySubmission);
          if (typeof mySubmission.exam !== 'string' && mySubmission.exam) {
            examData = mySubmission.exam as Exam;
          }
        } else {
          setError('No submission found for this exam');
        }

        if (!examData) {
          const myExamsResponse = await examService.getMyExams();
          if (myExamsResponse.success && Array.isArray(myExamsResponse.data)) {
            examData = myExamsResponse.data.find((item) => item?._id === examId) || null;
          }
        }

        if (!examData) {
          try {
            const examResponse = await examService.getExamById(examId);
            if (examResponse.success && examResponse.data) {
              examData = examResponse.data;
            }
          } catch (fetchError) {
            console.warn('ExamResults: fallback exam fetch by id failed', fetchError);
          }
        }

        if (!examData) {
          setError('Exam not found');
          return;
        }

        setExam(examData);
      } catch (err: any) {
        console.error('Load results error:', err);
        setError(err.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [examId, user]);

  const handleDownloadCertificate = () => {
    toast.info('Certificate download feature coming soon');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Exam not found'}</AlertDescription>
          <Button 
            variant="outline" 
            className="mt-4 w-full"
            onClick={() => navigate('/exams')}
          >
            Back to Exams
          </Button>
        </Alert>
      </div>
    );
  }

  // Calculate total marks and passing marks
  const totalMarks = exam.subjectGroups?.reduce((sum, group) => sum + group.totalMarks, 0) || 0;
  const passingMarks = exam.subjectGroups?.[0]?.passingMarks || Math.ceil(totalMarks * 0.4);
  const obtainedMarks = submission?.totalMarksObtained || 0;
  const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
  const isPassed = obtainedMarks >= passingMarks;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/exams')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exams
        </Button>

        {/* Result Card */}
        <Card className="border-2">
          <CardHeader className="text-center p-8">
            <div className="flex justify-center mb-4">
              {isPassed ? (
                <CheckCircle className="h-16 w-16 text-green-600" />
              ) : (
                <XCircle className="h-16 w-16 text-red-600" />
              )}
            </div>
            <CardTitle className="text-3xl mb-2">
              {isPassed ? 'Congratulations!' : 'Result'}
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              {isPassed 
                ? `You have passed the exam with ${percentage}%` 
                : `You need ${passingMarks - obtainedMarks} more marks to pass`}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Exam Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Exam Name</p>
                <p className="font-semibold text-lg">{exam.name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={isPassed ? 'bg-green-600' : 'bg-red-600'} variant="default">
                  {isPassed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
            </div>

            {/* Marks Display */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Obtained Marks</p>
                  <p className="text-3xl font-bold text-blue-600">{obtainedMarks}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-100 border-gray-300">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Total Marks</p>
                  <p className="text-3xl font-bold text-gray-700">{totalMarks}</p>
                </CardContent>
              </Card>

              <Card className={isPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Percentage</p>
                  <p className={`text-3xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {percentage}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Passing Marks Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Passing Marks: {passingMarks}</AlertTitle>
              <AlertDescription>
                You scored {obtainedMarks} out of {totalMarks} marks.
              </AlertDescription>
            </Alert>

            {/* Submission Details */}
            {submission && (
              <div className="space-y-3 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted At:</span>
                  <span className="font-medium">
                    {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline">{submission.status}</Badge>
                </div>
                {submission.evaluatedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Evaluated At:</span>
                    <span className="font-medium">
                      {new Date(submission.evaluatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownloadCertificate}
                disabled={!isPassed}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Certificate
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate('/exams')}
              >
                Back to Exams
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        {!isPassed && (
          <Alert variant="destructive">
            <AlertTitle>Need to Improve</AlertTitle>
            <AlertDescription>
              Consider reviewing the exam topics and trying again. You can retake this exam if allowed.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default ExamResults;
