import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const TimetableCard = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Timetable Management</h3>
            <p className="text-sm text-gray-500">Manage class schedules</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Create, edit, and publish class timetables. Assign subjects, teachers, and manage scheduling conflicts.
      </p>

      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/timetable')}
        className="w-full gap-2"
      >
        Go to Timetables
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default TimetableCard;
