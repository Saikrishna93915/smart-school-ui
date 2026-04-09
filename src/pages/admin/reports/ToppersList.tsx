import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Award,
  Medal,
  Trophy
} from 'lucide-react';

// Static Data
const toppersData = [
  { 
    rank: 1,
    name: 'Ananya Gupta',
    class: '9A',
    rollNo: '901',
    percentage: 98.5,
    subjects: { math: 100, science: 98, english: 97, hindi: 98, sst: 99 },
    achievements: ['School Captain', 'Math Olympiad Winner']
  },
  { 
    rank: 2,
    name: 'Priya Singh',
    class: '10A',
    rollNo: '102',
    percentage: 97.2,
    subjects: { math: 98, science: 97, english: 96, hindi: 97, sst: 98 },
    achievements: ['Science Club Head']
  },
  { 
    rank: 3,
    name: 'Vikram Singh',
    class: '8B',
    rollNo: '812',
    percentage: 96.8,
    subjects: { math: 99, science: 96, english: 95, hindi: 96, sst: 98 },
    achievements: ['Chess Champion']
  },
  { 
    rank: 4,
    name: 'Neha Sharma',
    class: '8A',
    rollNo: '805',
    percentage: 95.5,
    subjects: { math: 97, science: 96, english: 94, hindi: 95, sst: 95 },
    achievements: []
  },
  { 
    rank: 5,
    name: 'Arjun Reddy',
    class: '9B',
    rollNo: '956',
    percentage: 94.3,
    subjects: { math: 95, science: 95, english: 93, hindi: 94, sst: 94 },
    achievements: ['Football Team Captain']
  },
  { 
    rank: 6,
    name: 'Kavita Singh',
    class: '7A',
    rollNo: '703',
    percentage: 93.7,
    subjects: { math: 94, science: 94, english: 92, hindi: 93, sst: 95 },
    achievements: []
  },
  { 
    rank: 7,
    name: 'Deepak Kumar',
    class: '10B',
    rollNo: '156',
    percentage: 92.9,
    subjects: { math: 93, science: 93, english: 92, hindi: 92, sst: 94 },
    achievements: ['Debate Winner']
  },
  { 
    rank: 8,
    name: 'Rahul Kumar',
    class: '10A',
    rollNo: '101',
    percentage: 92.2,
    subjects: { math: 94, science: 92, english: 91, hindi: 90, sst: 94 },
    achievements: []
  },
  { 
    rank: 9,
    name: 'Anjali Singh',
    class: '7B',
    rollNo: '724',
    percentage: 91.6,
    subjects: { math: 92, science: 91, english: 90, hindi: 91, sst: 94 },
    achievements: ['Art Competition Winner']
  },
  { 
    rank: 10,
    name: 'Ravi Sharma',
    class: '6A',
    rollNo: '612',
    percentage: 90.8,
    subjects: { math: 91, science: 90, english: 89, hindi: 90, sst: 94 },
    achievements: []
  },
];

const ToppersList: React.FC = () => {
  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="font-mono text-sm">#{rank}</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Top 10 Performers - All Classes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Subject-wise Marks</TableHead>
                <TableHead>Achievements</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toppersData.map((student) => (
                <TableRow key={student.rank} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRankIcon(student.rank)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>{student.rollNo}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-600 text-white text-sm">
                      {student.percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 text-xs">
                      <span className="px-1 bg-blue-50 rounded">M:{student.subjects.math}</span>
                      <span className="px-1 bg-green-50 rounded">S:{student.subjects.science}</span>
                      <span className="px-1 bg-purple-50 rounded">E:{student.subjects.english}</span>
                      <span className="px-1 bg-yellow-50 rounded">H:{student.subjects.hindi}</span>
                      <span className="px-1 bg-indigo-50 rounded">SST:{student.subjects.sst}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.achievements.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {student.achievements.map((ach, idx) => (
                          <Badge key={idx} variant="outline" className="bg-amber-50">
                            {ach}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Class-wise Toppers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Class 10 Topper</p>
              <p className="font-bold">Priya Singh</p>
              <p className="text-xs text-green-600">97.2%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Class 9 Topper</p>
              <p className="font-bold">Ananya Gupta</p>
              <p className="text-xs text-green-600">98.5%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Class 8 Topper</p>
              <p className="font-bold">Vikram Singh</p>
              <p className="text-xs text-green-600">96.8%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Class 7 Topper</p>
              <p className="font-bold">Kavita Singh</p>
              <p className="text-xs text-green-600">93.7%</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default ToppersList;
