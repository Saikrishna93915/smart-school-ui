import React, { useMemo, useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

type ExamType = 'Unit Test' | 'Quarterly' | 'Half Yearly' | 'Annual';
type ExamStatus = 'upcoming' | 'ongoing' | 'completed';

interface ExamItem {
  id: number;
  name: string;
  sequence: number;
  type: ExamType;
  startDate: string;
  endDate: string;
  resultDate: string;
  status: ExamStatus;
  isActive: boolean;
}

const defaultExam: Omit<ExamItem, 'id' | 'status'> = {
  name: '',
  sequence: 1,
  type: 'Unit Test',
  startDate: '',
  endDate: '',
  resultDate: '',
  isActive: true
};

const initialExams: ExamItem[] = [
  { id: 1, name: 'Unit Test 1', sequence: 1, type: 'Unit Test', startDate: '2025-04-10', endDate: '2025-04-15', resultDate: '2025-04-20', status: 'completed', isActive: true },
  { id: 2, name: 'Unit Test 2', sequence: 2, type: 'Unit Test', startDate: '2025-05-05', endDate: '2025-05-10', resultDate: '2025-05-15', status: 'completed', isActive: true },
  { id: 3, name: 'Quarterly Exam', sequence: 3, type: 'Quarterly', startDate: '2025-07-01', endDate: '2025-07-10', resultDate: '2025-07-15', status: 'ongoing', isActive: true },
  { id: 4, name: 'Half Yearly', sequence: 6, type: 'Half Yearly', startDate: '2025-10-01', endDate: '2025-10-10', resultDate: '2025-10-15', status: 'upcoming', isActive: true },
  { id: 5, name: 'Annual Exam', sequence: 9, type: 'Annual', startDate: '2026-03-01', endDate: '2026-03-15', resultDate: '2026-03-25', status: 'upcoming', isActive: true }
];

const ExamStructure: React.FC = () => {
  const [exams, setExams] = useState<ExamItem[]>(initialExams);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultExam);

  const sortedExams = useMemo(() => [...exams].sort((a, b) => a.sequence - b.sequence), [exams]);

  const addExam = () => {
    if (!form.name || !form.startDate || !form.endDate || !form.resultDate) return;
    const status: ExamStatus = 'upcoming';
    setExams((prev) => [
      ...prev,
      { id: prev.length + 1, ...form, status }
    ]);
    setForm(defaultExam);
    setIsOpen(false);
  };

  const badge = (status: ExamStatus) => {
    if (status === 'completed') return <Badge>Completed</Badge>;
    if (status === 'ongoing') return <Badge variant="secondary">Ongoing</Badge>;
    return <Badge variant="outline">Upcoming</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Exam Structure - Academic Year 2025-26</CardTitle>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exam
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seq</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>#{exam.sequence}</TableCell>
                  <TableCell>{exam.name}</TableCell>
                  <TableCell>{exam.type}</TableCell>
                  <TableCell>{exam.startDate}</TableCell>
                  <TableCell>{exam.endDate}</TableCell>
                  <TableCell>{exam.resultDate}</TableCell>
                  <TableCell>{badge(exam.status)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={exam.isActive}
                      onCheckedChange={(value) =>
                        setExams((prev) => prev.map((item) => (item.id === exam.id ? { ...item, isActive: value } : item)))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-md border p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline Preview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            {sortedExams.map((exam) => (
              <div key={exam.id} className="rounded border p-2">
                <p className="font-medium">{exam.name}</p>
                <p>{exam.startDate}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Exam Name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="h-10 w-full rounded-md border px-3 bg-background"
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ExamType }))}
                >
                  <option>Unit Test</option>
                  <option>Quarterly</option>
                  <option>Half Yearly</option>
                  <option>Annual</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Sequence</Label>
                <Input
                  type="number"
                  value={form.sequence}
                  onChange={(e) => setForm((p) => ({ ...p, sequence: Number(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Result</Label>
                <Input type="date" value={form.resultDate} onChange={(e) => setForm((p) => ({ ...p, resultDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={addExam}>Save Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ExamStructure;
