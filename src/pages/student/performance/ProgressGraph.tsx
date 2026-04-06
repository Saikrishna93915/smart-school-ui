import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const trend = [
  { exam: 'UT1', percentage: 74 },
  { exam: 'UT2', percentage: 78 },
  { exam: 'Quarterly', percentage: 70 },
  { exam: 'UT3', percentage: 74 },
  { exam: 'UT4', percentage: 79 },
  { exam: 'Half Yearly', percentage: 73 }
];

const ProgressGraph: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Graph</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end gap-3">
          {trend.map((item) => (
            <div key={item.exam} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-primary/80 rounded-t" style={{ height: `${item.percentage * 2}px` }} />
              <p className="text-xs font-medium">{item.percentage}%</p>
              <p className="text-[11px] text-muted-foreground text-center">{item.exam}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressGraph;
