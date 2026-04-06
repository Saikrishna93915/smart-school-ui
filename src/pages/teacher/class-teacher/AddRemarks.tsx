import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AddRemarks: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [remark, setRemark] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Class Teacher Remarks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="101">Rahul Kumar (101)</SelectItem>
                <SelectItem value="102">Priya Singh (102)</SelectItem>
                <SelectItem value="103">Amit Sharma (103)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Promotion Decision</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select promoted class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="11">Promote to Class 11</SelectItem>
                <SelectItem value="10">Retain in Class 10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Class Teacher Remark</Label>
          <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Overall performance, strengths, improvement areas" className="min-h-[120px]" />
        </div>

        <div className="flex justify-end"><Button>Save Remark</Button></div>
      </CardContent>
    </Card>
  );
};

export default AddRemarks;
