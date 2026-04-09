import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  Download,
  Printer,
  Eye,
  Share2,
  Search,
  RotateCcw,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface StudentInfo {
  studentId: string;
  rollNumber: string;
  name: string;
  class: string;
  section: string;
  admissionNumber: string;
  dateOfBirth: string;
  fatherName: string;
  motherName: string;
  category?: string;
  address?: string;
  phoneNumber?: string;
  sssmId?: string;
  aadhaarNumber?: string;
  photo?: string;
}

interface SubjectMark {
  subject: string;
  maxMarks: number;
  marksObtained: number;
  percentage: number;
  grade: string;
  halfYearlyMarks?: number;
  halfYearlyGrade?: string;
  annualExamMarks?: number;
  annualExamGrade?: string;
  annualResultGrade?: string;
  remarks?: string;
}

interface CoCurricularActivity {
  activity: string;
  grade: 'A' | 'B' | 'C' | 'D';
}

interface PersonalityTrait {
  trait: string;
  grade: 'A' | 'B' | 'C' | 'D';
}

interface AttendanceInfo {
  totalWorkingDays: number;
  presentDays: number;
  percentage: number;
}

interface ReportCardData {
  studentInfo: StudentInfo;
  academicYear: string;
  examType: string;
  examDate: string;
  subjects: SubjectMark[];
  coCurricular: CoCurricularActivity[];
  personality: PersonalityTrait[];
  attendance: AttendanceInfo;
  teacherRemarks: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  overallPercentage: number;
  finalGrade: string;
  result: 'Pass' | 'Fail';
  division: string;
  promotionStatus: string;
  principalRemarks?: string;
}

interface AssignedClassOption {
  className: string;
  section: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'B+':
    case 'B':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'C+':
    case 'C':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-red-600 bg-red-50 border-red-200';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const StudentReportCardPage: React.FC = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportCardData | null>(null);
  const [allReportCards, setAllReportCards] = useState<ReportCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedExamType, setSelectedExamType] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name-asc');

  const role = user?.role;
  const canUseFilters = role === 'admin' || role === 'owner' || role === 'teacher';

  const assignedClassPairs: AssignedClassOption[] =
    role === 'teacher'
      ? (((user as unknown as { assignedClasses?: AssignedClassOption[] })?.assignedClasses ?? [])
          .filter((item) => item?.className && item?.section)
          .map((item) => ({ className: String(item.className), section: String(item.section) })))
      : [];

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchReportCard();
  }, []);

  const fetchReportCard = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual authentication
      // const user = useAuth();
      // const studentId = user.studentId;
      // const response = await fetch(`/api/student/report-card/${studentId}`);
      // const data = await response.json();
      // setReportData(data);

      // MOCK DATA - Replace with actual API data
      const mockData: ReportCardData = {
        studentInfo: {
          studentId: 'STU001',
          rollNumber: '15',
          name: 'Rajesh Kumar',
          class: '10',
          section: 'A',
          admissionNumber: 'ADM2024001',
          dateOfBirth: '15-08-2010',
          fatherName: 'Suresh Kumar',
          motherName: 'Priya Devi',
          category: 'General',
          address: 'Main Road, City - 123456',
          phoneNumber: '+91-9876543210',
          sssmId: 'SSSM1001122',
          aadhaarNumber: 'XXXX-XXXX-1234',
        },
        academicYear: '2025-2026',
        examType: 'Annual Examination',
        examDate: 'March 2026',
        subjects: [
          {
            subject: 'English',
            maxMarks: 100,
            marksObtained: 93,
            percentage: 93,
            grade: 'A+',
            halfYearlyMarks: 88,
            halfYearlyGrade: 'A',
            annualExamMarks: 93,
            annualExamGrade: 'A+',
            annualResultGrade: 'A+',
            remarks: 'Excellent',
          },
          {
            subject: 'Mathematics',
            maxMarks: 100,
            marksObtained: 89,
            percentage: 89,
            grade: 'A',
            halfYearlyMarks: 82,
            halfYearlyGrade: 'A',
            annualExamMarks: 89,
            annualExamGrade: 'A',
            annualResultGrade: 'A',
            remarks: 'Very Good',
          },
          {
            subject: 'Science',
            maxMarks: 100,
            marksObtained: 92,
            percentage: 92,
            grade: 'A+',
            halfYearlyMarks: 86,
            halfYearlyGrade: 'A',
            annualExamMarks: 92,
            annualExamGrade: 'A+',
            annualResultGrade: 'A+',
            remarks: 'Excellent',
          },
          {
            subject: 'Social Studies',
            maxMarks: 100,
            marksObtained: 90,
            percentage: 90,
            grade: 'A+',
            halfYearlyMarks: 84,
            halfYearlyGrade: 'A',
            annualExamMarks: 90,
            annualExamGrade: 'A+',
            annualResultGrade: 'A+',
            remarks: 'Outstanding',
          },
          {
            subject: 'Hindi',
            maxMarks: 100,
            marksObtained: 88,
            percentage: 88,
            grade: 'A',
            halfYearlyMarks: 80,
            halfYearlyGrade: 'A',
            annualExamMarks: 88,
            annualExamGrade: 'A',
            annualResultGrade: 'A',
            remarks: 'Very Good',
          },
          {
            subject: 'Computer Science',
            maxMarks: 100,
            marksObtained: 95,
            percentage: 95,
            grade: 'A+',
            halfYearlyMarks: 90,
            halfYearlyGrade: 'A+',
            annualExamMarks: 95,
            annualExamGrade: 'A+',
            annualResultGrade: 'A+',
            remarks: 'Exceptional',
          },
        ],
        coCurricular: [
          { activity: 'Literature', grade: 'A' },
          { activity: 'Cultural Activities', grade: 'A' },
          { activity: 'Scientific Activities', grade: 'B' },
          { activity: 'Creativity', grade: 'A' },
          { activity: 'Games & Sports', grade: 'B' },
        ],
        personality: [
          { trait: 'Regularity', grade: 'A' },
          { trait: 'Punctuality', grade: 'A' },
          { trait: 'Cleanliness', grade: 'A' },
          { trait: 'Discipline', grade: 'A' },
          { trait: 'Cooperation', grade: 'B' },
        ],
        attendance: {
          totalWorkingDays: 200,
          presentDays: 194,
          percentage: 97,
        },
        teacherRemarks:
          'Rajesh is an excellent student who shows outstanding academic performance and active participation in all classroom activities. He demonstrates strong leadership qualities and maintains excellent relationships with peers and teachers.',
        totalMarksObtained: 547,
        totalMaxMarks: 600,
        overallPercentage: 91.17,
        finalGrade: 'A+',
        result: 'Pass',
        division: 'Distinction',
        promotionStatus: 'The student is promoted to Class 11.',
        principalRemarks: 'Keep up the excellent work!',
      };

      const mockData2: ReportCardData = {
        ...mockData,
        studentInfo: {
          ...mockData.studentInfo,
          studentId: 'STU002',
          rollNumber: '18',
          name: 'Anita Sharma',
          class: '10',
          section: 'B',
          admissionNumber: 'ADM2024018',
        },
        attendance: {
          totalWorkingDays: 200,
          presentDays: 186,
          percentage: 93,
        },
        totalMarksObtained: 512,
        totalMaxMarks: 600,
        overallPercentage: 85.33,
        finalGrade: 'A',
        division: 'Distinction',
      };

      const mockData3: ReportCardData = {
        ...mockData,
        studentInfo: {
          ...mockData.studentInfo,
          studentId: 'STU003',
          rollNumber: '9',
          name: 'Rahul Verma',
          class: '7',
          section: 'A',
          admissionNumber: 'ADM2023309',
        },
        attendance: {
          totalWorkingDays: 198,
          presentDays: 180,
          percentage: 90.91,
        },
        totalMarksObtained: 468,
        totalMaxMarks: 600,
        overallPercentage: 78,
        finalGrade: 'B+',
        division: 'Distinction',
      };

      const mockData4: ReportCardData = {
        ...mockData,
        studentInfo: {
          ...mockData.studentInfo,
          studentId: 'STU004',
          rollNumber: '26',
          name: 'Meena Reddy',
          class: '10',
          section: 'C',
          admissionNumber: 'ADM2024026',
        },
        totalMarksObtained: 438,
        totalMaxMarks: 600,
        overallPercentage: 73,
        finalGrade: 'B+',
        division: 'First Division',
      };

      const allCards = [mockData, mockData2, mockData3, mockData4];

      const roleAwareCards =
        role === 'teacher'
          ? allCards.filter((card) =>
              assignedClassPairs.some(
                (pair) =>
                  pair.className === card.studentInfo.class && pair.section === card.studentInfo.section
              )
            )
          : allCards;

      const defaultCard =
        role === 'student' || role === 'parent' ? roleAwareCards[0] ?? null : roleAwareCards[0] ?? null;

      setAllReportCards(roleAwareCards);
      setReportData(defaultCard);
      setSelectedStudentId(defaultCard?.studentInfo.studentId ?? '');
      toast.success('Report card loaded successfully');
    } catch (error) {
      console.error('Error fetching report card:', error);
      toast.error('Failed to load report card');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Method 1: Use browser print to PDF
    toast.info('Opening print dialog - Select "Save as PDF"');
    window.print();

    // Method 2: For advanced PDF generation, integrate libraries like:
    // - jsPDF
    // - react-pdf
    // - html2canvas + jsPDF
  };

  const handlePreview = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Student Report Card',
          text: `Report Card - ${reportData?.studentInfo.name}`,
          url: window.location.href,
        })
        .then(() => toast.success('Shared successfully'))
        .catch(() => toast.error('Failed to share'));
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleResetFilters = () => {
    setSelectedAcademicYear('all');
    setSelectedExamType('all');
    setSelectedClass('all');
    setSelectedSection('all');
    setSelectedResult('all');
    setSelectedGrade('all');
    setSearchQuery('');
    setSortBy('name-asc');
  };

  const availableAcademicYears = Array.from(new Set(allReportCards.map((card) => card.academicYear))).sort(
    (a, b) => b.localeCompare(a)
  );

  const availableExamTypes = Array.from(new Set(allReportCards.map((card) => card.examType))).sort();

  const availableGradeOptions = Array.from(new Set(allReportCards.map((card) => card.finalGrade))).sort();

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const baseFiltered = allReportCards.filter((card) => {
    const matchesYear = selectedAcademicYear === 'all' || card.academicYear === selectedAcademicYear;
    const matchesExam = selectedExamType === 'all' || card.examType === selectedExamType;
    const matchesResult = selectedResult === 'all' || card.result === selectedResult;
    const matchesGrade = selectedGrade === 'all' || card.finalGrade === selectedGrade;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      card.studentInfo.name.toLowerCase().includes(normalizedSearch) ||
      card.studentInfo.rollNumber.toLowerCase().includes(normalizedSearch) ||
      card.studentInfo.admissionNumber.toLowerCase().includes(normalizedSearch);

    return matchesYear && matchesExam && matchesResult && matchesGrade && matchesSearch;
  });

  const availableClasses = Array.from(
    new Set(baseFiltered.map((card) => card.studentInfo.class))
  ).sort();

  const filteredByClass =
    selectedClass === 'all'
      ? baseFiltered
      : baseFiltered.filter((card) => card.studentInfo.class === selectedClass);

  const availableSections = Array.from(
    new Set(filteredByClass.map((card) => card.studentInfo.section))
  ).sort();

  const filteredStudents = filteredByClass
    .filter(
    (card) => selectedSection === 'all' || card.studentInfo.section === selectedSection
    )
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.studentInfo.name.localeCompare(b.studentInfo.name);
      if (sortBy === 'name-desc') return b.studentInfo.name.localeCompare(a.studentInfo.name);
      if (sortBy === 'percentage-high') return b.overallPercentage - a.overallPercentage;
      if (sortBy === 'percentage-low') return a.overallPercentage - b.overallPercentage;
      return a.studentInfo.rollNumber.localeCompare(b.studentInfo.rollNumber, undefined, {
        numeric: true,
      });
    });

  const handleClassFilterChange = (value: string) => {
    setSelectedClass(value);
    setSelectedSection('all');
  };

  const handleSectionFilterChange = (value: string) => {
    setSelectedSection(value);
  };

  const handleStudentFilterChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    const selected = allReportCards.find((card) => card.studentInfo.studentId === studentId) ?? null;
    setReportData(selected);
  };

  useEffect(() => {
    if (filteredStudents.length === 0) {
      return;
    }

    const selectedStillVisible = filteredStudents.some(
      (card) => card.studentInfo.studentId === selectedStudentId
    );

    if (selectedStillVisible) {
      return;
    }

    const next = filteredStudents[0];
    setSelectedStudentId(next.studentInfo.studentId);
    setReportData(next);
  }, [filteredStudents, selectedStudentId]);

  const issuedOn = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const reportRef = reportData
    ? `PR-${reportData.studentInfo.class}${reportData.studentInfo.section}-${reportData.studentInfo.rollNumber}`
    : 'PR-NA';

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report card...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Report Card Not Available</h2>
            <p className="text-gray-600 mb-4">
              Unable to load accessible report cards. Please contact your school administrator.
            </p>
            <Button onClick={fetchReportCard}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="report-card-print-container report-card-print-root min-h-screen bg-gray-50">
      {/* ====== ACTION BUTTONS (Hide on Print) ====== */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Progress Report</h1>
              <p className="text-sm text-gray-600">
                View your academic performance and grades
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="report-card-print-sheet max-w-7xl mx-auto px-4 py-8 print:p-0">
        <div className="print:hidden">
        {/* ====== ROLE-BASED FILTERS (Admin/Owner/Teacher Only) ====== */}
        {canUseFilters && (
          <Card className="mb-6 print:hidden border-blue-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Advanced Student Filters</h3>
                  <p className="text-xs text-gray-600">
                    Filter by exam outcome and quickly locate student reports.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-200 text-blue-800">
                    {filteredStudents.length} students
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={handleResetFilters}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Academic Year</p>
                  <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Academic Years</SelectItem>
                      {availableAcademicYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Exam Type</p>
                  <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Exam Types</SelectItem>
                      {availableExamTypes.map((examType) => (
                        <SelectItem key={examType} value={examType}>
                          {examType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Class Filter</p>
                  <Select value={selectedClass} onValueChange={handleClassFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {availableClasses.map((className) => (
                        <SelectItem key={className} value={className}>
                          Class {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Section Filter</p>
                  <Select value={selectedSection} onValueChange={handleSectionFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {availableSections.map((section) => (
                        <SelectItem key={section} value={section}>
                          Section {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Result</p>
                  <Select value={selectedResult} onValueChange={setSelectedResult}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Results</SelectItem>
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Grade</p>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {availableGradeOptions.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Student Filter</p>
                  <Select value={selectedStudentId} onValueChange={handleStudentFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStudents.map((studentCard) => (
                        <SelectItem
                          key={studentCard.studentInfo.studentId}
                          value={studentCard.studentInfo.studentId}
                        >
                          {studentCard.studentInfo.name} ({studentCard.studentInfo.rollNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Sort By</p>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sorting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="percentage-high">Percentage (High-Low)</SelectItem>
                      <SelectItem value="percentage-low">Percentage (Low-High)</SelectItem>
                      <SelectItem value="roll-asc">Roll Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Search</p>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by student name, roll number, or admission number"
                    className="w-full h-10 rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {filteredStudents.length === 0 && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  No students match the selected filters. Adjust filters or click Reset.
                </div>
              )}

              {role === 'teacher' && (
                <p className="mt-3 text-xs text-gray-600">
                  Teacher access is restricted to assigned classes and sections only.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ====== SCHOOL HEADER (Print Layout) ====== */}
        <div className="hidden print:block mb-8 text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PMC TECH SCHOOL</h1>
          <p className="text-sm text-gray-700">
            Affiliated to CBSE | School Code: 12345
          </p>
          <p className="text-sm text-gray-700">
            Main Road, City - 123456 | Phone: +91-1234567890
          </p>
          <h2 className="text-xl font-semibold mt-3 text-blue-900">
            STUDENT PROGRESS REPORT
          </h2>
          <p className="text-sm text-gray-600">
            {reportData.academicYear} | {reportData.examType}
          </p>
        </div>

        {/* ====== PERFORMANCE SUMMARY CARDS (Screen Only) ====== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:hidden">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Percentage</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {reportData.overallPercentage.toFixed(2)}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-500" />
              </div>
              <Progress value={reportData.overallPercentage} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Grade</p>
                  <p className="text-3xl font-bold text-green-600">{reportData.finalGrade}</p>
                  <p className="text-xs text-gray-500 mt-1">{reportData.division}</p>
                </div>
                <Award className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {reportData.attendance.percentage}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {reportData.attendance.presentDays}/{reportData.attendance.totalWorkingDays}{' '}
                    days
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Result</p>
                  <p
                    className={`text-3xl font-bold ${
                      reportData.result === 'Pass' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {reportData.result}
                  </p>
                </div>
                {reportData.result === 'Pass' ? (
                  <CheckCircle className="w-10 h-10 text-green-500" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* ====== Content below will be visible when printing ====== */}

      {/* ====== SCHOOL HEADER (Print Only) ====== */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PMC TECH SCHOOL</h1>
          <p className="text-sm text-gray-700">
            Main Road, City - 123456 | Phone: +91-9876543210
          </p>
          <p className="text-sm text-gray-700">
            Affiliated to CBSE | School Code: 12345
          </p>
          <h2 className="text-xl font-semibold mt-3 text-blue-900">
            STUDENT PROGRESS REPORT CARD
          </h2>
          <p className="text-sm text-gray-600">
            {reportData.academicYear} | {reportData.examType}
          </p>
        </div>

        {/* ====== MAIN REPORT CARD ====== */}
        <Card className="report-card-paper print:shadow-none print:border-2 print:border-gray-800">
          <CardContent className="p-6 print:p-8">
            <div className="report-meta-row hidden print:flex text-xs mb-4">
              <div>
                <span className="font-semibold">Report Ref:</span> {reportRef}
              </div>
              <div>
                <span className="font-semibold">Issued On:</span> {issuedOn}
              </div>
            </div>

            {/* ====== STUDENT INFORMATION ====== */}
            <div className="report-section mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 print:text-xl">
                Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Roll Number:</span>{' '}
                  <span className="text-gray-900">{reportData.studentInfo.rollNumber}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Admission Number:</span>{' '}
                  <span className="text-gray-900">{reportData.studentInfo.admissionNumber}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date of Birth:</span>{' '}
                  <span className="text-gray-900">{reportData.studentInfo.dateOfBirth}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Student Name:</span>{' '}
                  <span className="text-gray-900 font-bold">{reportData.studentInfo.name}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Class:</span>{' '}
                  <span className="text-gray-900">
                    {reportData.studentInfo.class} - {reportData.studentInfo.section}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Exam Date:</span>{' '}
                  <span className="text-gray-900">{reportData.examDate}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Father's Name:</span>{' '}
                  <span className="text-gray-900">{reportData.studentInfo.fatherName}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Mother's Name:</span>{' '}
                  <span className="text-gray-900">{reportData.studentInfo.motherName}</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* ====== SUBJECT MARKS TABLE ====== */}
            <div className="report-section mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 print:text-xl">
                Academic Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="report-table w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Subject
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        Max Marks
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        Marks Obtained
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        Percentage
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        Grade
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.subjects.map((subject, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 font-medium">
                          {subject.subject}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          {subject.maxMarks}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                          {subject.marksObtained}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          {subject.percentage.toFixed(1)}%
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <Badge className={getGradeColor(subject.grade)}>{subject.grade}</Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-gray-600">
                          {subject.remarks}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50 font-bold">
                      <td className="border border-gray-300 px-4 py-3">TOTAL</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {reportData.totalMaxMarks}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-600">
                        {reportData.totalMarksObtained}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-600">
                        {reportData.overallPercentage.toFixed(2)}%
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <Badge className="bg-blue-600 text-white">{reportData.finalGrade}</Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <Separator className="my-6" />

            {/* ====== CO-CURRICULAR & PERSONALITY ====== */}
            <div className="report-section grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Co-Curricular Activities */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Co-Curricular Activities
                </h3>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="mini-table w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border-b border-gray-300 px-4 py-2 text-left font-semibold">
                          Activity
                        </th>
                        <th className="border-b border-gray-300 px-4 py-2 text-center font-semibold">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.coCurricular.map((activity, index) => (
                        <tr key={index}>
                          <td className="border-b border-gray-200 px-4 py-2">
                            {activity.activity}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-2 text-center">
                            <Badge variant="outline">{activity.grade}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Personality Development */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Personality Development
                </h3>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="mini-table w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border-b border-gray-300 px-4 py-2 text-left font-semibold">
                          Trait
                        </th>
                        <th className="border-b border-gray-300 px-4 py-2 text-center font-semibold">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.personality.map((trait, index) => (
                        <tr key={index}>
                          <td className="border-b border-gray-200 px-4 py-2">{trait.trait}</td>
                          <td className="border-b border-gray-200 px-4 py-2 text-center">
                            <Badge variant="outline">{trait.grade}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* ====== ATTENDANCE ====== */}
            <div className="report-section mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance Record</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600">Total Working Days</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.attendance.totalWorkingDays}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600">Present Days</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reportData.attendance.presentDays}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600">Attendance Percentage</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {reportData.attendance.percentage}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator className="my-6" />

            {/* ====== TEACHER REMARKS ====== */}
            <div className="report-section mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Class Teacher's Remarks</h3>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                <p className="text-gray-800 italic">{reportData.teacherRemarks}</p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* ====== FINAL RESULT ====== */}
            <div className="report-section mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Final Result</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-gray-700">Total Marks:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {reportData.totalMarksObtained} / {reportData.totalMaxMarks}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-gray-700">Overall Percentage:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {reportData.overallPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-gray-700">Grade:</span>
                    <Badge className="text-lg bg-green-600 text-white">
                      {reportData.finalGrade}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-gray-700">Division:</span>
                    <span className="text-lg font-bold text-purple-600">
                      {reportData.division}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-gray-700">Result:</span>
                    <Badge
                      className={`text-lg ${
                        reportData.result === 'Pass'
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {reportData.result}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* ====== PROMOTION STATUS ====== */}
            {reportData.result === 'Pass' && (
              <div className="report-section bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-bold text-green-900 text-lg">Promotion Status</p>
                    <p className="text-green-800">{reportData.promotionStatus}</p>
                  </div>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* ====== SIGNATURES (Print View) ====== */}
            <div className="signature-grid grid grid-cols-3 gap-8 mt-12 print:block">
              <div className="text-center">
                <div className="signature-line border-t-2 border-gray-400 pt-2 mt-16">
                  <p className="font-semibold text-gray-700">Class Teacher</p>
                </div>
              </div>
              <div className="text-center">
                <div className="signature-line border-t-2 border-gray-400 pt-2 mt-16">
                  <p className="font-semibold text-gray-700">Parent/Guardian</p>
                </div>
              </div>
              <div className="text-center">
                <div className="signature-line border-t-2 border-gray-400 pt-2 mt-16">
                  <p className="font-semibold text-gray-700">Principal</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ====== FOOTER PRINT INFO ====== */}
        <div className="hidden print:block text-center mt-4 text-xs text-gray-500">
          <p>This is a computer-generated report card and does not require a signature.</p>
          <p>Generated on: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* ====== PRINT STYLES ====== */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-shadow: none !important;
            text-shadow: none !important;
            -webkit-font-smoothing: antialiased !important;
            text-rendering: geometricPrecision !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            font-size: 8.1px !important;
            line-height: 1.12 !important;
            color: #0b1220 !important;
          }

          .report-card-print-root,
          .report-card-print-sheet {
            display: block !important;
            visibility: visible !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }

          /* Single-page fit: use zoom to avoid transform pagination issues */
          .report-card-paper {
            zoom: 0.72 !important;
            transform: none !important;
            width: 100% !important;
            margin: 0 !important;
            border: 1.2px solid #1e3a8a !important;
            border-radius: 0 !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
          }

          .report-card-paper .p-6,
          .report-card-paper .print\:p-8 {
            padding: 0.3rem !important;
          }

          .report-section {
            margin-bottom: 0.22rem !important;
            page-break-inside: auto !important;
          }

          .my-6,
          .mb-6,
          .mb-4,
          .mt-12,
          .mt-4,
          .mt-3 {
            margin-top: 0.12rem !important;
            margin-bottom: 0.12rem !important;
          }

          .report-section h3 {
            font-size: 8.3px !important;
            font-weight: 700 !important;
            color: #1e3a8a !important;
            border-bottom: 1px solid #60a5fa !important;
            padding-bottom: 1px !important;
            margin-bottom: 3px !important;
            letter-spacing: 0.1px !important;
          }

          .report-table,
          .mini-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }

          .report-table th,
          .report-table td,
          .mini-table th,
          .mini-table td {
            border: 1px solid #94a3b8 !important;
            padding: 1px 2px !important;
            color: #0f172a !important;
            font-size: 6.9px !important;
            line-height: 1.14 !important;
          }

          .report-table th,
          .mini-table th,
          .report-card-paper .bg-gray-100,
          .report-card-paper .bg-blue-50 {
            background: #bfdbfe !important;
            color: #1e40af !important;
            font-weight: 700 !important;
          }

          .report-card-paper .text-blue-600,
          .report-card-paper .text-blue-900,
          .report-card-paper .text-green-600,
          .report-card-paper .text-purple-600 {
            color: #1e3a8a !important;
          }

          .report-card-paper .border-2,
          .report-card-paper .border,
          .report-card-paper .border-gray-300,
          .report-card-paper .border-gray-400,
          .report-card-paper .border-green-500 {
            border-color: #94a3b8 !important;
          }

          .report-card-paper [class*="bg-amber"],
          .report-card-paper [class*="bg-green"],
          .report-card-paper [class*="bg-red"],
          .report-card-paper [class*="bg-purple"] {
            background: #eff6ff !important;
            color: #0f172a !important;
          }

          svg {
            display: none !important;
          }

          .signature-grid {
            margin-top: 4px !important;
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
          }

          .signature-line {
            border-top: 1px solid #1e3a8a !important;
            padding-top: 1px !important;
          }

          .hidden.print\:block.text-center.mt-4.text-xs.text-gray-500 {
            margin-top: 2px !important;
            font-size: 6.2px !important;
            line-height: 1.05 !important;
            break-inside: avoid-page !important;
            color: #334155 !important;
          }

          .print\:p-8 {
            padding: 0.35rem !important;
          }

          .print\:mb-6 {
            margin-bottom: 0.2rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentReportCardPage;
