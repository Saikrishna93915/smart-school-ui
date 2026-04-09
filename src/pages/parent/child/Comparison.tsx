import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const metrics = [
  { label: 'Overall Percentage', child: 78, classAvg: 71, topScore: 94 },
  { label: 'Mathematics', child: 82, classAvg: 69, topScore: 96 },
  { label: 'Science', child: 85, classAvg: 73, topScore: 95 },
  { label: 'English', child: 75, classAvg: 70, topScore: 90 }
];

const Comparison: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Child vs Class Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{metric.label}</span>
              <span>Child {metric.child}% | Avg {metric.classAvg}% | Top {metric.topScore}%</span>
            </div>
            <Progress value={metric.child} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default Comparison;
