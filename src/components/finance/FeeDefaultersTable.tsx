import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  Mail,
  Phone,
  Clock,
  MoreVertical,
  CreditCard,
  Eye,
  FileText,
  MessageSquare
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/finance/currencyFormatter';

const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Format 10-digit numbers as (xxx) xxx-xxxx
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  // Return with leading + for longer international-style numbers
  if (digits.length > 10) {
    return `+${digits}`;
  }
  // Fallback to original input if formatting not possible
  return phone;
};

const formatDate = (dateStr: string, style: 'short' | 'medium' | 'long' = 'medium') => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { year: 'numeric', month: 'numeric', day: 'numeric' }
      : style === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat(undefined, options).format(d);
};

interface FeeDefaulter {
  id: number;
  studentId: string;
  initials: string;
  name: string;
  className: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  remindersSent: number;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  status: 'Critical' | 'High' | 'Moderate' | 'Low';
}

interface FeeDefaulterTableProps {
  defaulters: FeeDefaulter[];
  onRecordPayment: (defaulter: FeeDefaulter) => void;
  onSendReminder: (defaulter: FeeDefaulter) => void;
  onViewDetails: (defaulter: FeeDefaulter) => void;
  onCallParent?: (defaulter: FeeDefaulter) => void;
  onGenerateStatement?: (defaulter: FeeDefaulter) => void;
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Low': return 'bg-blue-100 text-blue-800 border-blue-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Critical': return '🔴';
    case 'High': return '🟠';
    case 'Moderate': return '🟡';
    case 'Low': return '🔵';
    default: return '⚪';
  }
};

const StudentAvatar = ({ initials }: { initials: string }) => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center">
    <span className="font-semibold text-blue-700 text-sm">{initials}</span>
  </div>
);

export const FeeDefaulterTable: React.FC<FeeDefaulterTableProps> = ({
  defaulters,
  onRecordPayment,
  onSendReminder,
  onViewDetails,
  onCallParent,
  onGenerateStatement,
  className = ''
}) => {
  if (defaulters.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-200 rounded-lg">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Defaulters Found</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          All fee payments are up to date. Great job maintaining collections!
        </p>
      </div>
    );
  }

  const totalOutstanding = defaulters.reduce((sum, d) => sum + d.amount, 0);
  const criticalCount = defaulters.filter(d => d.status === 'Critical').length;
  const highCount = defaulters.filter(d => d.status === 'High').length;

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Summary Bar */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{defaulters.length}</span> defaulters
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalCount} Critical
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">
              Total Outstanding: <span className="font-bold text-amber-700">
                {formatCurrency(totalOutstanding)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {criticalCount} Critical
                </Badge>
              )}
              {highCount > 0 && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {highCount} High
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-14 px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                ID
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                Student Details
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                Parent Contact
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">
                Amount Due
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                Due Date & Overdue
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaulters.map((defaulter) => (
              <TableRow 
                key={defaulter.id} 
                className="hover:bg-gray-50/50 border-b border-gray-100 last:border-0"
              >
                <TableCell className="px-4 py-3">
                  <div className="text-xs font-mono text-gray-600">{defaulter.studentId}</div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <StudentAvatar initials={defaulter.initials} />
                    <div>
                      <div className="font-medium text-gray-900">{defaulter.name}</div>
                      <div className="text-xs text-gray-600">Class {defaulter.className}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <Clock className="h-3 w-3 mr-1" />
                        {defaulter.remindersSent} reminder{defaulter.remindersSent !== 1 ? 's' : ''} sent
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="space-y-1.5">
                    <div className="font-medium text-sm">{defaulter.parentName}</div>
                    <div className="text-xs text-gray-600 flex items-center">
                      <Phone className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{formatPhoneNumber(defaulter.parentPhone)}</span>
                    </div>
                    {defaulter.parentEmail && (
                      <div className="text-xs text-gray-600 flex items-center">
                        <Mail className="h-3 w-3 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{defaulter.parentEmail}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <div className="font-bold text-gray-900 text-base">{formatCurrency(defaulter.amount)}</div>
                  <div className="text-xs text-gray-500 mt-1">Outstanding</div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="space-y-1.5">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(defaulter.dueDate, 'medium')}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        defaulter.daysOverdue > 30 ? 'bg-red-500' :
                        defaulter.daysOverdue > 15 ? 'bg-orange-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-xs font-medium text-gray-700">
                        {defaulter.daysOverdue} days overdue
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(defaulter.status)} capitalize flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium`}
                  >
                    <span className="text-xs">{getStatusIcon(defaulter.status)}</span>
                    {defaulter.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => onRecordPayment(defaulter)}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Collect
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onViewDetails(defaulter)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSendReminder(defaulter)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Reminder
                        </DropdownMenuItem>
                        {onCallParent && (
                          <DropdownMenuItem onClick={() => onCallParent(defaulter)}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Parent
                          </DropdownMenuItem>
                        )}
                        {onGenerateStatement && (
                          <DropdownMenuItem onClick={() => onGenerateStatement(defaulter)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Statement
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message Parent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};