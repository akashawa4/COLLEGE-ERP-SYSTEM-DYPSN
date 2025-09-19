import React, { useState, useEffect } from 'react';
import { userService, attendanceService, subjectService, batchAttendanceService, batchService } from '../../firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';
import { getDepartmentCode } from '../../utils/departmentMapping';
import { getAvailableSemesters, isValidSemesterForYear, getDefaultSemesterForYear } from '../../utils/semesterMapping';
import { 
  Users, 
  Layers, 
  CheckCircle, 
  X, 
  FileCheck, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Building2,
  ClipboardList,
  User as UserIcon,
  Clock
} from 'lucide-react';

const YEARS = ['1st', '2nd', '3rd', '4th'];
const DIVS = ['A', 'B', 'C'];
// Subjects are loaded dynamically from Firestore using subjectService

// Add prop type for addNotification
interface TakeAttendancePanelProps {
  addNotification?: (message: string) => void;
}

const TakeAttendancePanel: React.FC<TakeAttendancePanelProps> = ({ addNotification }) => {
  const { user } = useAuth();
  const [year, setYear] = useState('2nd');
  const [sem, setSem] = useState('3');
  const [div, setDiv] = useState('A');
  const [availableSemesters, setAvailableSemesters] = useState<string[]>(getAvailableSemesters('2'));
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subject, setSubject] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [presentRolls, setPresentRolls] = useState('');
  const [absentRolls, setAbsentRolls] = useState('');
  const [attendanceMode, setAttendanceMode] = useState<'present' | 'absent' | 'both'>('both');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [present, setPresent] = useState<User[]>([]);
  const [absent, setAbsent] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Batch attendance states
  const [isBatchAttendance, setIsBatchAttendance] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState<{ batchName: string; fromRollNo: string; toRollNo: string }[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Layout states
  const [attendanceLayout, setAttendanceLayout] = useState<'manual' | 'cards'>('manual');
  const [studentCards, setStudentCards] = useState<{rollNumber: string, name: string, status: 'present' | 'absent' | 'unmarked'}[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];

  const normalizeYear = (y: string) => {
    if (!y) return '';
    // Convert year format to match new subject structure
    const yearMapping: { [key: string]: string } = {
      '1': '1st',
      '2': '2nd', 
      '3': '3rd',
      '4': '4th'
    };
    return yearMapping[y] || y;
  };

  // Handle year change to update available semesters
  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    const normalizedYear = newYear.replace(/(st|nd|rd|th)/i, '');
    const newAvailableSemesters = getAvailableSemesters(normalizedYear);
    setAvailableSemesters(newAvailableSemesters);
    
    // If current semester is not valid for new year, reset to first available
    if (!isValidSemesterForYear(normalizedYear, sem)) {
      const defaultSem = getDefaultSemesterForYear(normalizedYear);
      setSem(defaultSem);
    }
  };

  useEffect(() => {
    // Fetch students from Firestore by year, sem, div
    const fetchStudents = async () => {
      setLoading(true);
      // Use batch structure to get students
      const batch = '2025'; // Default batch year
      const department = 'CSE'; // Default department
      const filtered = await userService.getStudentsByBatchDeptYearSemDiv(batch, department, year, sem, div);
      setStudents(filtered);
      setLoading(false);
    };
    fetchStudents();
  }, [year, sem, div]);

  // Load subjects dynamically based on filters (ignore div for subjects)
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setSubjectsLoading(true);
        
        const deptCode = getDepartmentCode(user?.department);
        
        const normalizedYear = normalizeYear(year);
        const subs = await subjectService.getSubjectsByDepartment(deptCode, normalizedYear, sem);
        
        const names = subs.map(s => s.subjectName).sort();
        setAvailableSubjects(names);
        if (names.length > 0) {
          setSubject(prev => (prev && names.includes(prev) ? prev : names[0]));
        } else {
          setSubject('');
        }
      } catch (e) {
        setAvailableSubjects([]);
        setSubject('');
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, [user?.department, year, sem, div]);

  // Load available batches when filters change
  useEffect(() => {
    const loadBatches = async () => {
      if (!isBatchAttendance) return;
      
      try {
        setBatchesLoading(true);
        const batch = '2025'; // Default batch year
        const department = getDepartmentCode(user?.department || 'CSE');
        
        const batches = await batchService.getBatchesForDivision(
          batch,
          department,
          year,
          sem,
          div
        );
        
        setAvailableBatches(batches);
        if (batches.length > 0 && !selectedBatch) {
          setSelectedBatch(batches[0].batchName);
        }
      } catch (error) {
        console.error('Error loading batches:', error);
        setAvailableBatches([]);
      } finally {
        setBatchesLoading(false);
      }
    };

    loadBatches();
  }, [isBatchAttendance, year, sem, div, user?.department]);

  // Generate student cards for card layout
  const generateStudentCards = async () => {
    setCardsLoading(true);
    try {
      let cards: {rollNumber: string, name: string, status: 'present' | 'absent' | 'unmarked'}[] = [];

      if (isBatchAttendance && selectedBatch) {
        // For batch-wise attendance, get students from the selected batch
        const batch = availableBatches.find(b => b.batchName === selectedBatch);
        if (batch) {
          // Get students from the batch range
          const batchStudents = await userService.getStudentsByBatchDeptYearSemDiv('2025', getDepartmentCode(user?.department || 'CSE'), year, sem, div);
          const fromRoll = parseInt(batch.fromRollNo);
          const toRoll = parseInt(batch.toRollNo);
          
          // Filter students within the batch roll number range
          const batchStudentsInRange = batchStudents.filter(student => {
            const studentRoll = parseInt(student.rollNumber || student.id);
            return studentRoll >= fromRoll && studentRoll <= toRoll;
          });
          
          cards = batchStudentsInRange.map(student => ({
            rollNumber: student.rollNumber || student.id,
            name: student.name,
            status: 'unmarked' as const
          }));
        }
      } else {
        // For class-wise attendance, use all students in the class
        const batch = '2025'; // Default batch year
        const department = getDepartmentCode(user?.department || 'CSE');
        const filteredStudents = await userService.getStudentsByBatchDeptYearSemDiv(batch, department, year, sem, div);
        
        cards = filteredStudents.map(student => ({
          rollNumber: student.rollNumber || student.id,
          name: student.name,
          status: 'unmarked' as const
        }));
      }

      setStudentCards(cards);
    } catch (error) {
      console.error('Error generating student cards:', error);
      setStudentCards([]);
    } finally {
      setCardsLoading(false);
    }
  };

  // Load student cards when filters change
  useEffect(() => {
    if (attendanceLayout === 'cards') {
      generateStudentCards();
    }
  }, [attendanceLayout, year, sem, div, isBatchAttendance, selectedBatch, user?.department]);

  // Handle card click for marking attendance
  const handleCardClick = (rollNumber: string) => {
    if (attendanceMode === 'present') {
      setStudentCards(prev => prev.map(card => 
        card.rollNumber === rollNumber 
          ? { ...card, status: card.status === 'present' ? 'unmarked' : 'present' }
          : card
      ));
    } else if (attendanceMode === 'absent') {
      setStudentCards(prev => prev.map(card => 
        card.rollNumber === rollNumber 
          ? { ...card, status: card.status === 'absent' ? 'unmarked' : 'absent' }
          : card
      ));
    } else {
      // Both mode - cycle through unmarked -> present -> absent -> unmarked
      setStudentCards(prev => prev.map(card => 
        card.rollNumber === rollNumber 
          ? { 
              ...card, 
              status: card.status === 'unmarked' ? 'present' : 
                     card.status === 'present' ? 'absent' : 'unmarked'
            }
          : card
      ));
    }
  };

  // Handle quick actions for card layout
  const handleMarkAllPresentCards = () => {
    setStudentCards(prev => prev.map(card => ({ ...card, status: 'present' as const })));
  };

  const handleMarkAllAbsentCards = () => {
    setStudentCards(prev => prev.map(card => ({ ...card, status: 'absent' as const })));
  };

  const handleClearAllCards = () => {
    setStudentCards(prev => prev.map(card => ({ ...card, status: 'unmarked' as const })));
  };

  const handleMarkAllPresent = () => {
    setPresentRolls(students.map(s => s.rollNumber || s.id).join(','));
    setAbsentRolls('');
  };

  const handleMarkAllAbsent = () => {
    setAbsentRolls(students.map(s => s.rollNumber || s.id).join(','));
    setPresentRolls('');
  };

  const handleClearAll = () => {
    setPresentRolls('');
    setAbsentRolls('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let presentList: string[] = [];
    let absentList: string[] = [];

    if (attendanceLayout === 'cards') {
      // Card layout - use student cards data
      presentList = studentCards.filter(card => card.status === 'present').map(card => card.rollNumber);
      absentList = studentCards.filter(card => card.status === 'absent').map(card => card.rollNumber);
    } else {
      // Manual layout - use text inputs
    if (attendanceMode === 'present') {
      // Only present students mode
      presentList = presentRolls
        .split(/[\s,]+/)
        .map(r => r.trim())
        .filter(r => r.length > 0);
      // All other students are marked absent
      const presentSet = new Set(presentList);
      absentList = students
        .filter(s => !presentSet.has(String(s.rollNumber || s.id)))
        .map(s => String(s.rollNumber || s.id));
    } else if (attendanceMode === 'absent') {
      // Only absent students mode
      absentList = absentRolls
        .split(/[\s,]+/)
        .map(r => r.trim())
        .filter(r => r.length > 0);
      // All other students are marked present
      const absentSet = new Set(absentList);
      presentList = students
        .filter(s => !absentSet.has(String(s.rollNumber || s.id)))
        .map(s => String(s.rollNumber || s.id));
    } else {
      // Both mode - use both inputs
      presentList = presentRolls
        .split(/[\s,]+/)
        .map(r => r.trim())
        .filter(r => r.length > 0);
      absentList = absentRolls
        .split(/[\s,]+/)
        .map(r => r.trim())
        .filter(r => r.length > 0);
      }
    }

    // Ensure present and absent lists are mutually exclusive and unique
    const presentSet = new Set(presentList);
    const absentSet = new Set(absentList);
    
    // Remove any duplicates between present and absent
    const finalPresentList = presentList.filter(r => !absentSet.has(r));
    const finalAbsentList = absentList.filter(r => !presentSet.has(r));

    let presentStudents: User[] = [];
    let absentStudents: User[] = [];

    if (attendanceLayout === 'cards') {
      // For card layout, create user objects from card data
      presentStudents = studentCards
        .filter(card => card.status === 'present')
        .map(card => ({
          id: card.rollNumber,
          rollNumber: card.rollNumber,
          name: card.name,
          role: 'student' as const,
          email: '',
          department: user?.department || 'CSE',
          year: year,
          sem: sem,
          div: div,
          accessLevel: 'basic' as const,
          isActive: true
        }));
      absentStudents = studentCards
        .filter(card => card.status === 'absent')
        .map(card => ({
          id: card.rollNumber,
          rollNumber: card.rollNumber,
          name: card.name,
          role: 'student' as const,
          email: '',
          department: user?.department || 'CSE',
          year: year,
          sem: sem,
          div: div,
          accessLevel: 'basic' as const,
          isActive: true
        }));
    } else {
      // For manual layout, use existing students data
      presentStudents = students.filter(s => finalPresentList.includes(String(s.rollNumber || s.id)));
      absentStudents = students.filter(s => finalAbsentList.includes(String(s.rollNumber || s.id)));
    }

    setPresent(presentStudents);
    setAbsent(absentStudents);
    setSubmitted(true);

    // Save attendance to Firestore in parallel
    await Promise.all(
      students.map(s => {
        const isPresent = finalPresentList.includes(String(s.rollNumber || s.id));
        const isAbsent = finalAbsentList.includes(String(s.rollNumber || s.id));
        
        // If student is not explicitly marked, default to present in present mode, absent in absent mode
        let status: 'present' | 'absent' | 'late' | 'half-day' | 'leave' = 'present';
        if (attendanceMode === 'present') {
          status = isPresent ? 'present' : 'absent';
        } else if (attendanceMode === 'absent') {
          status = isAbsent ? 'absent' : 'present';
        } else {
          // Both mode - use explicit marking
          status = isPresent ? 'present' : 'absent';
        }

        const attendanceData = {
          userId: s.id,
          userName: s.name,
          rollNumber: s.rollNumber,
          date: attendanceDate,
          status,
          subject,
          notes: note,
          createdAt: new Date(),
          year: s.year || year, // Use student's year if available, fallback to filter year
          sem: s.sem || sem, // Use student's sem if available, fallback to filter sem
          div: s.div || div, // Use student's div if available, fallback to filter div
          studentYear: s.year || year, // Pass student year for batch path
        };

        // If batch attendance is enabled, add batch information
        if (isBatchAttendance && selectedBatch) {
          const batch = availableBatches.find(b => b.batchName === selectedBatch);
          if (batch) {
            (attendanceData as any).batchName = selectedBatch;
            (attendanceData as any).fromRollNo = batch.fromRollNo;
            (attendanceData as any).toRollNo = batch.toRollNo;
            (attendanceData as any).isBatchAttendance = true;
          }
        }

        // Use batch attendance service if batch attendance is enabled
        if (isBatchAttendance && selectedBatch) {
          return batchAttendanceService.markBatchAttendance(attendanceData);
        } else {
          return attendanceService.markAttendance(attendanceData);
        }
      })
    );

    // Trigger notifications for present and absent students
    if (addNotification) {
      const batchInfo = isBatchAttendance && selectedBatch ? ` in batch ${selectedBatch}` : '';
      presentStudents.forEach(s => {
        addNotification(`${s.name} (${s.rollNumber || s.id}) was marked present for ${subject}${batchInfo}`);
      });
      absentStudents.forEach(s => {
        addNotification(`${s.name} (${s.rollNumber || s.id}) was marked absent for ${subject}${batchInfo}`);
      });
    }
  };

  const handleCopy = (list: User[]) => {
    navigator.clipboard.writeText(list.map(s => `${s.name} (${s.rollNumber || s.id})`).join(', '));
  };

  // Helper to get unique students by rollNumber or id
  function uniqueStudents(list: User[]) {
    const seen = new Set();
    return list.filter(s => {
      const key = String(s.rollNumber || s.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Compact Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Take Attendance</h1>
              <p className="text-sm text-gray-600 hidden sm:block">Mark student attendance for your class or batch</p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
              <Calendar className="w-3 h-3" />
              <span className="hidden sm:block">{new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
              <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>

          {/* Compact Mode Selection */}
      <div className="mb-4">
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setIsBatchAttendance(false)}
                className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                  !isBatchAttendance
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    !isBatchAttendance ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    <Users className={`w-4 h-4 ${!isBatchAttendance ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-left">
                    <h4 className={`font-semibold text-sm ${!isBatchAttendance ? 'text-blue-900' : 'text-gray-700'}`}>
                      Class-wise
                    </h4>
                    <p className={`text-xs ${!isBatchAttendance ? 'text-blue-600' : 'text-gray-500'}`}>
                      Entire class
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsBatchAttendance(true)}
                className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                  isBatchAttendance
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isBatchAttendance ? 'bg-purple-500' : 'bg-gray-200'
                  }`}>
                    <Layers className={`w-4 h-4 ${isBatchAttendance ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-left">
                    <h4 className={`font-semibold text-sm ${isBatchAttendance ? 'text-purple-900' : 'text-gray-700'}`}>
                      Batch-wise
                    </h4>
                    <p className={`text-xs ${isBatchAttendance ? 'text-purple-600' : 'text-gray-500'}`}>
                      Specific batch
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Layout Toggle */}
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Attendance Method</h4>
        <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAttendanceLayout('manual')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    attendanceLayout === 'manual'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileCheck className="w-3 h-3 inline mr-1" />
                  Type Roll Numbers
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceLayout('cards')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    attendanceLayout === 'cards'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-3 h-3 inline mr-1" />
                  Click Cards
                </button>
              </div>
            </div>

            {/* Compact Attendance Marking Mode */}
            <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAttendanceMode('present')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              attendanceMode === 'present'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Present Only
          </button>
          <button
            type="button"
            onClick={() => setAttendanceMode('absent')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              attendanceMode === 'absent'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
                <X className="w-3 h-3 inline mr-1" />
                Absent Only
          </button>
          <button
            type="button"
            onClick={() => setAttendanceMode('both')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              attendanceMode === 'both'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
                <FileCheck className="w-3 h-3 inline mr-1" />
                Both
          </button>
        </div>
            <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                {attendanceLayout === 'manual' && (
                  <>
                    {attendanceMode === 'present' && '✓ Mark only present students - others will be marked absent automatically'}
                    {attendanceMode === 'absent' && '✓ Mark only absent students - others will be marked present automatically'}
                    {attendanceMode === 'both' && '✓ Mark both present and absent students manually'}
                  </>
                )}
                {attendanceLayout === 'cards' && (
                  <>
                    {attendanceMode === 'present' && '✓ Click cards to mark present - unmarked will be absent'}
                    {attendanceMode === 'absent' && '✓ Click cards to mark absent - unmarked will be present'}
                    {attendanceMode === 'both' && '✓ Click cards to cycle: unmarked → present → absent → unmarked'}
                  </>
                )}
              </p>
            </div>
          </div>
      </div>

        {/* Compact Class-wise Filters Section */}
        {!isBatchAttendance && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
        <div>
                <h3 className="text-lg font-semibold text-gray-900">Class Details</h3>
                <p className="text-sm text-gray-600 hidden sm:block">Select class details for attendance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* Teacher Name */}
              <div className="space-y-1">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <UserIcon className="w-3 h-3" />
                  <span>Teacher</span>
                </label>
          <input 
            type="text" 
            value={user?.name || ''} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent" 
            readOnly 
          />
        </div>

              {/* Year Selection */}
              <div className="space-y-1">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <GraduationCap className="w-3 h-3" />
                  <span>Year</span>
                </label>
                <select 
                  value={year} 
                  onChange={e => handleYearChange(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

              {/* Semester Selection */}
              <div className="space-y-1">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <BookOpen className="w-3 h-3" />
                  <span>Semester</span>
                </label>
                <select 
                  value={sem} 
                  onChange={e => setSem(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                >
                  {availableSemesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
          </select>
        </div>

              {/* Division Selection */}
              <div className="space-y-1">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <Building2 className="w-3 h-3" />
                  <span>Division</span>
                </label>
                <select 
                  value={div} 
                  onChange={e => setDiv(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                >
                  {DIVS.map(d => <option key={d} value={d}>Div {d}</option>)}
          </select>
        </div>
            </div>

            {/* Subject Selection */}
        <div>
              <label className="flex items-center space-x-1 text-xs font-medium text-gray-700 mb-2">
                <BookOpen className="w-3 h-3" />
                <span>Subject</span>
              </label>
              <select 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-sm" 
                disabled={subjectsLoading}
              >
            {subjectsLoading ? (
                  <option value="">Loading...</option>
            ) : availableSubjects.length === 0 ? (
              <option value="">No subjects</option>
            ) : (
              availableSubjects.map((sub, idx) => <option key={`${sub}-${idx}`} value={sub}>{sub}</option>)
            )}
          </select>
        </div>

            {/* Date Selection */}
            <div>
              <label className="flex items-center space-x-1 text-xs font-medium text-gray-700 mb-2">
                <Calendar className="w-3 h-3" />
                <span>Date</span>
              </label>
              <div className="relative">
            <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-sm cursor-pointer"
                  max={new Date().toISOString().split('T')[0]}
                  onClick={(e) => {
                    // Ensure calendar opens on mobile and desktop
                    if (e.currentTarget.showPicker) {
                      e.currentTarget.showPicker();
                    }
                  }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="w-4 h-4 text-gray-400" />
          </div>
              </div>
            </div>
          </div>
        )}
          
        {/* Compact Batch-wise Filters Section */}
          {isBatchAttendance && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
        </div>
                <div>
                <h3 className="text-lg font-semibold text-gray-900">Batch Details</h3>
                <p className="text-sm text-gray-600 hidden sm:block">Select class and batch for attendance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* Teacher Name */}
              <div className="space-y-1">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <UserIcon className="w-3 h-3" />
                  <span>Teacher</span>
                </label>
            <input
                  type="text" 
                  value={user?.name || ''} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent" 
                  readOnly 
                />
              </div>

              {/* Year Selection */}
              <div className="space-y-1">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <GraduationCap className="w-3 h-3" />
                  <span>Year</span>
            </label>
                <select 
                  value={year} 
                  onChange={e => handleYearChange(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
          </div>
          
              {/* Semester Selection */}
              <div className="space-y-1">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <BookOpen className="w-3 h-3" />
                  <span>Semester</span>
                </label>
                <select 
                  value={sem} 
                  onChange={e => setSem(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                >
                  {availableSemesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>

              {/* Division Selection */}
              <div className="space-y-1">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <Building2 className="w-3 h-3" />
                  <span>Division</span>
                </label>
                <select 
                  value={div} 
                  onChange={e => setDiv(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                >
                  {DIVS.map(d => <option key={d} value={d}>Div {d}</option>)}
          </select>
        </div>
            </div>

            {/* Subject Selection */}
            <div className="mb-4">
              <label className="flex items-center space-x-1 text-xs font-medium text-gray-700 mb-2">
                <BookOpen className="w-3 h-3" />
                <span>Subject</span>
              </label>
              <select 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent bg-white text-sm" 
                disabled={subjectsLoading}
              >
            {subjectsLoading ? (
                  <option value="">Loading...</option>
            ) : availableSubjects.length === 0 ? (
              <option value="">No subjects</option>
            ) : (
              availableSubjects.map((sub, idx) => <option key={`${sub}-${idx}`} value={sub}>{sub}</option>)
            )}
          </select>
        </div>

            {/* Date Selection */}
            <div className="mb-4">
              <label className="flex items-center space-x-1 text-xs font-medium text-gray-700 mb-2">
                <Calendar className="w-3 h-3" />
                <span>Date</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent bg-white text-sm cursor-pointer"
                  max={new Date().toISOString().split('T')[0]}
                  onClick={(e) => {
                    // Ensure calendar opens on mobile and desktop
                    if (e.currentTarget.showPicker) {
                      e.currentTarget.showPicker();
                    }
                  }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Compact Batch Selection */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                <ClipboardList className="w-4 h-4 mr-2" />
                Select Batch
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">Available Batches</label>
                  <select 
                    value={selectedBatch} 
                    onChange={e => setSelectedBatch(e.target.value)} 
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                    disabled={batchesLoading}
                  >
                    {batchesLoading ? (
                      <option value="">Loading...</option>
                    ) : availableBatches.length === 0 ? (
                      <option value="">No batches</option>
                    ) : (
                      <>
                        <option value="">Select batch</option>
                        {availableBatches.map(batch => (
                          <option key={batch.batchName} value={batch.batchName}>
                            {batch.batchName} ({batch.fromRollNo}-{batch.toRollNo})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                
                {selectedBatch && availableBatches.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">Batch Info</label>
                    <div className="bg-white border border-purple-200 rounded-lg p-3 text-sm">
                      {(() => {
                        const batch = availableBatches.find(b => b.batchName === selectedBatch);
                        if (batch) {
                          const fromRoll = parseInt(batch.fromRollNo);
                          const toRoll = parseInt(batch.toRollNo);
                          const totalStudents = toRoll - fromRoll + 1;
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Rolls:</span>
                                <span className="font-semibold text-purple-900">{batch.fromRollNo}-{batch.toRollNo}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Students:</span>
                                <span className="font-semibold text-purple-900">{totalStudents}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              {availableBatches.length === 0 && !batchesLoading && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-medium">No batches found</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    No batches for {year}, Sem {sem}, Div {div}. Create batches first.
                  </p>
                </div>
              )}
            </div>
            </div>
          )}

        {/* Manual Input Layout */}
        {attendanceLayout === 'manual' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mark Attendance</h3>
                <p className="text-sm text-gray-600 hidden sm:block">Enter roll numbers for students</p>
              </div>
        </div>

          <form onSubmit={handleSubmit} className="space-y-4">
        {/* Present Students Input */}
        {(attendanceMode === 'present' || attendanceMode === 'both') && (
              <div className="space-y-2">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Present Roll Numbers</span>
            </label>
            <textarea
              value={presentRolls}
              onChange={e => setPresentRolls(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-green-50/30 text-sm"
              rows={2}
                  placeholder="Enter roll numbers (e.g., 201, 202, 204)"
            />
                <p className="text-xs text-green-600">Separate with commas or spaces</p>
          </div>
        )}

        {/* Absent Students Input */}
        {(attendanceMode === 'absent' || attendanceMode === 'both') && (
              <div className="space-y-2">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <X className="w-3 h-3 text-red-500" />
                  <span>Absent Roll Numbers</span>
            </label>
            <textarea
              value={absentRolls}
              onChange={e => setAbsentRolls(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-red-50/30 text-sm"
              rows={2}
                  placeholder="Enter roll numbers (e.g., 203, 205, 206)"
            />
                <p className="text-xs text-red-600">Separate with commas or spaces</p>
          </div>
        )}

            {/* Compact Quick Action Buttons */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
          <button 
            type="button" 
            onClick={handleMarkAllPresent} 
                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-medium transition-colors flex items-center space-x-1"
          >
                  <CheckCircle className="w-3 h-3" />
                  <span>All Present</span>
          </button>
          <button 
            type="button" 
            onClick={handleMarkAllAbsent} 
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-medium transition-colors flex items-center space-x-1"
          >
                  <X className="w-3 h-3" />
                  <span>All Absent</span>
          </button>
          <button 
            type="button" 
            onClick={handleClearAll} 
                  className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-xs font-medium transition-colors flex items-center space-x-1"
          >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
          </button>
              </div>
        </div>

            {/* Session Note */}
            <div className="space-y-2">
              <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                <FileCheck className="w-3 h-3 text-blue-500" />
                <span>Session Note (Optional)</span>
              </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Topic covered, remarks, etc."
          />
        </div>

            {/* Compact Submit Section */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Date: <strong className="text-gray-900">{attendanceDate}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Time: <strong className="text-gray-900">{new Date().toLocaleTimeString()}</strong></span>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>Submit</span>
                    </>
                  )}
                </button>
              </div>
        </div>
      </form>
          </div>
        )}

        {/* Card Layout */}
        {attendanceLayout === 'cards' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Click to Mark Attendance</h3>
                <p className="text-sm text-gray-600 hidden sm:block">Click on student cards to mark present/absent</p>
              </div>
            </div>

            {cardsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-600">Loading students...</span>
              </div>
            ) : (
              <>
                {/* Quick Actions for Cards */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      type="button" 
                      onClick={handleMarkAllPresentCards} 
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>All Present</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={handleMarkAllAbsentCards} 
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <X className="w-3 h-3" />
                      <span>All Absent</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={handleClearAllCards} 
                      className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>

                {/* Student Cards Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-4">
                  {studentCards.map((card) => (
                    <button
                      key={card.rollNumber}
                      onClick={() => handleCardClick(card.rollNumber)}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 text-center ${
                        card.status === 'present'
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : card.status === 'absent'
                          ? 'border-red-500 bg-red-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="text-sm font-bold text-gray-900 mb-1">
                        {card.rollNumber}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {card.name}
                      </div>
                      {card.status === 'present' && (
                        <CheckCircle className="w-3 h-3 text-green-500 mx-auto mt-1" />
                      )}
                      {card.status === 'absent' && (
                        <X className="w-3 h-3 text-red-500 mx-auto mt-1" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Session Note */}
                <div className="space-y-2 mb-4">
                  <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                    <FileCheck className="w-3 h-3 text-blue-500" />
                    <span>Session Note (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Topic covered, remarks, etc."
                  />
                </div>

                {/* Submit Section */}
                <form onSubmit={handleSubmit}>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Date: <strong className="text-gray-900">{attendanceDate}</strong></span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Time: <strong className="text-gray-900">{new Date().toLocaleTimeString()}</strong></span>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm" 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Submit</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
        {/* Compact Results Section */}
      {submitted && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
            </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Attendance Submitted!</h3>
                <p className="text-sm text-gray-600 hidden sm:block">Summary of marked attendance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Present Students */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-green-800 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Present ({present.length})
                  </h4>
                  <button 
                    onClick={() => handleCopy(present)} 
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {present.length === 0 ? (
                    <p className="text-green-600 text-xs">None</p>
                  ) : (
                    <div className="space-y-1">
                  {uniqueStudents(present).map((s, idx) => (
                        <div key={String(s.rollNumber || s.id)} className="flex items-center justify-between bg-white rounded p-2 border border-green-200">
                          <div className="flex items-center space-x-2">
                            <span className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 text-xs">{s.name}</p>
                              <p className="text-xs text-gray-500">Roll: {s.rollNumber || s.id}</p>
                            </div>
                          </div>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        </div>
                      ))}
                    </div>
              )}
            </div>
          </div>

              {/* Absent Students */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-red-800 flex items-center">
                    <X className="w-4 h-4 mr-1" />
                    Absent ({absent.length})
                  </h4>
                  <button 
                    onClick={() => handleCopy(absent)} 
                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                  >
                    Copy
                  </button>
            </div>
                <div className="max-h-32 overflow-y-auto">
                  {absent.length === 0 ? (
                    <p className="text-red-600 text-xs">None</p>
                  ) : (
                    <div className="space-y-1">
                  {uniqueStudents(absent).map((s, idx) => (
                        <div key={String(s.rollNumber || s.id)} className="flex items-center justify-between bg-white rounded p-2 border border-red-200">
                          <div className="flex items-center space-x-2">
                            <span className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 text-xs">{s.name}</p>
                              <p className="text-xs text-gray-500">Roll: {s.rollNumber || s.id}</p>
                            </div>
                          </div>
                          <X className="w-3 h-3 text-red-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Compact Summary Stats */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{students.length}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{present.length}</p>
                  <p className="text-xs text-gray-600">Present</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{absent.length}</p>
                  <p className="text-xs text-gray-600">Absent</p>
                </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TakeAttendancePanel; 