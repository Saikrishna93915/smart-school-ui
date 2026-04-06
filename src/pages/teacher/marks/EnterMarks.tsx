import React, { useMemo, useState } from 'react';
import { Save, CheckCircle, Search, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface StudentRow {
  id: number;
  rollNo: string;
  name: string;
  marks?: number;
  status: 'pending' | 'saved';
}

const EnterMarks: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedExam, setSelectedExam] = useState('Unit Test 1');
  const [search, setSearch] = useState('');
  const [remarks, setRemarks] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([
    { id: 1, rollNo: '101', name: 'Rahul Kumar', marks: 78, status: 'saved' },
    { id: 2, rollNo: '102', name: 'Priya Singh', marks: 82, status: 'saved' },
    { id: 3, rollNo: '103', name: 'Amit Sharma', status: 'pending' },
    { id: 4, rollNo: '104', name: 'Neha Gupta', status: 'pending' }
  ]);

  const filtered = useMemo(
    () => students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search)),
    [students, search]
  );

  const savedCount = students.filter((s) => s.status === 'saved').length;
  const progress = students.length ? (savedCount / students.length) * 100 : 0;

  const handleChange = (id: number, value: string) => {
    const marks = Number(value);
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, marks, status: 'saved' } : s)));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Enter Marks</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline"><Save className="h-4 w-4 mr-2" />Save All</Button>
          <Button disabled={savedCount < students.length}><CheckCircle className="h-4 w-4 mr-2" />Submit for Verification</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[9,10,11,12].map((c) => <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>)}</SelectContent></Select>
          </div>
          <div>
            <Label>Section</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['A','B','C'].map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent></Select>
          </div>
          <div>
            <Label>Exam</Label>
            <Select value={selectedExam} onValueChange={setSelectedExam}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Unit Test 1','Unit Test 2','Quarterly','Half Yearly','Annual'].map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select>
          </div>
          <div>
            <Label>Search</Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student or roll no" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Entry Progress</span>
            <span>{savedCount}/{students.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.rollNo}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <Input type="number" min="0" max="100" value={student.marks ?? ''} onChange={(e) => handleChange(student.id, e.target.value)} className="w-28" />
                  </TableCell>
                  <TableCell>{student.status === 'saved' ? <Badge>Saved</Badge> : <Badge variant="outline">Pending</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2">
          <Label>Teacher Remarks</Label>
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Class remarks" />
        </div>

        <div className="flex justify-end">
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Download List</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnterMarks;
