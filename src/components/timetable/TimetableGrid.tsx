import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { AlertCircle, Clock, MapPin, User, Calendar } from 'lucide-react';
import SlotAssignmentModal from '@/components/timetable/SlotAssignmentModal';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import './TimetableGrid.css';

interface TimetableGridProps {
  classId: string;
  sectionId: string;
  academicYearId?: string;
  term?: string;
}

interface TimeSlot {
  _id: string;
  slotType: string;
  slotName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

interface TimetableRef {
  _id: string;
  classId?: { className?: string };
  sectionId?: string;
  assignedPeriods?: number;
  totalPeriods?: number;
  status?: string;
}

interface TimetableSlot {
  _id?: string;
  dayOfWeek: number;
  timeSlotId: { _id: string };
  subjectId?: { subjectName?: string };
  teacherId?: { name?: string; teacherName?: string };
  roomNumber?: string;
  hasConflict?: boolean;
  conflictType?: string;
  isLabSession?: boolean;
  isSplitClass?: boolean;
  splitGroup?: string;
}

interface SelectedSlotPayload {
  dayOfWeek: number;
  timeSlotId: string;
  timeSlotName: string;
  dayName: string;
  timetableId: string;
  existing: TimetableSlot | null;
}

/**
 * TimetableGrid Component
 * Displays a weekly timetable grid with drag-drop slot assignment
 * Supports conflict visualization and real-time updates
 */
const TimetableGrid = ({ classId, sectionId, academicYearId = '2025-26', term = 'term1' }: TimetableGridProps) => {
  const [timetable, setTimetable] = useState<TimetableRef | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlotPayload | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [conflicts, setConflicts] = useState<Array<{ message?: string }>>([]);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [printing, setPrinting] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement | null>(null);

  // Days of week
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const HOLIDAY_INDEX = 0;

  const fetchTimetableData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Fetch time slots first
      try {
        const timeSlotsRes = await axios.get('/api/timeslots', {
          params: { academicYearId },
          headers
        });
        const tsData = timeSlotsRes.data?.data || timeSlotsRes.data;
        setTimeSlots(Array.isArray(tsData) ? tsData : []);
      } catch (timeslotErr: any) {
        console.log('No timeslots found, will use empty array');
        setTimeSlots([]);
      }

      // Fetch timetable and slots
      const timetableRes = await axios.get(
        `/api/timetable/${classId}/${sectionId}`,
        {
          params: { academicYearId, term },
          headers
        }
      );

      setTimetable(timetableRes.data?.data?.timetable);
      const rawSlots = timetableRes.data?.data?.slots;
      const normalizedSlots = Array.isArray(rawSlots)
        ? rawSlots.map((slot: TimetableSlot) => {
            if (slot.conflictType === 'qualification_mismatch') {
              return {
                ...slot,
                hasConflict: false,
                conflictType: 'none'
              };
            }
            return slot;
          })
        : [];
      setSlots(normalizedSlots);

      // Fetch conflicts only if timetable exists
      try {
        const conflictsRes = await axios.get('/api/timetable/conflicts', {
          params: { academicYearId, classId },
          headers
        });
        const conflictsData = conflictsRes.data?.data || conflictsRes.data;
        const filteredConflicts = Array.isArray(conflictsData)
          ? conflictsData.filter(
              (conflict: any) => conflict.conflictType !== 'qualification_mismatch'
            )
          : [];
        setConflicts(filteredConflicts);
      } catch (conflictErr: any) {
        console.log('No conflicts data');
        setConflicts([]);
      }

    } catch (err: any) {
      // Differentiate between 404 (timetable doesn't exist) and other errors
      if (err.response?.status === 404) {
        // Expected - timetable doesn't exist yet, show create button
        console.log('No timetable found for this class. User can create one.');
        setError(null);
        setTimetable(null);
        setSlots([]);
        setConflicts([]);
      } else {
        console.error('Error fetching timetable:', err);
        setError(err.response?.data?.message || 'Failed to load timetable');
      }
    } finally {
      setLoading(false);
    }
  }, [classId, sectionId, academicYearId, term]);

  // Fetch timetable data
  useEffect(() => {
    if (!classId || !sectionId) {
      setError('Class ID and Section ID are required');
      setLoading(false);
      return;
    }

    fetchTimetableData();
  }, [fetchTimetableData]);

  // Create new timetable
  const handleCreateTimetable = async () => {
    try {
      setCreating(true);
      setError(null);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Create new timetable
      await axios.post('/api/timetable', {
        classId,
        sectionId,
        academicYearId,
        term,
        effectiveFrom: new Date().toISOString(),
        status: 'draft'
      }, { headers });

      // Refresh to load the new timetable
      await fetchTimetableData();

    } catch (err: any) {
      console.error('Error creating timetable:', err);
      setError(err.response?.data?.message || 'Failed to create timetable');
    } finally {
      setCreating(false);
    }
  };

  const handlePublishTimetable = async () => {
    if (!timetable?._id) return;

    try {
      setPublishing(true);
      setError(null);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      await axios.post(`/api/timetable/${timetable._id}/publish`, {}, { headers });
      await fetchTimetableData();
      toast.success('Timetable published successfully');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to publish timetable';
      setError(message);
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  };

  const getPrintStyles = () => `
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
      .timetable-actions { display: none !important; }
      .timetable-container { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
      .timetable-header { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ddd; }
      .header-stats { display: flex; gap: 12px; font-size: 12px; flex-wrap: wrap; }
      .timetable-grid { width: 100%; border-collapse: collapse; font-size: 11px; }
      .timetable-grid th, .timetable-grid td { border: 1px solid #ddd; padding: 6px; vertical-align: top; }
      .timetable-grid th { background: #f5f5f5; }
      .time-cell { background: #fafafa; min-width: 110px; }
      .assigned-slot { border: 1px solid #1976d2; border-radius: 4px; padding: 4px; }
      .slot-subject { font-weight: 700; }
      .break-slot { font-weight: 700; color: #b26a00; text-align: center; }
      .empty-slot { color: #888; text-align: center; }
      .timetable-legend { margin: 8px 0 12px; display: flex; gap: 10px; font-size: 11px; flex-wrap: wrap; }
      @media print { @page { size: A4 landscape; margin: 8mm; } }
    </style>
  `;

  const handlePrintTimetable = () => {
    if (!exportContainerRef.current) return;

    try {
      setPrinting(true);
      const printWindow = window.open('', '_blank', 'width=1400,height=900');
      if (!printWindow) {
        toast.error('Please allow popups to print timetable');
        return;
      }

      const title = `Timetable - ${timetable?.classId?.className || ''} ${timetable?.sectionId || ''}`;
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            ${getPrintStyles()}
          </head>
          <body>
            ${exportContainerRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    } finally {
      setPrinting(false);
    }
  };

  const handleExportToPDF = async () => {
    if (!exportContainerRef.current) return;

    try {
      setExportingPdf(true);

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-99999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1400px';
      tempContainer.innerHTML = `
        <div>
          ${getPrintStyles()}
          ${exportContainerRef.current.innerHTML}
        </div>
      `;
      document.body.appendChild(tempContainer);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      await pdf.html(tempContainer, {
        margin: [6, 6, 6, 6],
        autoPaging: 'text',
        html2canvas: {
          scale: 0.45,
          useCORS: true,
          allowTaint: true
        }
      });

      const className = timetable?.classId?.className || 'class';
      const section = timetable?.sectionId || 'section';
      pdf.save(`timetable_${className}_${section}.pdf`);
      document.body.removeChild(tempContainer);
      toast.success('Timetable PDF exported successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export timetable PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  // Handle slot click to open assignment modal
  const handleSlotClick = (day: number, timeSlot: TimeSlot) => {
    const existingSlot = slots.find(
      (s) => s.dayOfWeek === day && s.timeSlotId._id === timeSlot._id
    );

    setSelectedSlot({
      dayOfWeek: day,
      timeSlotId: timeSlot._id,
      timeSlotName: timeSlot.slotName,
      dayName: DAYS[day],
      timetableId: timetable?._id || '',
      existing: existingSlot || null
    });

    setShowModal(true);
  };

  // Handle slot assignment
  const handleSlotAssign = async (slotData: {
    dayOfWeek: number;
    timeSlotId: string;
    subjectId: string;
    teacherId: string;
    roomNumber: string;
    isLabSession: boolean;
    isSplitClass: boolean;
    splitGroup: string | null;
    alternateWeek: string;
    currentSlotId?: string;
    ignoreConflicts?: boolean;
  }) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Add dayName to the request (required by backend)
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const payload = {
        ...slotData,
        dayName: dayNames[slotData.dayOfWeek],
        ignoreConflicts: slotData.ignoreConflicts || false
      };

      await axios.post(
        `/api/timetable/${timetable?._id}/slots`,
        payload,
        { headers }
      );

      // Refresh timetable data
      await fetchTimetableData();
      setShowModal(false);

    } catch (err: any) {
      console.error('Error assigning slot:', err);
      
      // Handle 409 Conflict errors
      if (err.response?.status === 409) {
        const conflicts = err.response?.data?.conflicts || [];
        const conflictMessages = conflicts.map((c: any) => c.message).join(', ');
        const errorMsg = conflictMessages || err.response?.data?.message || 'Conflict detected';
        setError(`⚠️ Conflict: ${errorMsg}`);
        // Don't close modal - let user see the error and try again
        throw new Error(errorMsg); // Propagate to modal
      } else {
        const errorMsg = err.response?.data?.message || 'Failed to assign slot';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }
  };

  // Get slot for a specific day and time
  const getSlotForDayTime = (dayOfWeek: number, timeSlotId: string) => {
    return slots.find(s => s.dayOfWeek === dayOfWeek && s.timeSlotId._id === timeSlotId);
  };

  // Get slot CSS class based on state
  const getSlotClass = (slot?: TimetableSlot) => {
    if (!slot) return 'empty';
    if (slot.hasConflict && slot.conflictType !== 'qualification_mismatch') return 'conflict';
    return 'assigned';
  };

  // Get slot background color
  const getSlotStyle = (slot?: TimetableSlot) => {
    if (!slot) return {};

    const colorMap = {
      empty: '#f5f5f5',
      assigned: '#e3f2fd',
      conflict: '#ffebee',
      break: '#fff3e0',
      lunch: '#f1f8e9'
    };

    if (slot.hasConflict && slot.conflictType !== 'qualification_mismatch') {
      return { backgroundColor: colorMap.conflict };
    }
    return { backgroundColor: colorMap.assigned };
  };

  if (loading) {
    return (
      <div className="timetable-loader">
        <div className="spinner"></div>
        <p>Loading timetable...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timetable-error">
        <AlertCircle size={32} />
        <p>{error}</p>
        <button onClick={fetchTimetableData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="timetable-empty">
        <Calendar size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-semibold mb-2">No timetable found for this class</p>
        <p className="text-sm text-muted-foreground mb-6">
          Create a new timetable to start scheduling classes
        </p>
        <button 
          onClick={handleCreateTimetable} 
          className="action-btn primary"
          disabled={creating}
        >
          {creating ? 'Creating...' : 'Create Timetable'}
        </button>
      </div>
    );
  }

  return (
    <div className="timetable-container" ref={exportContainerRef}>
      {/* Header */}
      <div className="timetable-header">
        <div className="header-content">
          <h2>Timetable - {timetable.classId?.className} Section {timetable.sectionId}</h2>
          <div className="header-stats">
            <span className="stat">
              Progress: {timetable.assignedPeriods}/{timetable.totalPeriods} slots
            </span>
            <span className="stat">
              Status: <span className={`status-badge ${timetable.status}`}>
                {(timetable.status || 'draft').toUpperCase()}
              </span>
            </span>
            {conflicts.length > 0 && (
              <span className="stat conflict-warning">
                ⚠️ {conflicts.length} Conflicts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="timetable-legend">
        <div className="legend-item">
          <div className="legend-color empty"></div>
          <span>Empty</span>
        </div>
        <div className="legend-item">
          <div className="legend-color assigned"></div>
          <span>Assigned</span>
        </div>
        <div className="legend-item">
          <div className="legend-color conflict"></div>
          <span>Conflict</span>
        </div>
        <div className="legend-item">
          <div className="legend-color break"></div>
          <span>Break</span>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="timetable-wrapper">
        <table className="timetable-grid">
          <thead>
            <tr>
              <th className="time-col">Time</th>
              {DAYS.filter((_, idx) => idx !== HOLIDAY_INDEX).map((day, idx) => (
                <th key={idx + 1} className="day-col">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot) => (
              <tr key={timeSlot._id} className={`period-row ${timeSlot.slotType}`}>
                {/* Time slot label */}
                <td className="time-cell">
                  <div className="time-slot-info">
                    <div className="slot-name">{timeSlot.slotName}</div>
                    <div className="slot-time">
                      {timeSlot.startTime} - {timeSlot.endTime}
                    </div>
                    <div className="slot-duration">{timeSlot.durationMinutes} min</div>
                  </div>
                </td>

                {/* Days */}
                {DAYS.filter((_, idx) => idx !== HOLIDAY_INDEX).map((_day, filteredIdx) => {
                  const dayIdx = filteredIdx + 1; // Skip Sunday (0), start from Monday (1)
                  const slot = getSlotForDayTime(dayIdx, timeSlot._id);
                  const isBreak = timeSlot.slotType !== 'period';

                  return (
                    <td
                      key={`${dayIdx}-${timeSlot._id}`}
                      className={`day-cell ${getSlotClass(slot)} ${timeSlot.slotType}`}
                      style={getSlotStyle(slot)}
                      onClick={() => !isBreak && handleSlotClick(dayIdx, timeSlot)}
                    >
                      {isBreak ? (
                        <div className="break-slot">{timeSlot.slotName}</div>
                      ) : slot ? (
                        <div className="assigned-slot">
                          <div className="slot-subject">
                            {slot.subjectId?.subjectName || 'Unassigned'}
                          </div>
                          <div className="slot-teacher">
                            <User size={12} />
                            {slot.teacherId?.name || slot.teacherId?.teacherName || 'Assign Teacher'}
                          </div>
                          <div className="slot-room">
                            <MapPin size={12} />
                            {slot.roomNumber || 'No Room'}
                          </div>
                          {slot.hasConflict && slot.conflictType !== 'qualification_mismatch' && (
                            <div className="conflict-indicator">
                              <AlertCircle size={14} />
                              {slot.conflictType}
                            </div>
                          )}
                          {slot.isLabSession && (
                            <span className="badge-lab">Lab</span>
                          )}
                          {slot.isSplitClass && (
                            <span className="badge-split">Split {slot.splitGroup}</span>
                          )}
                        </div>
                      ) : (
                        <div className="empty-slot">
                          <span className="add-icon">+ Assign</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="timetable-actions">
        <button className="action-btn primary" onClick={fetchTimetableData}>
          <Clock size={18} />
          Refresh
        </button>
        <button
          className="action-btn"
          onClick={handlePublishTimetable}
          disabled={conflicts.length > 0 || publishing}
          title={conflicts.length > 0 ? 'Resolve conflicts before publishing' : ''}
        >
          <span>{publishing ? 'Publishing...' : 'Publish Timetable'}</span>
        </button>
        <button className="action-btn" onClick={handlePrintTimetable} disabled={printing}>
          <span>{printing ? 'Preparing...' : 'Print Timetable'}</span>
        </button>
        <button className="action-btn" onClick={handleExportToPDF} disabled={exportingPdf}>
          <span>{exportingPdf ? 'Exporting...' : 'Export to PDF'}</span>
        </button>
      </div>

      {/* Slot Assignment Modal */}
      {showModal && selectedSlot && (
        <SlotAssignmentModal
          slot={selectedSlot}
          onAssign={handleSlotAssign}
          onClose={() => setShowModal(false)}
          existingSlot={selectedSlot.existing}
          className={timetable?.classId?.className}
        />
      )}
    </div>
  );
};

export default TimetableGrid;
