import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import apiClient from '../../Services/apiClient';
import { X, AlertCircle, Check } from 'lucide-react';
import './SlotAssignmentModal.css';

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

interface ModalConflict {
  type: string;
  message: string;
}

interface SlotAssignmentModalProps {
  slot: {
    timetableId: string;
    dayOfWeek: number;
    timeSlotId: string;
    dayName: string;
    timeSlotName: string;
  };
  onAssign: (slotData: {
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
  }) => Promise<void>;
  onClose: () => void;
  existingSlot?: {
    _id?: string;
    subjectId?: { _id?: string; subjectName?: string };
    teacherId?: { _id?: string; name?: string };
    roomNumber?: string;
    isLabSession?: boolean;
    isSplitClass?: boolean;
    splitGroup?: string;
    alternateWeek?: string;
  } | null;
  className?: string; // Class name to filter subjects (e.g., "UKG", "LKG")
}

/**
 * SlotAssignmentModal Component
 * Modal for assigning subjects and teachers to timetable slots
 */
const SlotAssignmentModal = ({
  slot,
  onAssign,
  onClose,
  existingSlot = null,
  className
}: SlotAssignmentModalProps) => {
  const [formData, setFormData] = useState({
    subjectId: existingSlot?.subjectId?._id || '',
    teacherId: existingSlot?.teacherId?._id || '',
    roomNumber: existingSlot?.roomNumber || '',
    isLabSession: existingSlot?.isLabSession || false,
    isSplitClass: existingSlot?.isSplitClass || false,
    splitGroup: existingSlot?.splitGroup || 'all',
    alternateWeek: existingSlot?.alternateWeek || 'both'
  });

  const [subjects, setSubjects] = useState<Array<{ _id: string; subjectName?: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ _id: string; name?: string; teacherName?: string; email?: string; sourceTeacherId?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ModalConflict[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [ignoreConflicts, setIgnoreConflicts] = useState(false);

  // Fetch subjects and teachers on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Fetch subjects for the specific class
      const subjectsRes = await apiClient.get('/subjects', { headers });
      let subjectsData = ensureArray<any>(subjectsRes.data?.data || subjectsRes.data);
      console.log('Raw subjects from API:', subjectsData.length, subjectsData);
      
      // Filter subjects by className if provided
      if (className) {
        subjectsData = subjectsData.filter((s: any) => s.className === className);
        console.log(`Filtered subjects for className "${className}":`, subjectsData.length, subjectsData);
      }
      
      // Deduplicate subjects by _id (in case backend returns duplicates)
      const uniqueSubjects = Array.from(
        new Map(subjectsData.map((s: any) => [s._id, s])).values()
      ) as Array<{ _id: string; subjectName?: string }>;
      console.log('Deduplicated subjects:', uniqueSubjects.length, uniqueSubjects);
      setSubjects(uniqueSubjects);

      // Fetch all teachers (backend returns array directly, not wrapped)
      const teachersRes = await apiClient.get('/admin/teachers', { headers });
      const teachersData = Array.isArray(teachersRes.data)
        ? teachersRes.data
        : ensureArray<any>(teachersRes.data?.data || teachersRes.data);
      console.log('Raw teachers from API:', teachersData.length, teachersData);
      
      // Transform and deduplicate teachers by _id
      const transformedTeachers = teachersData.map((t: any) => ({
        _id: (typeof t.user === 'string' ? t.user : t.user?._id) || t._id,
        sourceTeacherId: t._id,
        name: t.personal?.firstName && t.personal?.lastName 
          ? `${t.personal.firstName} ${t.personal.lastName}`
          : t.personal?.firstName || 'Unknown',
        email: t.contact?.email || '',
        teacherName: t.personal?.firstName && t.personal?.lastName 
          ? `${t.personal.firstName} ${t.personal.lastName}`
          : t.personal?.firstName || 'Unknown',
        department: t.professional?.department || ''
      }));
      
      const uniqueTeachers = Array.from(
        new Map(transformedTeachers.map((t: any) => [t._id, t])).values()
      ) as Array<{ _id: string; name?: string; teacherName?: string; email?: string; sourceTeacherId?: string }>;
      console.log('Deduplicated teachers:', uniqueTeachers.length, uniqueTeachers);
      setTeachers(uniqueTeachers);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load subjects and teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name as keyof typeof formData;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox'
      ? target.checked
      : target.value;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear conflicts when user changes values
    setConflicts([]);
  };

  const checkConflicts = async () => {
    if (!formData.subjectId || !formData.teacherId) {
      setError('Please select subject and teacher');
      return false;
    }

    try {
      console.log('🔍 Frontend - Checking conflicts for slot:', {
        slotId: existingSlot?._id,
        timetableId: slot.timetableId,
        dayOfWeek: slot.dayOfWeek,
        timeSlotId: slot.timeSlotId,
        existingSlotExists: !!existingSlot,
        existingSlot: existingSlot
      });

      setConflicts([]);
      setError(null);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Call conflict detection API
      const conflictPayload = {
        timetableId: slot.timetableId,
        dayOfWeek: slot.dayOfWeek,
        timeSlotId: slot.timeSlotId,
        currentSlotId: existingSlot?._id,
        subjectId: formData.subjectId,
        teacherId: formData.teacherId,
        roomNumber: formData.roomNumber
      };
      
      console.log('� Frontend - Checking conflicts:');
      console.log('  - existingSlot._id:', existingSlot?._id);
      console.log('  - currentSlotId in payload:', conflictPayload.currentSlotId);
      console.log('�📤 Frontend - Sending conflict-check payload:', conflictPayload);

      const response = await apiClient.post('/timetable/check-conflicts', conflictPayload, { headers });
      
      console.log('✅ Frontend - Conflict check response:', {
        hasConflict: response.data.data?.hasConflict,
        conflictCount: response.data.data?.conflicts?.length,
        conflicts: response.data.data?.conflicts
      });

      const filteredConflicts = ensureArray<ModalConflict>(response.data.data?.conflicts).filter(
        (conflict: ModalConflict) => conflict.type !== 'qualification_mismatch'
      );

      if (filteredConflicts.length > 0) {
        setConflicts(filteredConflicts);
        return false; // Don't allow assignment if conflicts
      }

      return true; // No conflicts

    } catch (err: any) {
      // Conflict endpoint may not exist yet - this is ok
      // The server-side will still check conflicts when saving
      if (err.response?.status === 404) {
        console.log('Conflict check endpoint not available, proceeding with assignment');
      } else {
        console.warn('Error checking conflicts:', err.message);
      }
      return true;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check for conflicts (unless user is overriding)
    if (!ignoreConflicts) {
      const noConflicts = await checkConflicts();
      if (!noConflicts) {
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const slotData = {
        dayOfWeek: slot.dayOfWeek,
        timeSlotId: slot.timeSlotId,
        subjectId: formData.subjectId,
        teacherId: formData.teacherId,
        roomNumber: formData.roomNumber || '',
        isLabSession: formData.isLabSession,
        isSplitClass: formData.isSplitClass,
        splitGroup: formData.isSplitClass ? formData.splitGroup : null,
        alternateWeek: formData.alternateWeek,
        currentSlotId: existingSlot?._id,
        ignoreConflicts: ignoreConflicts
      };

      console.log('📝 Frontend - Submitting slot assignment:');
      console.log('  - existingSlot._id:', existingSlot?._id);
      console.log('  - currentSlotId in payload:', slotData.currentSlotId);
      console.log('  - isSplitClass:', slotData.isSplitClass);
      console.log('  - splitGroup:', slotData.splitGroup);

      await onAssign(slotData);
      
      // Reset form and close modal on success
      setFormData({
        subjectId: '',
        teacherId: '',
        roomNumber: '',
        isLabSession: false,
        isSplitClass: false,
        splitGroup: 'all',
        alternateWeek: 'both'
      });
      
      // Close modal after successful assignment
      onClose();

    } catch (err: any) {
      console.error('Error assigning slot:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to assign slot';
      
      if (err.response?.status === 409) {
        const conflicts = (err.response?.data?.conflicts || []).filter(
          (conflict: ModalConflict) => conflict.type !== 'qualification_mismatch'
        );
        if (conflicts.length > 0) {
          errorMessage = `⚠️ Conflict: ${conflicts.map((c: any) => c.message).join('; ')}`;
        } else {
          errorMessage = `⚠️ ${err.response?.data?.message || 'Conflict detected'}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h3>Assign Slot</h3>
            <p className="slot-info">
              {slot.dayName} • {slot.timeSlotName}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {loading ? (
            <div className="loading">
              <p>Loading subjects and teachers...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="assignment-form">
              {/* Error messages */}
              {error && (
                <div className="alert alert-error">
                  <AlertCircle size={18} />
                  <div>
                    <p>{error}</p>
                    {error.includes('Conflict') && (
                      <button
                        type="button"
                        onClick={async () => {
                          setIgnoreConflicts(true);
                          setError(null);
                          
                          // Automatically resubmit with conflicts ignored
                          setTimeout(async () => {
                            try {
                              setSubmitting(true);
                              const slotData = {
                                dayOfWeek: slot.dayOfWeek,
                                timeSlotId: slot.timeSlotId,
                                subjectId: formData.subjectId,
                                teacherId: formData.teacherId,
                                roomNumber: formData.roomNumber || '',
                                isLabSession: formData.isLabSession,
                                isSplitClass: formData.isSplitClass,
                                splitGroup: formData.isSplitClass ? formData.splitGroup : null,
                                alternateWeek: formData.alternateWeek,
                                currentSlotId: existingSlot?._id,
                                ignoreConflicts: true
                              };
                              await onAssign(slotData);
                              
                              // Reset form on success
                              setFormData({
                                subjectId: '',
                                teacherId: '',
                                roomNumber: '',
                                isLabSession: false,
                                isSplitClass: false,
                                splitGroup: 'all',
                                alternateWeek: 'both'
                              });
                              onClose(); // Close modal on success
                            } catch (err: any) {
                              console.error('Error overriding conflict:', err);
                              setError('Failed to assign even after overriding conflicts');
                            } finally {
                              setSubmitting(false);
                            }
                          }, 100);
                        }}
                        style={{
                          marginTop: '8px',
                          padding: '6px 12px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Override Conflict & Assign Anyway
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Conflict warnings */}
              {conflicts.length > 0 && (
                <div className="alert alert-warning">
                  <AlertCircle size={18} />
                  <div>
                    <p className="conflict-title">⚠️ Conflicts Detected:</p>
                    <ul className="conflict-list">
                      {conflicts.map((conflict: ModalConflict, idx) => (
                        <li key={idx}>
                          <strong>{conflict.type}:</strong> {conflict.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Subject Selection */}
              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Selection */}
              <div className="form-group">
                <label htmlFor="teacher">Teacher *</label>
                <select
                  id="teacher"
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name || teacher.teacherName || teacher.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Number */}
              <div className="form-group">
                <label htmlFor="room">Room Number</label>
                <input
                  type="text"
                  id="room"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., Room 101, Lab A"
                  className="form-input"
                />
              </div>

              {/* Lab Session Checkbox */}
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="labSession"
                  name="isLabSession"
                  checked={formData.isLabSession}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="labSession" className="checkbox-label">
                  Lab/Practical Session
                </label>
              </div>

              {/* Split Class */}
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="splitClass"
                  name="isSplitClass"
                  checked={formData.isSplitClass}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="splitClass" className="checkbox-label">
                  Split Class / Multiple Groups
                </label>
              </div>

              {/* Split Group (if applicable) */}
              {formData.isSplitClass && (
                <div className="form-group">
                  <label htmlFor="splitGroup">Group</label>
                  <select
                    id="splitGroup"
                    name="splitGroup"
                    value={formData.splitGroup}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="A">Group A</option>
                    <option value="B">Group B</option>
                    <option value="C">Group C</option>
                    <option value="D">Group D</option>
                    <option value="all">All Groups</option>
                  </select>
                </div>
              )}

              {/* Alternate Week */}
              <div className="form-group">
                <label htmlFor="alternateWeek">Schedule</label>
                <select
                  id="alternateWeek"
                  name="alternateWeek"
                  value={formData.alternateWeek}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="both">Both Weeks</option>
                  <option value="odd">Odd Weeks Only</option>
                  <option value="even">Even Weeks Only</option>
                </select>
              </div>

              {/* Current Assignment Info */}
              {existingSlot && (
                <div className="existing-assignment">
                  <p>
                    <strong>Current Assignment:</strong>
                    <br />
                    Subject: {existingSlot.subjectId?.subjectName}
                    <br />
                    Teacher: {existingSlot.teacherId?.name}
                  </p>
                  <p className="note">
                    ℹ️ Submitting will update this assignment
                  </p>
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !formData.subjectId || !formData.teacherId}
                >
                  {submitting ? (
                    <>
                      <span className="spinner"></span>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {existingSlot ? 'Update' : 'Assign'} Slot
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlotAssignmentModal;
