import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
	Users,
	Award,
	CheckCircle,
	AlertTriangle,
	TrendingUp,
	FileCheck,
	Download,
	RefreshCw,
	Eye,
	Edit,
	Save,
	X,
	ChevronLeft,
	ChevronRight,
	Mail,
	Phone,
	UserCheck,
	UserX,
	Calendar,
	BarChart,
	BookOpen,
	GraduationCap,
	Trophy,
	Medal,
	Search,
	Send,
	FileText,
} from 'lucide-react';

type StudentMarks = {
	studentId: string;
	studentName: string;
	rollNumber: string;
	english: number;
	mathematics: number;
	science: number;
	social: number;
	hindi: number;
	total: number;
	percentage: number;
	status: 'pass' | 'fail';
	verified: boolean;
	parentContact?: string;
	parentEmail?: string;
	remarks?: string;
};

type SubjectSummary = {
	subject: string;
	totalMarks: number;
	classAverage: number;
	highest: number;
	lowest: number;
	passCount: number;
	failCount: number;
	aboveAverage: number;
	belowAverage: number;
};

type ClassStats = {
	totalStudents: number;
	passCount: number;
	failCount: number;
	verifiedCount: number;
	pendingVerification: number;
	avgPercentage: string;
	passPercentage: string;
	aboveAverageCount: number;
	belowAverageCount: number;
	highestScorer: string;
	highestScore: number;
	lowestScorer: string;
	lowestScore: number;
	topThree: Array<{ name: string; percentage: number }>;
};

const academicYears = ['2025-26', '2024-25', '2023-24'];
const examTypes = ['Unit Test 1', 'Unit Test 2', 'Quarterly Exam', 'Half Yearly Exam', 'Annual Exam'];
const classes = [
	{ value: '10A', label: 'Class 10 - A', students: 42 },
	{ value: '10B', label: 'Class 10 - B', students: 38 },
	{ value: '9A', label: 'Class 9 - A', students: 45 },
	{ value: '9B', label: 'Class 9 - B', students: 41 },
	{ value: '8A', label: 'Class 8 - A', students: 39 },
	{ value: '8B', label: 'Class 8 - B', students: 37 },
];

const initialStudentMarksData: StudentMarks[] = [
	{
		studentId: 'S001',
		studentName: 'Aarav Kumar',
		rollNumber: '10A-01',
		english: 84,
		mathematics: 78,
		science: 86,
		social: 81,
		hindi: 88,
		total: 417,
		percentage: 83.4,
		status: 'pass',
		verified: true,
		parentContact: '9876543210',
		parentEmail: 'parent.aarav@email.com',
		remarks: 'Good performance overall',
	},
	{
		studentId: 'S002',
		studentName: 'Sneha Reddy',
		rollNumber: '10A-02',
		english: 93,
		mathematics: 96,
		science: 95,
		social: 91,
		hindi: 90,
		total: 465,
		percentage: 93.0,
		status: 'pass',
		verified: true,
		parentContact: '9876543211',
		parentEmail: 'parent.sneha@email.com',
		remarks: 'Excellent student',
	},
	{
		studentId: 'S003',
		studentName: 'Rohan Singh',
		rollNumber: '10A-03',
		english: 72,
		mathematics: 68,
		science: 74,
		social: 70,
		hindi: 76,
		total: 360,
		percentage: 72.0,
		status: 'pass',
		verified: true,
		parentContact: '9876543212',
		parentEmail: 'parent.rohan@email.com',
		remarks: 'Consistent performer',
	},
	{
		studentId: 'S004',
		studentName: 'Priya Sharma',
		rollNumber: '10A-04',
		english: 88,
		mathematics: 91,
		science: 89,
		social: 87,
		hindi: 85,
		total: 440,
		percentage: 88.0,
		status: 'pass',
		verified: false,
		parentContact: '9876543213',
		parentEmail: 'parent.priya@email.com',
		remarks: 'Needs verification',
	},
	{
		studentId: 'S005',
		studentName: 'Rahul Verma',
		rollNumber: '10A-05',
		english: 64,
		mathematics: 32,
		science: 61,
		social: 66,
		hindi: 70,
		total: 293,
		percentage: 58.6,
		status: 'fail',
		verified: false,
		parentContact: '9876543214',
		parentEmail: 'parent.rahul@email.com',
		remarks: 'Needs improvement in Mathematics',
	},
	{
		studentId: 'S006',
		studentName: 'Ananya Gupta',
		rollNumber: '10A-06',
		english: 91,
		mathematics: 88,
		science: 92,
		social: 89,
		hindi: 87,
		total: 447,
		percentage: 89.4,
		status: 'pass',
		verified: false,
		parentContact: '9876543215',
		parentEmail: 'parent.ananya@email.com',
		remarks: 'Pending verification',
	},
	{
		studentId: 'S007',
		studentName: 'Vikram Singh',
		rollNumber: '10A-07',
		english: 76,
		mathematics: 71,
		science: 73,
		social: 69,
		hindi: 72,
		total: 361,
		percentage: 72.2,
		status: 'pass',
		verified: true,
		parentContact: '9876543216',
		parentEmail: 'parent.vikram@email.com',
		remarks: 'Satisfactory',
	},
	{
		studentId: 'S008',
		studentName: 'Divya Nair',
		rollNumber: '10A-08',
		english: 58,
		mathematics: 44,
		science: 52,
		social: 61,
		hindi: 63,
		total: 278,
		percentage: 55.6,
		status: 'fail',
		verified: true,
		parentContact: '9876543217',
		parentEmail: 'parent.divya@email.com',
		remarks: 'Needs extra attention',
	},
];

const calculateSubjectSummary = (data: StudentMarks[]): SubjectSummary[] => {
	if (data.length === 0) {
		return [];
	}

	const subjects = ['english', 'mathematics', 'science', 'social', 'hindi'] as const;
	const subjectLabels = ['English', 'Mathematics', 'Science', 'Social', 'Hindi'];

	return subjects.map((subject, idx) => {
		const marks = data.map((student) => student[subject]);
		const average = marks.reduce((sum, mark) => sum + mark, 0) / marks.length;
		const passCount = marks.filter((mark) => mark >= 35).length;
		const classAverage = Number(average.toFixed(2));
		const aboveAverage = marks.filter((mark) => mark > classAverage).length;
		const belowAverage = marks.filter((mark) => mark < classAverage).length;

		return {
			subject: subjectLabels[idx],
			totalMarks: 100,
			classAverage,
			highest: Math.max(...marks),
			lowest: Math.min(...marks),
			passCount,
			failCount: marks.length - passCount,
			aboveAverage,
			belowAverage,
		};
	});
};

const calculateStats = (data: StudentMarks[]): ClassStats => {
	const totalStudents = data.length;

	if (totalStudents === 0) {
		return {
			totalStudents: 0,
			passCount: 0,
			failCount: 0,
			verifiedCount: 0,
			pendingVerification: 0,
			avgPercentage: '0.00',
			passPercentage: '0.0',
			aboveAverageCount: 0,
			belowAverageCount: 0,
			highestScorer: '',
			highestScore: 0,
			lowestScorer: '',
			lowestScore: 0,
			topThree: [],
		};
	}

	const passCount = data.filter((s) => s.status === 'pass').length;
	const verifiedCount = data.filter((s) => s.verified).length;
	const avgPercentage = (data.reduce((sum, s) => sum + s.percentage, 0) / totalStudents).toFixed(2);
	const aboveAverageCount = data.filter((s) => s.percentage > Number(avgPercentage)).length;
	const belowAverageCount = data.filter((s) => s.percentage < Number(avgPercentage)).length;

	const sortedByPercentage = [...data].sort((a, b) => b.percentage - a.percentage);
	const highestScorer = sortedByPercentage[0];
	const lowestScorer = sortedByPercentage[sortedByPercentage.length - 1];
	const topThree = sortedByPercentage.slice(0, 3).map((s) => ({
		name: s.studentName,
		percentage: s.percentage,
	}));

	return {
		totalStudents,
		passCount,
		failCount: totalStudents - passCount,
		verifiedCount,
		pendingVerification: totalStudents - verifiedCount,
		avgPercentage,
		passPercentage: ((passCount / totalStudents) * 100).toFixed(1),
		aboveAverageCount,
		belowAverageCount,
		highestScorer: highestScorer?.studentName || '',
		highestScore: highestScorer?.percentage || 0,
		lowestScorer: lowestScorer?.studentName || '',
		lowestScore: lowestScorer?.percentage || 0,
		topThree,
	};
};

const getStatusBadge = (status: 'pass' | 'fail') => {
	if (status === 'pass') {
		return <Badge className="bg-green-100 text-green-800 border-green-200">Pass</Badge>;
	}
	return <Badge className="bg-red-100 text-red-800 border-red-200">Fail</Badge>;
};

const getMarkColor = (mark: number) => {
	if (mark >= 90) return 'text-green-700 font-bold';
	if (mark >= 75) return 'text-blue-700 font-semibold';
	if (mark >= 50) return 'text-gray-700';
	if (mark >= 35) return 'text-orange-700';
	return 'text-red-700 font-semibold';
};

const getPerformanceLabel = (percentage: number) => {
	if (percentage >= 90) return { label: 'Excellent', color: 'bg-green-600' };
	if (percentage >= 75) return { label: 'Very Good', color: 'bg-blue-600' };
	if (percentage >= 60) return { label: 'Good', color: 'bg-teal-600' };
	if (percentage >= 50) return { label: 'Average', color: 'bg-yellow-600' };
	if (percentage >= 35) return { label: 'Below Average', color: 'bg-orange-600' };
	return { label: 'Poor', color: 'bg-red-600' };
};

export default function ClassProgressPage() {
	const [studentMarksData, setStudentMarksData] = useState<StudentMarks[]>(initialStudentMarksData);
	const [selectedYear, setSelectedYear] = useState('2025-26');
	const [selectedExam, setSelectedExam] = useState('Unit Test 2');
	const [selectedClass, setSelectedClass] = useState('10A');
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail'>('all');
	const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');

	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isVerifyAllDialogOpen, setIsVerifyAllDialogOpen] = useState(false);
	const [isSendNotificationDialogOpen, setIsSendNotificationDialogOpen] = useState(false);
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	const [isStudentDetailsDialogOpen, setIsStudentDetailsDialogOpen] = useState(false);
	const [selectedStudent, setSelectedStudent] = useState<StudentMarks | null>(null);

	const [editFormData, setEditFormData] = useState<StudentMarks | null>(null);
	const [notificationMessage, setNotificationMessage] = useState('');
	const [notificationType, setNotificationType] = useState<'sms' | 'email' | 'both'>('both');

	const subjectSummary = useMemo(() => calculateSubjectSummary(studentMarksData), [studentMarksData]);
	const stats = useMemo(() => calculateStats(studentMarksData), [studentMarksData]);

	const filteredStudents = useMemo(() => {
		return studentMarksData.filter((student) => {
			const matchesSearch =
				searchTerm === '' ||
				student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

			const matchesVerification =
				verificationFilter === 'all' ||
				(verificationFilter === 'verified' && student.verified) ||
				(verificationFilter === 'pending' && !student.verified);

			return matchesSearch && matchesStatus && matchesVerification;
		});
	}, [studentMarksData, searchTerm, statusFilter, verificationFilter]);

	const handleRefresh = () => {
		setStudentMarksData([...initialStudentMarksData]);
		toast.success('Data refreshed successfully');
	};

	const handleExport = () => {
		setIsExportDialogOpen(true);
	};

	const handleExportCSV = () => {
		const headers = [
			'Roll No',
			'Student Name',
			'English',
			'Mathematics',
			'Science',
			'Social',
			'Hindi',
			'Total',
			'Percentage',
			'Status',
			'Verified',
		];

		const rows = filteredStudents.map((s) => [
			s.rollNumber,
			s.studentName,
			s.english,
			s.mathematics,
			s.science,
			s.social,
			s.hindi,
			s.total,
			s.percentage.toFixed(1),
			s.status,
			s.verified ? 'Yes' : 'No',
		]);

		const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');

		a.href = url;
		a.download = `class-progress-${selectedClass}-${selectedExam}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);

		setIsExportDialogOpen(false);
		toast.success('CSV file downloaded successfully');
	};

	const handleExportPDF = () => {
		const printWindow = window.open('', '_blank');
		if (!printWindow) {
			toast.error('Please allow pop-ups to print');
			return;
		}

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Class Progress Report - ${selectedClass}</title>
				<style>
					body { font-family: Arial, sans-serif; padding: 20px; }
					h1 { color: #2563eb; text-align: center; }
					.header { text-align: center; margin-bottom: 20px; }
					.stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
					.stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; flex: 1; min-width: 150px; }
					table { width: 100%; border-collapse: collapse; margin-top: 20px; }
					th { background: #2563eb; color: white; padding: 10px; text-align: left; }
					td { padding: 8px; border-bottom: 1px solid #ddd; }
					.pass { color: green; font-weight: bold; }
					.fail { color: red; font-weight: bold; }
					.footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
				</style>
			</head>
			<body>
				<div class="header">
					<h1>Class Progress Report</h1>
					<p>Class: ${selectedClass} | Exam: ${selectedExam} | Academic Year: ${selectedYear}</p>
					<p>Generated on: ${new Date().toLocaleString()}</p>
				</div>

				<div class="stats">
					<div class="stat-card">
						<h3>Total Students</h3>
						<p style="font-size: 24px; margin: 5px 0;">${stats.totalStudents}</p>
					</div>
					<div class="stat-card">
						<h3>Pass Rate</h3>
						<p style="font-size: 24px; margin: 5px 0; color: green;">${stats.passPercentage}%</p>
					</div>
					<div class="stat-card">
						<h3>Class Average</h3>
						<p style="font-size: 24px; margin: 5px 0;">${stats.avgPercentage}%</p>
					</div>
					<div class="stat-card">
						<h3>Verified</h3>
						<p style="font-size: 24px; margin: 5px 0;">${stats.verifiedCount}/${stats.totalStudents}</p>
					</div>
				</div>

				<h2>Student Marks</h2>
				<table>
					<thead>
						<tr>
							<th>Roll No</th>
							<th>Student Name</th>
							<th>Eng</th>
							<th>Math</th>
							<th>Sci</th>
							<th>Soc</th>
							<th>Hin</th>
							<th>Total</th>
							<th>%</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						${filteredStudents
							.map(
								(s) => `
							<tr>
								<td>${s.rollNumber}</td>
								<td>${s.studentName}</td>
								<td>${s.english}</td>
								<td>${s.mathematics}</td>
								<td>${s.science}</td>
								<td>${s.social}</td>
								<td>${s.hindi}</td>
								<td>${s.total}</td>
								<td>${s.percentage}%</td>
								<td class="${s.status}">${s.status}</td>
							</tr>
						`,
							)
							.join('')}
					</tbody>
				</table>

				<div class="footer">
					<p>Generated by School ERP System</p>
				</div>
			</body>
			</html>
		`;

		printWindow.document.write(htmlContent);
		printWindow.document.close();
		printWindow.print();

		setIsExportDialogOpen(false);
		toast.success('PDF generated successfully');
	};

	const handleVerifyAll = () => {
		const updatedData = studentMarksData.map((student) => ({
			...student,
			verified: true,
		}));
		setStudentMarksData(updatedData);
		setIsVerifyAllDialogOpen(false);
		toast.success('All marks verified successfully');
	};

	const handleVerifyStudent = (studentId: string) => {
		const updatedData = studentMarksData.map((student) =>
			student.studentId === studentId ? { ...student, verified: true } : student,
		);
		setStudentMarksData(updatedData);
		toast.success('Student marks verified');
	};

	const handleEditStudent = () => {
		if (!editFormData) return;

		const total =
			editFormData.english +
			editFormData.mathematics +
			editFormData.science +
			editFormData.social +
			editFormData.hindi;
		const percentage = Number((total / 5).toFixed(1));
		const status: StudentMarks['status'] = percentage >= 35 ? 'pass' : 'fail';

		const updatedStudent: StudentMarks = {
			...editFormData,
			total,
			percentage,
			status,
		};

		const updatedData = studentMarksData.map((student) =>
			student.studentId === editFormData.studentId ? updatedStudent : student,
		);

		setStudentMarksData(updatedData);
		setIsEditDialogOpen(false);
		setSelectedStudent(null);
		setEditFormData(null);
		toast.success('Student marks updated successfully');
	};

	const handleSendNotification = () => {
		if (!notificationMessage.trim()) {
			toast.error('Please enter a message');
			return;
		}

		const selectedStudents = filteredStudents.filter((s) => !s.verified);

		if (notificationType === 'sms' || notificationType === 'both') {
			toast.success(`SMS sent to ${selectedStudents.length} parents`);
		}
		if (notificationType === 'email' || notificationType === 'both') {
			toast.success(`Email sent to ${selectedStudents.length} parents`);
		}

		setIsSendNotificationDialogOpen(false);
		setNotificationMessage('');
	};

	const resetFilters = () => {
		setSearchTerm('');
		setStatusFilter('all');
		setVerificationFilter('all');
		toast.success('Filters reset');
	};

	const viewStudentDetails = (student: StudentMarks) => {
		setSelectedStudent(student);
		setIsStudentDetailsDialogOpen(true);
	};

	const renderHeader = () => (
		<div className="flex flex-col md:flex-row items-start justify-between gap-4">
			<div>
				<h1 className="text-3xl font-bold">Class Progress Review</h1>
				<p className="text-muted-foreground mt-1">
					Review class-level performance, verify subject marks, and track student progress.
				</p>
			</div>
			<div className="flex items-center gap-2">
				<Button variant="outline" onClick={handleRefresh}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Refresh
				</Button>
				<Button onClick={handleExport}>
					<Download className="h-4 w-4 mr-2" />
					Export
				</Button>
			</div>
		</div>
	);

	const renderStats = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Total Students</p>
							<p className="text-2xl font-bold">{stats.totalStudents}</p>
						</div>
						<Users className="h-8 w-8 text-blue-600" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Class Average</p>
							<p className="text-2xl font-bold">{stats.avgPercentage}%</p>
						</div>
						<TrendingUp className="h-8 w-8 text-green-600" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Pass Rate</p>
							<p className="text-2xl font-bold text-green-600">{stats.passPercentage}%</p>
						</div>
						<Award className="h-8 w-8 text-green-600" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Verified</p>
							<p className="text-2xl font-bold">
								{stats.verifiedCount}/{stats.totalStudents}
							</p>
						</div>
						<CheckCircle className="h-8 w-8 text-blue-600" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Needs Review</p>
							<p className="text-2xl font-bold text-yellow-600">{stats.pendingVerification}</p>
						</div>
						<AlertTriangle className="h-8 w-8 text-yellow-600" />
					</div>
				</CardContent>
			</Card>
		</div>
	);

	const renderFilters = () => (
		<Card>
			<CardContent className="p-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Select value={selectedYear} onValueChange={setSelectedYear}>
						<SelectTrigger>
							<Calendar className="h-4 w-4 mr-2" />
							<SelectValue placeholder="Academic Year" />
						</SelectTrigger>
						<SelectContent>
							{academicYears.map((year) => (
								<SelectItem key={year} value={year}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={selectedExam} onValueChange={setSelectedExam}>
						<SelectTrigger>
							<BookOpen className="h-4 w-4 mr-2" />
							<SelectValue placeholder="Exam Type" />
						</SelectTrigger>
						<SelectContent>
							{examTypes.map((exam) => (
								<SelectItem key={exam} value={exam}>
									{exam}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={selectedClass} onValueChange={setSelectedClass}>
						<SelectTrigger>
							<Users className="h-4 w-4 mr-2" />
							<SelectValue placeholder="Class" />
						</SelectTrigger>
						<SelectContent>
							{classes.map((cls) => (
								<SelectItem key={cls.value} value={cls.value}>
									{cls.label} ({cls.students} students)
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search students..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>

				<div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
					<div className="flex items-center gap-4 flex-wrap">
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Status:</span>
							<Select
								value={statusFilter}
								onValueChange={(value: 'all' | 'pass' | 'fail') => setStatusFilter(value)}
							>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="pass">Pass</SelectItem>
									<SelectItem value="fail">Fail</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Verification:</span>
							<Select
								value={verificationFilter}
								onValueChange={(value: 'all' | 'verified' | 'pending') => setVerificationFilter(value)}
							>
								<SelectTrigger className="w-[130px]">
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="verified">Verified</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Button variant="ghost" size="sm" onClick={resetFilters}>
							<X className="h-4 w-4 mr-2" />
							Reset
						</Button>
					</div>

					<Badge variant="outline">
						Showing {filteredStudents.length} of {studentMarksData.length} students
					</Badge>
				</div>
			</CardContent>
		</Card>
	);

	const renderStudentMarksTab = () => (
		<TabsContent value="student-marks" className="space-y-4">
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5 text-blue-600" />
							Student-wise Marks & Verification
						</CardTitle>
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => setIsSendNotificationDialogOpen(true)}
								disabled={stats.pendingVerification === 0}
							>
								<Mail className="h-4 w-4 mr-2" />
								Notify Parents
							</Button>
							<Button
								size="sm"
								onClick={() => setIsVerifyAllDialogOpen(true)}
								disabled={stats.pendingVerification === 0}
							>
								<FileCheck className="h-4 w-4 mr-2" />
								Verify All
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="border rounded-lg overflow-hidden">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Roll No</TableHead>
										<TableHead>Student Name</TableHead>
										<TableHead>English</TableHead>
										<TableHead>Maths</TableHead>
										<TableHead>Science</TableHead>
										<TableHead>Social</TableHead>
										<TableHead>Hindi</TableHead>
										<TableHead>Total</TableHead>
										<TableHead>%</TableHead>
										<TableHead>Performance</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Verified</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredStudents.length === 0 ? (
										<TableRow>
											<TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
												No students found matching the filters
											</TableCell>
										</TableRow>
									) : (
										filteredStudents.map((student) => {
											const performance = getPerformanceLabel(student.percentage);
											return (
												<TableRow key={student.studentId} className="hover:bg-gray-50">
													<TableCell className="font-medium">{student.rollNumber}</TableCell>
													<TableCell>{student.studentName}</TableCell>
													<TableCell className={getMarkColor(student.english)}>{student.english}</TableCell>
													<TableCell className={getMarkColor(student.mathematics)}>{student.mathematics}</TableCell>
													<TableCell className={getMarkColor(student.science)}>{student.science}</TableCell>
													<TableCell className={getMarkColor(student.social)}>{student.social}</TableCell>
													<TableCell className={getMarkColor(student.hindi)}>{student.hindi}</TableCell>
													<TableCell className="font-bold">{student.total}</TableCell>
													<TableCell className="font-semibold">{student.percentage}%</TableCell>
													<TableCell>
														<Badge className={`${performance.color} text-white`}>{performance.label}</Badge>
													</TableCell>
													<TableCell>{getStatusBadge(student.status)}</TableCell>
													<TableCell>
														{student.verified ? (
															<Badge className="bg-green-100 text-green-800">
																<CheckCircle className="h-3 w-3 mr-1" />
																Verified
															</Badge>
														) : (
															<Badge variant="outline" className="text-yellow-600">
																Pending
															</Badge>
														)}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end gap-1">
															<Button
																size="sm"
																variant="ghost"
																onClick={() => viewStudentDetails(student)}
																title="View Details"
															>
																<Eye className="h-4 w-4" />
															</Button>
															<Button
																size="sm"
																variant="ghost"
																onClick={() => {
																	setEditFormData({ ...student });
																	setIsEditDialogOpen(true);
																}}
																title="Edit Marks"
															>
																<Edit className="h-4 w-4" />
															</Button>
															{!student.verified && (
																<Button
																	size="sm"
																	variant="ghost"
																	className="text-green-600 hover:text-green-700"
																	onClick={() => handleVerifyStudent(student.studentId)}
																	title="Verify"
																>
																	<CheckCircle className="h-4 w-4" />
																</Button>
															)}
														</div>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</div>
					</div>

					{filteredStudents.length > 0 && (
						<div className="flex items-center justify-between mt-4">
							<div className="text-sm text-muted-foreground">
								Showing 1 to {filteredStudents.length} of {filteredStudents.length} entries
							</div>
							<div className="flex items-center gap-2">
								<Button variant="outline" size="sm" disabled>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button variant="outline" size="sm" className="bg-blue-600 text-white">
									1
								</Button>
								<Button variant="outline" size="sm" disabled>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Pass/Fail Distribution</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div>
								<div className="flex items-center justify-between text-sm mb-1">
									<span className="flex items-center gap-1">
										<UserCheck className="h-4 w-4 text-green-600" />
										Passed
									</span>
									<span className="font-bold text-green-600">{stats.passCount}</span>
								</div>
								<Progress value={(stats.passCount / stats.totalStudents) * 100} className="h-2" />
							</div>
							<div>
								<div className="flex items-center justify-between text-sm mb-1">
									<span className="flex items-center gap-1">
										<UserX className="h-4 w-4 text-red-600" />
										Failed
									</span>
									<span className="font-bold text-red-600">{stats.failCount}</span>
								</div>
								<Progress value={(stats.failCount / stats.totalStudents) * 100} className="h-2 bg-red-100" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Performance Distribution</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Above Average</span>
								<span className="font-bold text-blue-600">{stats.aboveAverageCount}</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span>Below Average</span>
								<span className="font-bold text-orange-600">{stats.belowAverageCount}</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span>Class Average</span>
								<span className="font-bold text-green-600">{stats.avgPercentage}%</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Top Performers</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{stats.topThree.map((student, index) => (
								<div key={index} className="flex items-center gap-2 text-sm">
									{index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
									{index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
									{index === 2 && <Medal className="h-4 w-4 text-amber-600" />}
									<span className="truncate flex-1">{student.name}</span>
									<Badge className="bg-green-600">{student.percentage}%</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</TabsContent>
	);

	const renderSubjectSummaryTab = () => (
		<TabsContent value="subject-summary" className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart className="h-5 w-5 text-blue-600" />
						Subject-wise Performance Analysis
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="border rounded-lg overflow-hidden">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Subject</TableHead>
										<TableHead>Max Marks</TableHead>
										<TableHead>Class Avg</TableHead>
										<TableHead>Highest</TableHead>
										<TableHead>Lowest</TableHead>
										<TableHead>Pass Count</TableHead>
										<TableHead>Fail Count</TableHead>
										<TableHead>Above Avg</TableHead>
										<TableHead>Below Avg</TableHead>
										<TableHead>Pass Rate</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{subjectSummary.map((subject) => {
										const passRate = (subject.passCount / stats.totalStudents) * 100;
										return (
											<TableRow key={subject.subject}>
												<TableCell className="font-medium">{subject.subject}</TableCell>
												<TableCell>{subject.totalMarks}</TableCell>
												<TableCell className="font-semibold">{subject.classAverage}%</TableCell>
												<TableCell className="text-green-700 font-bold">{subject.highest}</TableCell>
												<TableCell className="text-red-700 font-bold">{subject.lowest}</TableCell>
												<TableCell>
													<Badge className="bg-green-100 text-green-800">{subject.passCount}</Badge>
												</TableCell>
												<TableCell>
													<Badge className="bg-red-100 text-red-800">{subject.failCount}</Badge>
												</TableCell>
												<TableCell>
													<Badge className="bg-blue-100 text-blue-800">{subject.aboveAverage}</Badge>
												</TableCell>
												<TableCell>
													<Badge className="bg-orange-100 text-orange-800">{subject.belowAverage}</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Progress value={passRate} className="w-16 h-2" />
														<span className="text-sm font-medium">{passRate.toFixed(0)}%</span>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="border-green-200 bg-green-50">
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<Award className="h-5 w-5 text-green-600" />
							<p className="font-semibold text-green-800">Best Subject</p>
						</div>
						<p className="text-2xl font-bold text-green-900">
							{subjectSummary.reduce((best, current) =>
								current.classAverage > best.classAverage ? current : best,
							).subject}
						</p>
						<p className="text-sm text-green-700 mt-1">
							Avg:{' '}
							{
								subjectSummary.reduce((best, current) =>
									current.classAverage > best.classAverage ? current : best,
								).classAverage
							}
							%
						</p>
					</CardContent>
				</Card>

				<Card className="border-yellow-200 bg-yellow-50">
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<AlertTriangle className="h-5 w-5 text-yellow-600" />
							<p className="font-semibold text-yellow-800">Needs Attention</p>
						</div>
						<p className="text-2xl font-bold text-yellow-900">
							{subjectSummary.reduce((worst, current) =>
								current.classAverage < worst.classAverage ? current : worst,
							).subject}
						</p>
						<p className="text-sm text-yellow-700 mt-1">
							Avg:{' '}
							{
								subjectSummary.reduce((worst, current) =>
									current.classAverage < worst.classAverage ? current : worst,
								).classAverage
							}
							%
						</p>
					</CardContent>
				</Card>

				<Card className="border-purple-200 bg-purple-50">
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<GraduationCap className="h-5 w-5 text-purple-600" />
							<p className="font-semibold text-purple-800">Overall Class Health</p>
						</div>
						<p className="text-2xl font-bold text-purple-900">
							{Number(stats.passPercentage) >= 90
								? '🌟 Excellent'
								: Number(stats.passPercentage) >= 75
									? '✅ Good'
									: Number(stats.passPercentage) >= 60
										? '⚠️ Average'
										: '❌ Needs Work'}
						</p>
						<p className="text-sm text-purple-700 mt-1">{stats.passPercentage}% pass rate</p>
					</CardContent>
				</Card>
			</div>
		</TabsContent>
	);

	const renderStudentDetailsDialog = () => (
		<Dialog open={isStudentDetailsDialogOpen} onOpenChange={setIsStudentDetailsDialogOpen}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Student Details</DialogTitle>
				</DialogHeader>
				{selectedStudent && (
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">Student Name</p>
								<p className="font-medium">{selectedStudent.studentName}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Roll Number</p>
								<p className="font-medium">{selectedStudent.rollNumber}</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">Parent Contact</p>
								<p className="font-medium flex items-center gap-2">
									<Phone className="h-4 w-4" />
									{selectedStudent.parentContact}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Parent Email</p>
								<p className="font-medium flex items-center gap-2">
									<Mail className="h-4 w-4" />
									{selectedStudent.parentEmail}
								</p>
							</div>
						</div>

						<div className="border rounded-lg p-4">
							<h4 className="font-semibold mb-3">Marks Details</h4>
							<div className="grid grid-cols-5 gap-2">
								<div className="text-center">
									<p className="text-sm text-muted-foreground">English</p>
									<p className={`text-lg font-bold ${getMarkColor(selectedStudent.english)}`}>
										{selectedStudent.english}
									</p>
								</div>
								<div className="text-center">
									<p className="text-sm text-muted-foreground">Maths</p>
									<p className={`text-lg font-bold ${getMarkColor(selectedStudent.mathematics)}`}>
										{selectedStudent.mathematics}
									</p>
								</div>
								<div className="text-center">
									<p className="text-sm text-muted-foreground">Science</p>
									<p className={`text-lg font-bold ${getMarkColor(selectedStudent.science)}`}>
										{selectedStudent.science}
									</p>
								</div>
								<div className="text-center">
									<p className="text-sm text-muted-foreground">Social</p>
									<p className={`text-lg font-bold ${getMarkColor(selectedStudent.social)}`}>
										{selectedStudent.social}
									</p>
								</div>
								<div className="text-center">
									<p className="text-sm text-muted-foreground">Hindi</p>
									<p className={`text-lg font-bold ${getMarkColor(selectedStudent.hindi)}`}>
										{selectedStudent.hindi}
									</p>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">Total Marks</p>
								<p className="text-xl font-bold">{selectedStudent.total}/500</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Percentage</p>
								<p className="text-xl font-bold">{selectedStudent.percentage}%</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">Status</p>
								<div>{getStatusBadge(selectedStudent.status)}</div>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Verification</p>
								{selectedStudent.verified ? (
									<Badge className="bg-green-100 text-green-800">
										<CheckCircle className="h-3 w-3 mr-1" />
										Verified
									</Badge>
								) : (
									<Badge variant="outline" className="text-yellow-600">
										Pending
									</Badge>
								)}
							</div>
						</div>

						{selectedStudent.remarks && (
							<div>
								<p className="text-sm text-muted-foreground">Remarks</p>
								<p className="p-3 bg-gray-50 rounded-lg">{selectedStudent.remarks}</p>
							</div>
						)}
					</div>
				)}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => {
							setIsStudentDetailsDialogOpen(false);
							setSelectedStudent(null);
						}}
					>
						Close
					</Button>
					{selectedStudent && !selectedStudent.verified && (
						<Button
							className="bg-green-600 hover:bg-green-700"
							onClick={() => {
								handleVerifyStudent(selectedStudent.studentId);
								setIsStudentDetailsDialogOpen(false);
								setSelectedStudent(null);
							}}
						>
							<CheckCircle className="h-4 w-4 mr-2" />
							Verify Now
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	const renderEditDialog = () => (
		<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Edit Student Marks</DialogTitle>
					<DialogDescription>Update marks for {editFormData?.studentName}</DialogDescription>
				</DialogHeader>
				{editFormData && (
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>English</Label>
								<Input
									type="number"
									min="0"
									max="100"
									value={editFormData.english}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											english: parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Mathematics</Label>
								<Input
									type="number"
									min="0"
									max="100"
									value={editFormData.mathematics}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											mathematics: parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Science</Label>
								<Input
									type="number"
									min="0"
									max="100"
									value={editFormData.science}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											science: parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Social</Label>
								<Input
									type="number"
									min="0"
									max="100"
									value={editFormData.social}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											social: parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Hindi</Label>
							<Input
								type="number"
								min="0"
								max="100"
								value={editFormData.hindi}
								onChange={(e) =>
									setEditFormData({
										...editFormData,
										hindi: parseInt(e.target.value) || 0,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<Label>Remarks</Label>
							<Input
								value={editFormData.remarks || ''}
								onChange={(e) =>
									setEditFormData({
										...editFormData,
										remarks: e.target.value,
									})
								}
								placeholder="Add remarks..."
							/>
						</div>
					</div>
				)}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => {
							setIsEditDialogOpen(false);
							setEditFormData(null);
						}}
					>
						Cancel
					</Button>
					<Button onClick={handleEditStudent}>
						<Save className="h-4 w-4 mr-2" />
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	const renderVerifyAllDialog = () => (
		<AlertDialog open={isVerifyAllDialogOpen} onOpenChange={setIsVerifyAllDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Verify All Marks</AlertDialogTitle>
					<AlertDialogDescription>
						This will verify marks for all {stats.pendingVerification} pending students. This action cannot
						be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => setIsVerifyAllDialogOpen(false)}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleVerifyAll} className="bg-green-600 hover:bg-green-700">
						Verify All
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);

	const renderSendNotificationDialog = () => (
		<Dialog open={isSendNotificationDialogOpen} onOpenChange={setIsSendNotificationDialogOpen}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Send Notification to Parents</DialogTitle>
					<DialogDescription>
						Notify parents of {stats.pendingVerification} students about pending verification
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Notification Type</Label>
						<Select
							value={notificationType}
							onValueChange={(value: 'sms' | 'email' | 'both') => setNotificationType(value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="sms">SMS Only</SelectItem>
								<SelectItem value="email">Email Only</SelectItem>
								<SelectItem value="both">Both SMS & Email</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Message</Label>
						<Input
							value={notificationMessage}
							onChange={(e) => setNotificationMessage(e.target.value)}
							placeholder="Enter notification message..."
						/>
					</div>
					<div className="bg-blue-50 p-3 rounded-lg">
						<p className="text-sm text-blue-700">
							This will send notifications to {stats.pendingVerification} parents
						</p>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => {
							setIsSendNotificationDialogOpen(false);
							setNotificationMessage('');
						}}
					>
						Cancel
					</Button>
					<Button onClick={handleSendNotification}>
						<Send className="h-4 w-4 mr-2" />
						Send
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	const renderExportDialog = () => (
		<Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Export Class Progress Report</DialogTitle>
					<DialogDescription>
						Choose export format for {selectedClass} - {selectedExam}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<Button className="w-full justify-start" variant="outline" onClick={handleExportCSV}>
						<Download className="h-4 w-4 mr-2" />
						Export as CSV (Excel)
					</Button>
					<Button className="w-full justify-start" variant="outline" onClick={handleExportPDF}>
						<FileText className="h-4 w-4 mr-2" />
						Export as PDF (Print)
					</Button>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	return (
		<div className="space-y-6">
			{renderHeader()}
			{renderStats()}
			{renderFilters()}

			<Tabs defaultValue="student-marks" className="space-y-4">
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="student-marks">Student Marks</TabsTrigger>
					<TabsTrigger value="subject-summary">Subject Summary</TabsTrigger>
				</TabsList>

				{renderStudentMarksTab()}
				{renderSubjectSummaryTab()}
			</Tabs>

			{renderStudentDetailsDialog()}
			{renderEditDialog()}
			{renderVerifyAllDialog()}
			{renderSendNotificationDialog()}
			{renderExportDialog()}
		</div>
	);
}
