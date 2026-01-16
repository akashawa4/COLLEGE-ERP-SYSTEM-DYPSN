import React, { useState, useEffect } from 'react';
import { Download, Calendar, Users, TrendingUp, Edit2, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, attendanceService, subjectService, batchAttendanceService, batchService, getCurrentBatchYear } from '../../firebase/firestore';
import { User, AttendanceLog, EditAttendanceReason } from '../../types';
import { saveAs } from 'file-saver';
import { getDepartmentCode } from '../../utils/departmentMapping';
import { getAvailableSemesters, isValidSemesterForYear, getDefaultSemesterForYear } from '../../utils/semesterMapping';
import { injectDummyData, USE_DUMMY_DATA } from '../../utils/dummyData';

const YEARS = ['1st', '2nd', '3rd', '4th'];
const DIVS = ['A', 'B', 'C', 'D'];

// Subjects are loaded dynamically based on selected filters

interface StudentAttendanceData {
  student: User;
  attendance: AttendanceLog[];
  presentCount: number;
  absentCount: number;
  totalDays: number;
  attendancePercentage: number;
}

const StudentAttendanceList: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [studentAttendanceData, setStudentAttendanceData] = useState<StudentAttendanceData[]>([]);
  const [batchAttendanceData, setBatchAttendanceData] = useState<{ [batchName: string]: AttendanceLog[] }>({});
  const [error, setError] = useState<string>('');
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState('2nd');
  const [selectedSem, setSelectedSem] = useState('3');
  const [selectedDiv, setSelectedDiv] = useState('A');
  const [availableSemesters, setAvailableSemesters] = useState<string[]>(getAvailableSemesters('2'));
  const [selectedSubject, setSelectedSubject] = useState<string>('Software Engineering');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Custom range states
  const [customRangeFrom, setCustomRangeFrom] = useState<string>('');
  const [customRangeTo, setCustomRangeTo] = useState<string>('');
  const [showCustomRangeInputs, setShowCustomRangeInputs] = useState(false);
  
  // Edit attendance states
  const [editingAttendance, setEditingAttendance] = useState<{ student: User; attendance: AttendanceLog } | null>(null);
  const [editReason, setEditReason] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'present' | 'absent' | 'late' | 'leave' | 'half-day'>('present');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedEditReason, setSelectedEditReason] = useState<EditAttendanceReason | null>(null);
  const [editReasons, setEditReasons] = useState<{ [attendanceId: string]: EditAttendanceReason }>({});
  
  // Available subjects and batches
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableBatches, setAvailableBatches] = useState<Array<{batchName: string, fromRollNo: string, toRollNo: string}>>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Set default date to today when component mounts
  useEffect(() => {
    setSelectedDate(getTodayDate());
  }, []);

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
    setSelectedYear(newYear);
    const normalizedYear = newYear.replace(/(st|nd|rd|th)/i, '');
    const newAvailableSemesters = getAvailableSemesters(normalizedYear);
    setAvailableSemesters(newAvailableSemesters);
    
    // If current semester is not valid for new year, reset to first available
    if (!isValidSemesterForYear(normalizedYear, selectedSem)) {
      const defaultSem = getDefaultSemesterForYear(normalizedYear);
      setSelectedSem(defaultSem);
    }
  };

  // Load students and subjects when year, sem, or div changes (NOT when subject/batch/date changes)
  useEffect(() => {
    const loadStudentsAndSubjects = async () => {
      if (!user || (user.role !== 'teacher' && user.role !== 'hod')) return;
      
      try {
        setLoadingStudents(true);
        setError('');
        
        // Get students for selected year, sem, div from batch structure
        const batch = getCurrentBatchYear(); // Use current/ongoing year's batch
        const department = getDepartmentCode(user.department);
        
        const studentsList = await userService.getStudentsByBatchDeptYearSemDiv(
          batch,
          department,
          selectedYear,
          selectedSem,
          selectedDiv
        );
        
        // Inject dummy students if enabled and real data is empty
        const finalStudents = injectDummyData.students(studentsList, {
          year: selectedYear,
          sem: selectedSem,
          div: selectedDiv,
          department: department
        });
        
        setStudents(finalStudents);
        
        // Load subjects dynamically for selected filters
        try {
          setSubjectsLoading(true);
          const deptCode = getDepartmentCode(user.department);
          
          let subs = await subjectService.getSubjectsByDepartment(deptCode, normalizeYear(selectedYear), selectedSem);
          
          // Inject dummy subjects if enabled and real data is empty
          if (USE_DUMMY_DATA && subs.length === 0) {
            const allDummySubjects = injectDummyData.subjects([]);
            const normalizedYear = normalizeYear(selectedYear);
            
            // Filter dummy subjects by department, year, and semester
            subs = allDummySubjects.filter(subject => {
              const subjectDept = subject.department || '';
              const matchesDept = subjectDept === user.department || 
                                 subjectDept === deptCode ||
                                 (deptCode === 'CSE' && subjectDept === 'Computer Science') ||
                                 (deptCode === 'IT' && subjectDept === 'Information Technology') ||
                                 (deptCode === 'ME' && subjectDept === 'Mechanical') ||
                                 (deptCode === 'EE' && subjectDept === 'Electronics') ||
                                 (deptCode === 'CE' && subjectDept === 'Civil');
              
              const matchesYear = subject.year === normalizedYear || subject.year === selectedYear;
              const matchesSem = subject.sem === selectedSem;
              
              return matchesDept && matchesYear && matchesSem;
            });
          }
          
          const names = subs.map(s => s.subjectName).sort();
          setAvailableSubjects(names);
          if (names.length > 0 && !names.includes(selectedSubject)) {
            setSelectedSubject(names[0]);
          }
        } catch (e) {
          // On error, try to use dummy subjects if enabled
          if (USE_DUMMY_DATA) {
            const allDummySubjects = injectDummyData.subjects([]);
            const deptCode = getDepartmentCode(user.department);
            const normalizedYear = normalizeYear(selectedYear);
            
            const subs = allDummySubjects.filter(subject => {
              const subjectDept = subject.department || '';
              const matchesDept = subjectDept === user.department || 
                                 (deptCode === 'CSE' && subjectDept === 'Computer Science') ||
                                 (deptCode === 'IT' && subjectDept === 'Information Technology') ||
                                 (deptCode === 'ME' && subjectDept === 'Mechanical') ||
                                 (deptCode === 'EE' && subjectDept === 'Electronics') ||
                                 (deptCode === 'CE' && subjectDept === 'Civil');
              const matchesYear = subject.year === normalizedYear || subject.year === selectedYear;
              const matchesSem = subject.sem === selectedSem;
              return matchesDept && matchesYear && matchesSem;
            });
            
            const names = subs.map(s => s.subjectName).sort();
            setAvailableSubjects(names);
            if (names.length > 0 && !names.includes(selectedSubject)) {
              setSelectedSubject(names[0]);
            }
          } else {
          setAvailableSubjects([]);
          }
        } finally {
          setSubjectsLoading(false);
        }

        // Load batches for the selected year, sem, div
        setBatchesLoading(true);
        try {
          const batch = getCurrentBatchYear(); // Use current/ongoing year's batch
          const department = getDepartmentCode(user.department);
          const batches = await batchService.getBatchesForDivision(
            batch,
            department,
            selectedYear,
            selectedSem,
            selectedDiv
          );
          setAvailableBatches(batches);
          
          // Reset batch selection if current batch is not available
          if (selectedBatch && !batches.find(b => b.batchName === selectedBatch)) {
            setSelectedBatch('');
          }
        } catch (error) {
          console.error('Error loading batches:', error);
          setAvailableBatches([]);
        } finally {
          setBatchesLoading(false);
        }

        if (studentsList.length === 0) {
          setError(`No students found for ${selectedYear} Year, ${selectedSem} Semester, Division ${selectedDiv}`);
        }
        
      } catch (error) {
        setError('Failed to load students. Please try again.');
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudentsAndSubjects();
  }, [user, selectedYear, selectedSem, selectedDiv]); // Only reload when year/sem/div changes

  // Load attendance data separately when subject, batch, or date changes
  useEffect(() => {
    if (students.length > 0 && selectedDate && selectedSubject) {
      loadAttendanceData(students);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedBatch, selectedDate]); // Reload attendance when these change (students is stable)

  // Filter students by selected batch
  const filterStudentsByBatch = (studentsList: User[]) => {
    if (!selectedBatch) {
      return studentsList;
    }
    
    const selectedBatchData = availableBatches.find(batch => batch.batchName === selectedBatch);
    if (!selectedBatchData) {
      return studentsList;
    }
    
    return studentsList.filter(student => {
      const rollNumber = parseInt(student.rollNumber || '0');
      const fromRoll = parseInt(selectedBatchData.fromRollNo);
      const toRoll = parseInt(selectedBatchData.toRollNo);
      return rollNumber >= fromRoll && rollNumber <= toRoll;
    });
  };

  // Filter attendance data by selected batch
  const filteredAttendanceData = selectedBatch 
    ? studentAttendanceData.filter(data => {
        const selectedBatchData = availableBatches.find(batch => batch.batchName === selectedBatch);
        if (!selectedBatchData) return true;
        
        const rollNumber = parseInt(data.student.rollNumber || '0');
        const fromRoll = parseInt(selectedBatchData.fromRollNo);
        const toRoll = parseInt(selectedBatchData.toRollNo);
        return rollNumber >= fromRoll && rollNumber <= toRoll;
      })
    : studentAttendanceData;

  const loadAttendanceData = async (studentsList: User[]) => {
    if (!selectedDate || !selectedSubject) return;
    
    setLoading(true);
    
    try {
      // Filter students by batch if selected
      const filteredStudents = filterStudentsByBatch(studentsList);
      const studentsWithRollNumbers = filteredStudents.filter(student => student.rollNumber);
      
      if (studentsWithRollNumbers.length === 0) {
        setStudentAttendanceData([]);
        setLoading(false);
        return;
      }
      
      // OPTIMIZATION: Load batch attendance data and student attendance in parallel
      const batch = getCurrentBatchYear();
      const department = getDepartmentCode(user?.department || 'Computer Science');
      
      // Start both batch attendance loading and student attendance loading in parallel
      const [batchDataMap, attendanceResults] = await Promise.all([
        // Load batch attendance data (if batches are available)
        (async () => {
          try {
            // Use cached availableBatches if they exist, otherwise fetch
            const batchesForDivision = availableBatches.length > 0 
              ? availableBatches 
              : await batchService.getBatchesForDivision(batch, department, selectedYear, selectedSem, selectedDiv);
            
            if (batchesForDivision.length === 0) return {};
            
            const batchDataPromises = batchesForDivision.map(async (batchInfo) => {
              try {
                const batchAttendance = await batchAttendanceService.getBatchAttendanceByDate(
                  selectedYear,
                  selectedSem,
                  selectedDiv,
                  batchInfo.batchName,
                  selectedSubject,
                  selectedDate
                );
                return { batchName: batchInfo.batchName, attendance: batchAttendance };
              } catch {
                return { batchName: batchInfo.batchName, attendance: [] };
              }
            });
            
            const batchResults = await Promise.all(batchDataPromises);
            const batchMap: { [batchName: string]: AttendanceLog[] } = {};
            batchResults.forEach(result => {
              if (result.attendance.length > 0) {
                batchMap[result.batchName] = result.attendance;
              }
            });
            return batchMap;
          } catch {
            return {};
          }
        })(),
        
        // Load student attendance in parallel (don't wait for batch data)
        Promise.all(studentsWithRollNumbers.map(async (student) => {
          try {
            // Try to get attendance from regular attendance service
            let studentAttendance = await attendanceService.getOrganizedAttendanceByUserAndDateRange(
              student.rollNumber!,
              selectedYear,
              selectedSem,
              selectedDiv,
              selectedSubject,
              new Date(selectedDate),
              new Date(selectedDate)
            );
            
            // Inject dummy attendance if enabled and real data is empty
            if (USE_DUMMY_DATA && studentAttendance.length === 0) {
              // Get all dummy attendance for this student, then filter by subject and date
              const allDummyAttendance = injectDummyData.attendanceLogs([], {
                year: selectedYear,
                sem: selectedSem,
                div: selectedDiv,
                rollNumber: student.rollNumber
              });
              
              // Normalize date format for comparison
              const normalizeDate = (date: string | Date): string => {
                if (typeof date === 'string') {
                  return date.length > 10 ? date.split('T')[0] : date;
                }
                if (date instanceof Date) {
                  return date.toISOString().split('T')[0];
                }
                return String(date);
              };
              
              const normalizedSelectedDate = normalizeDate(selectedDate);
              
              // Filter by subject and date (normalize dates for comparison)
              studentAttendance = allDummyAttendance.filter(att => {
                const attDate = normalizeDate(att.date);
                return att.subject === selectedSubject && attDate === normalizedSelectedDate;
              });
              
              // If still no attendance found, create a default one for the selected date
              if (studentAttendance.length === 0) {
                // Create attendance with deterministic status based on rollNumber
                // This ensures some students are present and some are absent
                const rollNum = student.rollNumber || '';
                const rollNumHash = rollNum.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const statusValue = rollNumHash % 10;
                
                let status: 'present' | 'absent' | 'late' = 'present';
                // 60% present, 20% late, 20% absent for better distribution
                if (statusValue < 2) status = 'absent';
                else if (statusValue < 4) status = 'late';
                else status = 'present';
                
                studentAttendance = [{
                  id: `att_dummy_${student.id}_${normalizedSelectedDate}`,
                  userId: student.id,
                  userName: student.name,
                  rollNumber: student.rollNumber,
                  date: normalizedSelectedDate,
                  status: status,
                  subject: selectedSubject,
                  year: selectedYear,
                  sem: selectedSem,
                  div: selectedDiv
                } as AttendanceLog];
              }
            }
            
            // Calculate attendance statistics for selected date only
            // For a single date, count present/absent based on the status
            let presentCount = 0;
            let absentCount = 0;
            
            if (studentAttendance.length > 0) {
              const attendanceRecord = studentAttendance[0];
              if (attendanceRecord.status === 'present' || attendanceRecord.status === 'late') {
                presentCount = 1;
              } else if (attendanceRecord.status === 'absent') {
                absentCount = 1;
              }
            }
            
            const totalDays = studentAttendance.length;
            const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
            
            // Load edit reasons for this student's attendance
            if (studentAttendance.length > 0) {
              await loadEditReasons(studentAttendance);
            }
            
            return {
              student,
              attendance: studentAttendance,
              presentCount,
              absentCount,
              totalDays,
              attendancePercentage
            };
          } catch {
            // Return student with dummy attendance if there's an error and dummy data is enabled
            let attendance: AttendanceLog[] = [];
            if (USE_DUMMY_DATA) {
              // Get all dummy attendance for this student, then filter by subject and date
              const allDummyAttendance = injectDummyData.attendanceLogs([], {
                year: selectedYear,
                sem: selectedSem,
                div: selectedDiv,
                rollNumber: student.rollNumber
              });
              
              // Normalize date format for comparison
              const normalizeDate = (date: string | Date): string => {
                if (typeof date === 'string') {
                  return date.length > 10 ? date.split('T')[0] : date;
                }
                if (date instanceof Date) {
                  return date.toISOString().split('T')[0];
                }
                return String(date);
              };
              
              const normalizedSelectedDate = normalizeDate(selectedDate);
              
              // Filter by subject and date (normalize dates for comparison)
              attendance = allDummyAttendance.filter(att => {
                const attDate = normalizeDate(att.date);
                return att.subject === selectedSubject && attDate === normalizedSelectedDate;
              });
              
              // If still no attendance found, create a default one for the selected date
              if (attendance.length === 0) {
                // Create attendance with deterministic status based on rollNumber
                const rollNum = student.rollNumber || '';
                const rollNumHash = rollNum.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const statusValue = rollNumHash % 10;
                
                let status: 'present' | 'absent' | 'late' = 'present';
                // 60% present, 20% late, 20% absent for better distribution
                if (statusValue < 2) status = 'absent';
                else if (statusValue < 4) status = 'late';
                else status = 'present';
                
                attendance = [{
                  id: `att_dummy_${student.id}_${normalizedSelectedDate}`,
                  userId: student.id,
                  userName: student.name,
                  rollNumber: student.rollNumber,
                  date: normalizedSelectedDate,
                  status: status,
                  subject: selectedSubject,
                  year: selectedYear,
                  sem: selectedSem,
                  div: selectedDiv
                } as AttendanceLog];
              }
            }
            
            // Calculate attendance statistics for selected date only
            // For a single date, count present/absent based on the status
            let presentCount = 0;
            let absentCount = 0;
            
            if (attendance.length > 0) {
              const attendanceRecord = attendance[0];
              if (attendanceRecord.status === 'present' || attendanceRecord.status === 'late') {
                presentCount = 1;
              } else if (attendanceRecord.status === 'absent') {
                absentCount = 1;
              }
            }
            
            const totalDays = attendance.length;
            const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
            
            return {
              student,
              attendance,
              presentCount,
              absentCount,
              totalDays,
              attendancePercentage
            };
          }
        }))
      ]);
      
      // Update batch attendance data
      setBatchAttendanceData(batchDataMap);
      
      // If no regular attendance found for some students, check batch attendance
      const finalResults = attendanceResults.map((result) => {
        if (result.attendance.length === 0 && Object.keys(batchDataMap).length > 0) {
          // Find which batch this student belongs to
          const studentBatch = availableBatches.find(batch => {
            const rollNumber = parseInt(result.student.rollNumber || '0');
            const fromRoll = parseInt(batch.fromRollNo);
            const toRoll = parseInt(batch.toRollNo);
            return rollNumber >= fromRoll && rollNumber <= toRoll;
          });
          
          if (studentBatch && batchDataMap[studentBatch.batchName]) {
            const batchAttendance = batchDataMap[studentBatch.batchName];
            const studentBatchAttendance = batchAttendance.filter(att => 
              att.userId === result.student.id || att.userName === result.student.name
            );
            
            if (studentBatchAttendance.length > 0) {
              const presentCount = studentBatchAttendance.filter(a => a.status === 'present').length;
              const absentCount = studentBatchAttendance.filter(a => a.status === 'absent').length;
              const totalDays = studentBatchAttendance.length;
              const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
              
              return {
                ...result,
                attendance: studentBatchAttendance,
                presentCount,
                absentCount,
                totalDays,
                attendancePercentage
              };
            }
          }
        }
        return result;
      });
      
      setStudentAttendanceData(finalResults);
      
      // Load edit reasons for all attendance records
      const allAttendanceRecords = finalResults.flatMap(result => result.attendance);
      if (allAttendanceRecords.length > 0) {
        await loadEditReasons(allAttendanceRecords);
      }
      
    } catch (error) {
      console.error('Error loading attendance data:', error);
      setStudentAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load edit reasons for attendance records
  const loadEditReasons = async (attendanceRecords: AttendanceLog[]) => {
    const reasonsMap: { [attendanceId: string]: EditAttendanceReason } = {};
    for (const record of attendanceRecords) {
      if (record.isEdited && record.id) {
        try {
          const reason = await attendanceService.getEditReason(record.id);
          if (reason) {
            reasonsMap[record.id] = reason;
          }
        } catch (error) {
          console.error('Error loading edit reason:', error);
        }
      }
    }
    setEditReasons(reasonsMap);
  };

  // Handle edit attendance
  const handleEditAttendance = (student: User, attendance: AttendanceLog) => {
    setEditingAttendance({ student, attendance });
    setNewStatus(attendance.status || 'present');
    setEditReason('');
    setShowEditModal(true);
  };

  // Submit edit attendance
  const handleSubmitEdit = async () => {
    if (!editingAttendance || !editReason.trim()) {
      alert('Please provide a reason for editing attendance');
      return;
    }

    try {
      await attendanceService.editAttendance(
        editingAttendance.attendance.id,
        editingAttendance.attendance,
        newStatus,
        editReason.trim(),
        user?.id || '',
        user?.name || 'Unknown'
      );

      // Reload attendance data
      await loadAttendanceData(students);
      setShowEditModal(false);
      setEditingAttendance(null);
      setEditReason('');
      alert('Attendance updated successfully');
    } catch (error: any) {
      alert(`Failed to update attendance: ${error.message}`);
    }
  };

  // Show edit reason
  const handleShowEditReason = async (attendanceId: string) => {
    if (editReasons[attendanceId]) {
      setSelectedEditReason(editReasons[attendanceId]);
      setShowReasonModal(true);
    } else {
      try {
        // Try to get the edit reason using the attendance ID
        // The actual Firestore document ID might be different (rollNumber_date format)
        // So we need to try multiple approaches
        let reason = await attendanceService.getEditReason(attendanceId);
        
        // If not found, try to extract rollNumber and date from the attendance record
        if (!reason) {
          // Find the attendance record to get rollNumber and date
          const attendanceRecord = filteredAttendanceData
            .flatMap(data => data.attendance)
            .find(att => att.id === attendanceId);
          
          if (attendanceRecord) {
            // Try with the standard format: rollNumber_date
            const rollNumber = (attendanceRecord as any).rollNumber || attendanceRecord.userId;
            const dateStr = typeof attendanceRecord.date === 'string' 
              ? attendanceRecord.date.split('T')[0] 
              : attendanceRecord.date instanceof Date 
                ? attendanceRecord.date.toISOString().split('T')[0]
                : '';
            
            if (rollNumber && dateStr) {
              const standardId = `${rollNumber}_${dateStr}`;
              reason = await attendanceService.getEditReason(standardId);
            }
          }
        }
        
        if (reason) {
          setSelectedEditReason(reason);
          setShowReasonModal(true);
          setEditReasons({ ...editReasons, [attendanceId]: reason });
        } else {
          alert('No edit reason found');
        }
      } catch (error) {
        console.error('Error loading edit reason:', error);
        alert('Failed to load edit reason');
      }
    }
  };

  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    // Attendance will reload automatically via useEffect
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    // Attendance will reload automatically via useEffect
  };

  const handleExportAttendance = async () => {
    if (!selectedSubject || !selectedDate) {
      alert('Please select a subject and date to export attendance data.');
      return;
    }
    
    setExporting(true);
    try {
      const header = ['Sr No', 'Name', 'Division', 'Roll No', 'Subject', 'Selected Date', 'Present Percentage', 'Absent Percentage'];
      
      const rows: any[] = [];
      let srNo = 1;
      
      for (const data of filteredAttendanceData) {
        const row = [
          srNo++,
          data.student.name,
          selectedDiv,
          data.student.rollNumber,
          selectedSubject,
          selectedDate,
          `${data.attendancePercentage}%`,
          `${data.totalDays > 0 ? Math.round((data.absentCount / data.totalDays) * 100) : 0}%`
        ];
        
        rows.push(row);
      }
      
      const csv = [header, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const batchSuffix = selectedBatch ? `_${selectedBatch}` : '';
      saveAs(blob, `attendance_${selectedYear}_${selectedSem}_${selectedDiv}_${selectedSubject}${batchSuffix}_${selectedDate}.csv`);
      
    } catch (error) {
      alert('Failed to export attendance data.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPresentOnly = async () => {
    if (!selectedSubject || !selectedDate) {
      alert('Please select a subject and date to export attendance data.');
      return;
    }

    setExporting(true);
    try {
      const header = ['Sr No', 'Name', 'Division', 'Roll No', 'Subject', 'Selected Date'];
      const rows: any[] = [];
      let srNo = 1;

      for (const data of filteredAttendanceData) {
        if (data.presentCount > 0) {
          rows.push([
            srNo++,
            data.student.name,
            selectedDiv,
            data.student.rollNumber,
            selectedSubject,
            selectedDate
          ]);
        }
      }

      const csv = [header, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const batchSuffix = selectedBatch ? `_${selectedBatch}` : '';
      saveAs(blob, `present_only_${selectedYear}_${selectedSem}_${selectedDiv}_${selectedSubject}${batchSuffix}_${selectedDate}.csv`);
    } catch (error) {
      alert('Failed to export present-only data.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportAbsentOnly = async () => {
    if (!selectedSubject || !selectedDate) {
      alert('Please select a subject and date to export attendance data.');
      return;
    }

    setExporting(true);
    try {
      const header = ['Sr No', 'Name', 'Division', 'Roll No', 'Subject', 'Selected Date'];
      const rows: any[] = [];
      let srNo = 1;

      for (const data of filteredAttendanceData) {
        if (data.absentCount > 0) {
          rows.push([
            srNo++,
            data.student.name,
            selectedDiv,
            data.student.rollNumber,
            selectedSubject,
            selectedDate
          ]);
        }
      }

      const csv = [header, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const batchSuffix = selectedBatch ? `_${selectedBatch}` : '';
      saveAs(blob, `absent_only_${selectedYear}_${selectedSem}_${selectedDiv}_${selectedSubject}${batchSuffix}_${selectedDate}.csv`);
    } catch (error) {
      alert('Failed to export absent-only data.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportMonthReport = async () => {
    if (!selectedSubject) {
      alert('Please select a subject to export month report.');
      return;
    }
    
    setExporting(true);
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const startDate = firstDayOfMonth.toISOString().split('T')[0];
      const endDate = lastDayOfMonth.toISOString().split('T')[0];
      
      // Generate all dates in the month
      const dates: string[] = [];
      const currentDate = new Date(firstDayOfMonth);
      while (currentDate <= lastDayOfMonth) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const header = ['Sr No', 'Name', 'Division', 'Roll No', 'Subject', ...dates, 'Total Present Days', 'Total Absent Days', 'Present Percentage'];
      
      // Use Promise.all for parallel processing - much faster
      const filteredStudents = filterStudentsByBatch(students);
      const studentsWithRollNumbers = filteredStudents.filter(s => s.rollNumber);
      const monthAttendancePromises = studentsWithRollNumbers.map(async (student, index) => {
        try {
          const monthAttendance = await attendanceService.getOrganizedAttendanceByUserAndDateRange(
            student.rollNumber!,
            selectedYear,
            selectedSem,
            selectedDiv,
            selectedSubject,
            firstDayOfMonth,
            lastDayOfMonth
          );
          
          // Create a map of date to attendance status
          const attendanceByDate = new Map<string, string>();
          monthAttendance.forEach(att => {
            const dateStr = att.date instanceof Date ? att.date.toISOString().split('T')[0] : 
                           (att.date as any)?.toDate?.()?.toISOString().split('T')[0] || att.date;
            attendanceByDate.set(dateStr, att.status);
          });
          
          // Generate daily attendance status for each date
          const dailyStatus = dates.map(date => {
            const status = attendanceByDate.get(date);
            return status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : '-';
          });
          
          // Calculate totals
          const totalPresentDays = monthAttendance.filter(a => a.status === 'present').length;
          const totalAbsentDays = monthAttendance.filter(a => a.status === 'absent').length;
          const totalDays = monthAttendance.length;
          const presentPercentage = totalDays > 0 ? Math.round((totalPresentDays / totalDays) * 100) : 0;
          
          return {
            srNo: index + 1,
            name: student.name,
            division: selectedDiv,
            rollNo: student.rollNumber,
            subject: selectedSubject,
            dailyStatus,
            totalPresentDays,
            totalAbsentDays,
            presentPercentage: `${presentPercentage}%`
          };
        } catch (error) {
          // Return student with zero attendance if there's an error
          return {
            srNo: index + 1,
            name: student.name,
            division: selectedDiv,
            rollNo: student.rollNumber,
            subject: selectedSubject,
            dailyStatus: dates.map(() => '-'),
            totalPresentDays: 0,
            totalAbsentDays: 0,
            presentPercentage: '0%'
          };
        }
      });
      
      // Execute all promises in parallel using Promise.all
      const monthResults = await Promise.all(monthAttendancePromises);
      
      // Convert results to CSV rows
      const rows = monthResults.map(result => [
        result.srNo,
        result.name,
        result.division,
        result.rollNo,
        result.subject,
        ...result.dailyStatus,
        result.totalPresentDays,
        result.totalAbsentDays,
        result.presentPercentage
      ]);
      
      const csv = [header, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const batchSuffix = selectedBatch ? `_${selectedBatch}` : '';
      saveAs(blob, `month_report_${selectedYear}_${selectedSem}_${selectedDiv}_${selectedSubject}${batchSuffix}_${startDate}_to_${endDate}.csv`);
      
    } catch (error) {
      alert('Failed to export month report.');
    } finally {
      setExporting(false);
    }
  };

  const handleCustomRangeConfirm = async () => {
    if (!customRangeFrom || !customRangeTo) {
      alert('Please enter both start and end dates.');
      return;
    }
    
    setExporting(true);
    try {
      // Generate all dates in the range
      const dates: string[] = [];
      const startDate = new Date(customRangeFrom);
      const endDate = new Date(customRangeTo);
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const header = ['Sr No', 'Name', 'Division', 'Roll No', 'Subject', ...dates, 'Total Present Days', 'Total Absent Days', 'Present Percentage'];
      
      // Use Promise.all for parallel processing - much faster
      const filteredStudents = filterStudentsByBatch(students);
      const studentsWithRollNumbers = filteredStudents.filter(s => s.rollNumber);
      const customRangePromises = studentsWithRollNumbers.map(async (student, index) => {
        try {
          const rangeAttendance = await attendanceService.getOrganizedAttendanceByUserAndDateRange(
            student.rollNumber!,
            selectedYear,
            selectedSem,
            selectedDiv,
            selectedSubject,
            startDate,
            endDate
          );
          
          // Create a map of date to attendance status
          const attendanceByDate = new Map<string, string>();
          rangeAttendance.forEach(att => {
            const dateStr = att.date instanceof Date ? att.date.toISOString().split('T')[0] : 
                           (att.date as any)?.toDate?.()?.toISOString().split('T')[0] || att.date;
            attendanceByDate.set(dateStr, att.status);
          });
          
          // Generate daily attendance status for each date
          const dailyStatus = dates.map(date => {
            const status = attendanceByDate.get(date);
            return status === 'present' ? 'P' : status === 'absent' ? 'A' : '-';
          });
          
          // Calculate totals
          const totalPresentDays = rangeAttendance.filter(a => a.status === 'present').length;
          const totalAbsentDays = rangeAttendance.filter(a => a.status === 'absent').length;
          const totalDays = rangeAttendance.length;
          const presentPercentage = totalDays > 0 ? Math.round((totalPresentDays / totalDays) * 100) : 0;
          
          return {
            srNo: index + 1,
            name: student.name,
            division: selectedDiv,
            rollNo: student.rollNumber,
            subject: selectedSubject,
            dailyStatus,
            totalPresentDays,
            totalAbsentDays,
            presentPercentage: `${presentPercentage}%`
          };
        } catch (error) {
          // Return student with zero attendance if there's an error
          return {
            srNo: index + 1,
            name: student.name,
            division: selectedDiv,
            rollNo: student.rollNumber,
            subject: selectedSubject,
            dailyStatus: dates.map(() => '-'),
            totalPresentDays: 0,
            totalAbsentDays: 0,
            presentPercentage: '0%'
          };
        }
      });
      
      // Execute all promises in parallel using Promise.all
      const customRangeResults = await Promise.all(customRangePromises);
      
      // Convert results to CSV rows
      const rows = customRangeResults.map(result => [
        result.srNo,
        result.name,
        result.division,
        result.rollNo,
        result.subject,
        ...result.dailyStatus,
        result.totalPresentDays,
        result.totalAbsentDays,
        result.presentPercentage
      ]);
      
      const csv = [header, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const batchSuffix = selectedBatch ? `_${selectedBatch}` : '';
      saveAs(blob, `custom_range_${selectedYear}_${selectedSem}_${selectedDiv}_${selectedSubject}${batchSuffix}_${customRangeFrom}_to_${customRangeTo}.csv`);
      
    } catch (error) {
      alert('Failed to export custom range report.');
    } finally {
      setExporting(false);
      setShowCustomRangeInputs(false);
    }
  };

  if (!user || (user.role !== 'teacher' && user.role !== 'hod')) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-600">Access denied. Only teachers and HODs can view student attendance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Attendance</h1>
        <p className="text-gray-600">Track student daily attendance</p>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
            >
              {YEARS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select 
              value={selectedSem} 
              onChange={(e) => setSelectedSem(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
            >
              {availableSemesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
            <select 
              value={selectedDiv} 
              onChange={(e) => setSelectedDiv(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
            >
              {DIVS.map(div => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
              required
              disabled={subjectsLoading}
            >
              {subjectsLoading ? (
                <option value="">Loading subjects...</option>
              ) : availableSubjects.length > 0 ? (
                availableSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))
              ) : (
                <option value="">No subjects available</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch (Optional)</label>
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
              disabled={batchesLoading}
            >
              <option value="">All Batches</option>
              {batchesLoading ? (
                <option value="">Loading batches...</option>
              ) : availableBatches.length > 0 ? (
                availableBatches.map(batch => (
                  <option key={batch.batchName} value={batch.batchName}>
                    {batch.batchName} ({batch.fromRollNo}-{batch.toRollNo})
                  </option>
                ))
              ) : (
                <option value="">No batches available</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 space-y-3 sm:space-y-0">
          <div className="text-sm text-gray-600 w-full sm:w-auto">
            <strong>Selected Date:</strong> {selectedDate || getTodayDate()}
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button 
              onClick={handleExportAttendance}
              disabled={exporting || !selectedSubject || !selectedDate}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-w-[120px] touch-manipulation active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{exporting ? 'Downloading...' : 'Daily Report'}</span>
              <span className="sm:hidden">{exporting ? '...' : 'Daily'}</span>
            </button>

            <button 
              onClick={handleExportPresentOnly}
              disabled={exporting || !selectedSubject || !selectedDate}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-w-[150px] touch-manipulation active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{exporting ? 'Downloading...' : 'Present Only'}</span>
              <span className="sm:hidden">{exporting ? '...' : 'Present'}</span>
            </button>

            <button 
              onClick={handleExportAbsentOnly}
              disabled={exporting || !selectedSubject || !selectedDate}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-w-[150px] touch-manipulation active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{exporting ? 'Downloading...' : 'Absent Only'}</span>
              <span className="sm:hidden">{exporting ? '...' : 'Absent'}</span>
            </button>
            
            <button 
              onClick={handleExportMonthReport}
              disabled={exporting || !selectedSubject}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-w-[120px] touch-manipulation active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{exporting ? 'Downloading...' : 'Monthly Report'}</span>
              <span className="sm:hidden">{exporting ? '...' : 'Monthly'}</span>
            </button>
            
            <button 
              onClick={() => setShowCustomRangeInputs(!showCustomRangeInputs)}
              disabled={exporting || !selectedSubject}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-w-[120px] touch-manipulation active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{showCustomRangeInputs ? 'Hide Custom Range' : 'Custom Report'}</span>
              <span className="sm:hidden">{showCustomRangeInputs ? 'Hide' : 'Custom'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Range Inputs */}
      {showCustomRangeInputs && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mt-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Download Custom Date Range Report</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input 
                type="date" 
                value={customRangeFrom}
                onChange={(e) => setCustomRangeFrom(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 touch-manipulation"
                placeholder="Select start date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input 
                type="date" 
                value={customRangeTo}
                onChange={(e) => setCustomRangeTo(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 touch-manipulation"
                placeholder="Select end date"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
            <button 
              onClick={() => {
                setShowCustomRangeInputs(false);
                setCustomRangeFrom('');
                setCustomRangeTo('');
              }}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors touch-manipulation active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={handleCustomRangeConfirm}
              disabled={exporting || !customRangeFrom || !customRangeTo}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors touch-manipulation active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Downloading...' : 'Download Report'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State for Subjects */}
      {subjectsLoading && (
        <div className="text-center py-4 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading subjects...</p>
        </div>
      )}

      {/* Summary Stats */}
      {!loadingStudents && !error && students.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Students</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{filterStudentsByBatch(students).length}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Present Today</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {filteredAttendanceData.filter(data => data.presentCount > 0).length}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Date</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900">
                  {selectedDate || getTodayDate()}
                </p>
              </div>
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Subject</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900">
                  {selectedSubject}
                </p>
              </div>
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
          </div>
        </div>
      )}

        {/* Batch Attendance Summary */}
        {Object.keys(batchAttendanceData).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Attendance Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(batchAttendanceData)
                .filter(([batchName]) => !selectedBatch || batchName === selectedBatch)
                .map(([batchName, attendance]) => {
                  const presentCount = attendance.filter(a => a.status === 'present').length;
                  const absentCount = attendance.filter(a => a.status === 'absent').length;
                  const totalCount = attendance.length;
                  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
                  
                  return (
                    <div key={batchName} className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{batchName}</h4>
                        <span className="text-sm text-gray-600">{percentage}%</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Present: {presentCount}</span>
                          <span>Absent: {absentCount}</span>
                        </div>
                        <div className="mt-1">
                          <span>Total: {totalCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      {/* Loading State for Students */}
      {loadingStudents && (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading students...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm sm:text-base text-red-600 font-medium">{error}</p>
          <p className="text-xs sm:text-sm text-red-500 mt-2">Please check your selection and try again.</p>
        </div>
      )}

      {/* Loading State for Attendance Data */}
      {loading && !loadingStudents && (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading attendance data...</p>
        </div>
      )}

      {/* Student Attendance Table */}
      {!loading && !loadingStudents && !error && filteredAttendanceData.length > 0 && (
        <>
          {/* Mobile Card View - Hidden on larger screens */}
          <div className="lg:hidden space-y-3">
            {filteredAttendanceData.map((data, index) => (
              <div key={data.student.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{data.student.name}</h3>
                      <p className="text-xs text-gray-500">Roll No: {data.student.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    data.presentCount > 0 ? 'bg-green-100 text-green-800' :
                    data.absentCount > 0 ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {data.presentCount > 0 ? 'Present' :
                     data.absentCount > 0 ? 'Absent' : 'Not Marked'}
                  </span>
                    {data.attendance.some(a => a.isEdited) && (
                      <button
                        onClick={() => {
                          const editedAtt = data.attendance.find(a => a.isEdited);
                          if (editedAtt) handleShowEditReason(editedAtt.id);
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200"
                        title="Click to view edit reason"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edited
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600">Subject</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedSubject}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600">Present</p>
                    <p className="text-sm font-semibold text-green-600">{data.presentCount}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600">Absent</p>
                    <p className="text-sm font-semibold text-red-600">{data.absentCount}</p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Attendance %</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      data.attendancePercentage >= 75 ? 'bg-green-100 text-green-800' :
                      data.attendancePercentage >= 60 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {data.attendancePercentage}%
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      // Create a default attendance record if none exists
                      const attendanceRecord: AttendanceLog = data.attendance.length > 0 
                        ? data.attendance[0]
                        : {
                            id: `${data.student.rollNumber}_${selectedDate}`,
                            userId: data.student.id,
                            userName: data.student.name,
                            date: selectedDate,
                            status: 'absent',
                            subject: selectedSubject,
                            year: selectedYear,
                            sem: selectedSem,
                            div: selectedDiv
                          };
                      handleEditAttendance(data.student, attendanceRecord);
                    }}
                    className="w-full mt-2 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-200"
                    title="Edit attendance"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendanceData.map((data, index) => (
                    <tr key={data.student.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{index + 1}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{data.student.name}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{data.student.rollNumber}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{selectedSubject}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          data.presentCount > 0 ? 'bg-green-100 text-green-800' :
                          data.absentCount > 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {data.presentCount > 0 ? 'Present' :
                           data.absentCount > 0 ? 'Absent' : 'Not Marked'}
                        </span>
                          {data.attendance.some(a => a.isEdited) && (
                            <button
                              onClick={() => {
                                const editedAtt = data.attendance.find(a => a.isEdited);
                                if (editedAtt) handleShowEditReason(editedAtt.id);
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                              title="Click to view edit reason"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edited
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {data.presentCount}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {data.absentCount}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          data.attendancePercentage >= 75 ? 'bg-green-100 text-green-800' :
                          data.attendancePercentage >= 60 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {data.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                        <button
                          onClick={() => {
                            // Create a default attendance record if none exists
                            const attendanceRecord: AttendanceLog = data.attendance.length > 0 
                              ? data.attendance[0]
                              : {
                                  id: `${data.student.rollNumber}_${selectedDate}`,
                                  userId: data.student.id,
                                  userName: data.student.name,
                                  date: selectedDate,
                                  status: 'absent',
                                  subject: selectedSubject,
                                  year: selectedYear,
                                  sem: selectedSem,
                                  div: selectedDiv
                                };
                            handleEditAttendance(data.student, attendanceRecord);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Edit attendance"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* No Data State */}
      {!loading && !loadingStudents && !error && filteredAttendanceData.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-sm sm:text-base text-gray-600">No attendance data found for the selected date.</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">Please check if attendance has been marked for the selected subject and date.</p>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {showEditModal && editingAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Attendance</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAttendance(null);
                  setEditReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Student:</strong> {editingAttendance.student.name}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Roll No:</strong> {editingAttendance.student.rollNumber}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Current Status:</strong> {editingAttendance.attendance.status}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status <span className="text-red-500">*</span>
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="leave">Leave</option>
                <option value="half-day">Half Day</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Edit <span className="text-red-500">*</span>
              </label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Please provide a reason for editing this attendance..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {!editReason.trim() && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Reason is required to edit attendance
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAttendance(null);
                  setEditReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={!editReason.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reason Modal */}
      {showReasonModal && selectedEditReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Reason</h3>
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setSelectedEditReason(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Student:</p>
                <p className="text-sm text-gray-900">{selectedEditReason.userName}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Status Change:</p>
                <p className="text-sm text-gray-900">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs mr-1">
                    {selectedEditReason.oldStatus}
                  </span>
                  →
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs ml-1">
                    {selectedEditReason.newStatus}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Reason:</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedEditReason.reason}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Edited By:</p>
                <p className="text-sm text-gray-900">{selectedEditReason.editedByName}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Date:</p>
                <p className="text-sm text-gray-900">{selectedEditReason.date}</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setSelectedEditReason(null);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceList;