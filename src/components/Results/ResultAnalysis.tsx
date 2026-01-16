import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resultService, userService, subjectService, getBatchYear } from '../../firebase/firestore';
import { getDepartmentCode, getDepartmentName } from '../../utils/departmentMapping';
import { getAvailableSemesters } from '../../utils/semesterMapping';
import { injectDummyData, USE_DUMMY_DATA, dummyResults, dummyStudents } from '../../utils/dummyData';
import { BarChart3, TrendingUp, TrendingDown, Users, CheckCircle, XCircle, BookOpen, Award, AlertTriangle, Download, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

const YEARS = ['1st', '2nd', '3rd', '4th'];
const DIVS = ['A', 'B', 'C', 'D'];
const EXAM_TYPES = ['UT1', 'UT2', 'Practical', 'Viva', 'Midterm', 'Endsem'];

interface AnalysisStats {
  totalAppeared: number;
  totalPassed: number;
  totalFailed: number;
  passPercentage: number;
}

interface BranchAnalysis {
  branch: string;
  appeared: number;
  passed: number;
  failed: number;
  passPercentage: number;
}

interface SemesterAnalysis {
  semester: string;
  appeared: number;
  passed: number;
  failed: number;
  passPercentage: number;
  averageMarks: number;
}

interface SubjectAnalysis {
  subject: string;
  appeared: number;
  passed: number;
  failed: number;
  failPercentage: number;
  averageMarks: number;
}

interface GradeDistribution {
  distinction: number; // ≥75%
  firstClass: number; // 60-74%
  secondClass: number; // 50-59%
  passClass: number; // 40-49%
  fail: number; // <40%
}

interface ATKTAnalysis {
  totalATKT: number;
  subjectWiseATKT: { [subject: string]: number };
  branchWiseATKT: { [branch: string]: number };
}

const ResultAnalysis: React.FC = () => {
  const { user } = useAuth();
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSem, setSelectedSem] = useState<string>('all');
  const [selectedDiv, setSelectedDiv] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedExamType, setSelectedExamType] = useState<string>('all');
  const [analysisView, setAnalysisView] = useState<string>('basic'); // 'basic', 'branch', 'semester', 'subject', 'grade', 'atkt', 'trend', 'student'
  
  // Data states
  const [loading, setLoading] = useState<boolean>(false);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [basicStats, setBasicStats] = useState<AnalysisStats>({ totalAppeared: 0, totalPassed: 0, totalFailed: 0, passPercentage: 0 });
  const [branchAnalysis, setBranchAnalysis] = useState<BranchAnalysis[]>([]);
  const [semesterAnalysis, setSemesterAnalysis] = useState<SemesterAnalysis[]>([]);
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution>({ distinction: 0, firstClass: 0, secondClass: 0, passClass: 0, fail: 0 });
  const [atktAnalysis, setAtktAnalysis] = useState<ATKTAnalysis>({ totalATKT: 0, subjectWiseATKT: {}, branchWiseATKT: {} });
  const [selectedStatBox, setSelectedStatBox] = useState<string | null>(null); // 'appeared', 'passed', 'failed', 'distinction', 'firstClass', 'secondClass', 'passClass', 'fail'
  const [statBoxStudents, setStatBoxStudents] = useState<any[]>([]);
  const [passedStudentsList, setPassedStudentsList] = useState<any[]>([]);
  const [failedStudentsList, setFailedStudentsList] = useState<any[]>([]);
  const [allAppearedStudentsList, setAllAppearedStudentsList] = useState<any[]>([]);
  const [distinctionStudents, setDistinctionStudents] = useState<any[]>([]);
  const [firstClassStudents, setFirstClassStudents] = useState<any[]>([]);
  const [secondClassStudents, setSecondClassStudents] = useState<any[]>([]);
  const [passClassStudents, setPassClassStudents] = useState<any[]>([]);
  const [failStudents, setFailStudents] = useState<any[]>([]);
  
  // Download modal states
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [exportAnalysisView, setExportAnalysisView] = useState<string>(analysisView);
  const [exportYear, setExportYear] = useState<string>(selectedYear);
  const [exportSem, setExportSem] = useState<string>(selectedSem);
  const [exportDiv, setExportDiv] = useState<string>(selectedDiv);
  const [exportDepartment, setExportDepartment] = useState<string>(selectedDepartment);
  const [exportExamType, setExportExamType] = useState<string>(selectedExamType);
  
  const availableSemesters = selectedYear !== 'all' ? getAvailableSemesters(selectedYear.replace(/(st|nd|rd|th)/i, '')) : ['1', '2', '3', '4', '5', '6', '7', '8'];
  const exportAvailableSemesters = exportYear !== 'all' ? getAvailableSemesters(exportYear.replace(/(st|nd|rd|th)/i, '')) : ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  // Load all results based on filters
  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      let results: any[] = [];
      
      // Always use dummy results for demo purposes
      // This ensures we have comprehensive data for all analysis views using real demo students
      // Directly use dummyResults which are generated from dummyStudents (real demo data)
      results = [...dummyResults];
      
      // Log for debugging
      console.log('[ResultAnalysis] Loaded results:', results.length);
      if (results.length > 0) {
        console.log('[ResultAnalysis] Sample result:', results[0]);
        const passCount = results.filter(r => (r.percentage || 0) >= 40).length;
        const failCount = results.filter(r => (r.percentage || 0) < 40).length;
        console.log('[ResultAnalysis] Pass:', passCount, 'Fail:', failCount);
      }
      
      // Apply filters
      let filtered = results;
      
      if (selectedYear !== 'all') {
        filtered = filtered.filter(r => r.year === selectedYear);
      }
      if (selectedSem !== 'all') {
        filtered = filtered.filter(r => r.sem === selectedSem);
      }
      if (selectedDiv !== 'all') {
        filtered = filtered.filter(r => r.div === selectedDiv);
      }
      if (selectedDepartment !== 'all') {
        const deptName = getDepartmentName(selectedDepartment);
        filtered = filtered.filter(r => r.department === deptName || r.department === selectedDepartment);
      }
      if (selectedExamType !== 'all') {
        filtered = filtered.filter(r => r.examType === selectedExamType);
      }
      
      setAllResults(filtered);
      
      // Calculate basic stats based on UNIQUE STUDENTS, not result records
      // Get unique students who appeared
      const uniqueStudentIds = new Set(filtered.map(r => r.userId || r.rollNumber));
      const totalAppeared = uniqueStudentIds.size;
      
      // Get unique students who passed (have at least one result >= 40%)
      const studentResults: { [key: string]: any[] } = {};
      filtered.forEach(r => {
        const key = r.userId || r.rollNumber;
        if (!studentResults[key]) studentResults[key] = [];
        studentResults[key].push(r);
      });
      
      // Count students who passed (all their results >= 40% OR average >= 40%)
      let totalPassed = 0;
      let totalFailed = 0;
      const passedStudents: any[] = [];
      const failedStudents: any[] = [];
      
      Object.entries(studentResults).forEach(([studentId, results]) => {
        // Calculate average percentage for this student
        const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
        const studentInfo = {
          userId: studentId,
          rollNumber: results[0]?.rollNumber || studentId,
          userName: results[0]?.userName || 'Unknown',
          department: results[0]?.department || 'Unknown',
          year: results[0]?.year || 'Unknown',
          sem: results[0]?.sem || 'Unknown',
          div: results[0]?.div || 'Unknown',
          averagePercentage: Math.round(avgPercentage * 10) / 10,
          totalResults: results.length,
          passedResults: results.filter(r => (r.percentage || 0) >= 40).length,
          failedResults: results.filter(r => (r.percentage || 0) < 40).length
        };
        
        if (avgPercentage >= 40) {
          totalPassed++;
          passedStudents.push(studentInfo);
        } else {
          totalFailed++;
          failedStudents.push(studentInfo);
        }
      });
      
      const passPercentage = totalAppeared > 0 ? (totalPassed / totalAppeared) * 100 : 0;
      
      setBasicStats({
        totalAppeared,
        totalPassed,
        totalFailed,
        passPercentage: Math.round(passPercentage * 10) / 10
      });
      
      // Store student lists for stat boxes
      const allAppearedStudents = [...passedStudents, ...failedStudents].sort((a, b) => {
        if (a.rollNumber && b.rollNumber) {
          return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
        }
        return a.userName.localeCompare(b.userName);
      });
      
      setAllAppearedStudentsList(allAppearedStudents);
      setPassedStudentsList(passedStudents);
      setFailedStudentsList(failedStudents);
      
      // Calculate branch-wise analysis
      const branchMap: { [key: string]: any[] } = {};
      filtered.forEach(r => {
        const branch = r.department || 'Unknown';
        if (!branchMap[branch]) branchMap[branch] = [];
        branchMap[branch].push(r);
      });
      
      const branchAnalysisData: BranchAnalysis[] = Object.entries(branchMap).map(([branch, results]) => {
        const appeared = results.length;
        const passed = results.filter(r => (r.percentage || 0) >= 40).length;
        const failed = appeared - passed;
        const passPercentage = appeared > 0 ? (passed / appeared) * 100 : 0;
        return { branch, appeared, passed, failed, passPercentage: Math.round(passPercentage * 10) / 10 };
      });
      setBranchAnalysis(branchAnalysisData);
      
      // Calculate semester-wise analysis based on STUDENTS, not result records
      const semStudentMap: { [sem: string]: { [studentId: string]: any[] } } = {};
      Object.entries(studentResults).forEach(([studentId, results]) => {
        const sem = results[0]?.sem || 'Unknown';
        if (!semStudentMap[sem]) semStudentMap[sem] = {};
        semStudentMap[sem][studentId] = results;
      });
      
      const semesterAnalysisData: SemesterAnalysis[] = Object.entries(semStudentMap).map(([semester, students]) => {
        let appeared = 0;
        let passed = 0;
        let failed = 0;
        let totalMarks = 0;
        let totalResults = 0;
        
        Object.values(students).forEach(results => {
          appeared++;
          const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
          totalMarks += results.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
          totalResults += results.length;
          if (avgPercentage >= 40) {
            passed++;
          } else {
            failed++;
          }
        });
        
        const passPercentage = appeared > 0 ? (passed / appeared) * 100 : 0;
        const averageMarks = totalResults > 0 ? totalMarks / totalResults : 0;
        return { 
          semester, 
          appeared, 
          passed, 
          failed, 
          passPercentage: Math.round(passPercentage * 10) / 10,
          averageMarks: Math.round(averageMarks * 10) / 10
        };
      }).sort((a, b) => parseInt(a.semester) - parseInt(b.semester));
      setSemesterAnalysis(semesterAnalysisData);
      
      // Calculate subject-wise analysis based on STUDENTS, not result records
      const subjectStudentMap: { [subject: string]: { [studentId: string]: any[] } } = {};
      Object.entries(studentResults).forEach(([studentId, results]) => {
        results.forEach(r => {
          const subject = r.subject || 'Unknown';
          if (!subjectStudentMap[subject]) subjectStudentMap[subject] = {};
          if (!subjectStudentMap[subject][studentId]) subjectStudentMap[subject][studentId] = [];
          subjectStudentMap[subject][studentId].push(r);
        });
      });
      
      const subjectAnalysisData: SubjectAnalysis[] = Object.entries(subjectStudentMap).map(([subject, students]) => {
        let appeared = 0;
        let passed = 0;
        let failed = 0;
        let totalMarks = 0;
        let totalResults = 0;
        
        Object.values(students).forEach(results => {
          appeared++;
          const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
          totalMarks += results.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
          totalResults += results.length;
          if (avgPercentage >= 40) {
            passed++;
          } else {
            failed++;
          }
        });
        
        const failPercentage = appeared > 0 ? (failed / appeared) * 100 : 0;
        const averageMarks = totalResults > 0 ? totalMarks / totalResults : 0;
        return { 
          subject, 
          appeared, 
          passed, 
          failed, 
          failPercentage: Math.round(failPercentage * 10) / 10,
          averageMarks: Math.round(averageMarks * 10) / 10
        };
      }).sort((a, b) => b.failPercentage - a.failPercentage); // Sort by failure rate
      setSubjectAnalysis(subjectAnalysisData);
      
      // Calculate grade distribution based on STUDENTS, not result records
      // Use the studentResults we already calculated
      const distinctionList: any[] = [];
      const firstClassList: any[] = [];
      const secondClassList: any[] = [];
      const passClassList: any[] = [];
      const failList: any[] = [];
      
      Object.entries(studentResults).forEach(([studentId, results]) => {
        const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
        const studentInfo = {
          userId: studentId,
          rollNumber: results[0]?.rollNumber || studentId,
          userName: results[0]?.userName || 'Unknown',
          department: results[0]?.department || 'Unknown',
          year: results[0]?.year || 'Unknown',
          sem: results[0]?.sem || 'Unknown',
          div: results[0]?.div || 'Unknown',
          averagePercentage: Math.round(avgPercentage * 10) / 10,
          totalResults: results.length,
          passedResults: results.filter(r => (r.percentage || 0) >= 40).length,
          failedResults: results.filter(r => (r.percentage || 0) < 40).length
        };
        
        if (avgPercentage >= 75) {
          distinctionList.push(studentInfo);
        } else if (avgPercentage >= 60) {
          firstClassList.push(studentInfo);
        } else if (avgPercentage >= 50) {
          secondClassList.push(studentInfo);
        } else if (avgPercentage >= 40) {
          passClassList.push(studentInfo);
        } else {
          failList.push(studentInfo);
        }
      });
      
      setGradeDistribution({ 
        distinction: distinctionList.length, 
        firstClass: firstClassList.length, 
        secondClass: secondClassList.length, 
        passClass: passClassList.length, 
        fail: failList.length 
      });
      
      // Store student lists for grade cards
      setDistinctionStudents(distinctionList.sort((a, b) => {
        if (a.rollNumber && b.rollNumber) {
          return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
        }
        return a.userName.localeCompare(b.userName);
      }));
      setFirstClassStudents(firstClassList.sort((a, b) => {
        if (a.rollNumber && b.rollNumber) {
          return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
        }
        return a.userName.localeCompare(b.userName);
      }));
      setSecondClassStudents(secondClassList.sort((a, b) => {
        if (a.rollNumber && b.rollNumber) {
          return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
        }
        return a.userName.localeCompare(b.userName);
      }));
      setPassClassStudents(passClassList.sort((a, b) => {
        if (a.rollNumber && b.rollNumber) {
          return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
        }
        return a.userName.localeCompare(b.userName);
      }));
      setFailStudents(failList.sort((a, b) => {
        if (a.rollNumber && b.rollNumber) {
          return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
        }
        return a.userName.localeCompare(b.userName);
      }));
      
      // Calculate ATKT analysis
      // ATKT = students who failed in any subject
      const studentFailures: { [studentId: string]: { subjects: string[], branch: string } } = {};
      filtered.forEach(r => {
        if ((r.percentage || 0) < 40) {
          if (!studentFailures[r.userId]) {
            studentFailures[r.userId] = { subjects: [], branch: r.department || 'Unknown' };
          }
          if (!studentFailures[r.userId].subjects.includes(r.subject)) {
            studentFailures[r.userId].subjects.push(r.subject);
          }
        }
      });
      
      const totalATKT = Object.keys(studentFailures).length;
      const subjectWiseATKT: { [subject: string]: number } = {};
      const branchWiseATKT: { [branch: string]: number } = {};
      
      Object.values(studentFailures).forEach(failure => {
        failure.subjects.forEach(subject => {
          subjectWiseATKT[subject] = (subjectWiseATKT[subject] || 0) + 1;
        });
        branchWiseATKT[failure.branch] = (branchWiseATKT[failure.branch] || 0) + 1;
      });
      
      setAtktAnalysis({ totalATKT, subjectWiseATKT, branchWiseATKT });
      
      // Calculate Student-wise Analysis
      const studentMap: { [key: string]: { 
        studentId: string; 
        userName: string; 
        rollNumber: string; 
        department: string; 
        year: string; 
        sem: string; 
        div: string;
        results: any[];
        totalSubjects: number;
        passedSubjects: number;
        failedSubjects: number;
        averagePercentage: number;
        atktCount: number;
      } } = {};
      
      filtered.forEach((r: any) => {
        const key = r.userId || r.rollNumber;
        if (!studentMap[key]) {
          studentMap[key] = {
            studentId: r.userId,
            userName: r.userName || 'Unknown',
            rollNumber: r.rollNumber || 'Unknown',
            department: r.department || 'Unknown',
            year: r.year || 'Unknown',
            sem: r.sem || 'Unknown',
            div: r.div || 'Unknown',
            results: [],
            totalSubjects: 0,
            passedSubjects: 0,
            failedSubjects: 0,
            averagePercentage: 0,
            atktCount: 0
          };
        }
        studentMap[key].results.push(r);
      });
      
      // Calculate statistics for each student
      const studentAnalysisData = Object.values(studentMap).map(student => {
        // Group by subject to count unique subjects
        const subjectMap: { [subject: string]: any[] } = {};
        student.results.forEach(r => {
          if (!subjectMap[r.subject]) subjectMap[r.subject] = [];
          subjectMap[r.subject].push(r);
        });
        
        const uniqueSubjects = Object.keys(subjectMap);
        let passedSubjects = 0;
        let failedSubjects = 0;
        let totalPercentage = 0;
        let resultCount = 0;
        
        uniqueSubjects.forEach(subject => {
          const subjectResults = subjectMap[subject];
          // Get the best result for this subject (or average)
          const avgPercentage = subjectResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / subjectResults.length;
          totalPercentage += avgPercentage;
          resultCount++;
          
          if (avgPercentage >= 40) {
            passedSubjects++;
          } else {
            failedSubjects++;
          }
        });
        
        const averagePercentage = resultCount > 0 ? totalPercentage / resultCount : 0;
        
        return {
          ...student,
          totalSubjects: uniqueSubjects.length,
          passedSubjects,
          failedSubjects,
          averagePercentage: Math.round(averagePercentage * 10) / 10,
          atktCount: failedSubjects
        };
      }).sort((a, b) => {
        // Sort by roll number if available, otherwise by name
        if (a.rollNumber && b.rollNumber) {
          return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
        }
        return a.userName.localeCompare(b.userName);
      });
      
      setStudentAnalysis(studentAnalysisData);
      
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSem, selectedDiv, selectedDepartment, selectedExamType]);
  
  useEffect(() => {
    loadResults();
  }, [loadResults]);
  
  const handleDownloadClick = () => {
    // Initialize export filters with current filters
    setExportAnalysisView(analysisView);
    setExportYear(selectedYear);
    setExportSem(selectedSem);
    setExportDiv(selectedDiv);
    setExportDepartment(selectedDepartment);
    setExportExamType(selectedExamType);
    setShowDownloadModal(true);
  };

  const exportAnalysis = () => {
    try {
      // Build filter summary for filename and header using export filters
      const filterParts: string[] = [];
      if (exportYear !== 'all') filterParts.push(`Year-${exportYear}`);
      if (exportSem !== 'all') filterParts.push(`Sem-${exportSem}`);
      if (exportDiv !== 'all') filterParts.push(`Div-${exportDiv}`);
      if (exportDepartment !== 'all') {
        const deptCode = exportDepartment;
        filterParts.push(`Dept-${deptCode}`);
      }
      if (exportExamType !== 'all') filterParts.push(`Exam-${exportExamType}`);
      
      const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : '';
      
      // Apply export filters to results
      let filteredResults = [...dummyResults];
      
      if (exportYear !== 'all') {
        filteredResults = filteredResults.filter(r => r.year === exportYear);
      }
      if (exportSem !== 'all') {
        filteredResults = filteredResults.filter(r => r.sem === exportSem);
      }
      if (exportDiv !== 'all') {
        filteredResults = filteredResults.filter(r => r.div === exportDiv);
      }
      if (exportDepartment !== 'all') {
        const deptName = getDepartmentName(exportDepartment);
        filteredResults = filteredResults.filter(r => r.department === deptName || r.department === exportDepartment);
      }
      if (exportExamType !== 'all') {
        filteredResults = filteredResults.filter(r => r.examType === exportExamType);
      }
      
      // Calculate stats based on export filters
      const uniqueStudentIds = new Set(filteredResults.map(r => r.userId || r.rollNumber));
      const studentResults: { [key: string]: any[] } = {};
      filteredResults.forEach(r => {
        const key = r.userId || r.rollNumber;
        if (!studentResults[key]) studentResults[key] = [];
        studentResults[key].push(r);
      });
      
      // Create filter info row for the export
      const filterInfo: any = {
        'Filter Information': 'Applied Filters',
        'Year': exportYear === 'all' ? 'All Years' : exportYear,
        'Semester': exportSem === 'all' ? 'All Semesters' : exportSem,
        'Division': exportDiv === 'all' ? 'All Divisions' : exportDiv,
        'Department': exportDepartment === 'all' ? 'All Departments' : getDepartmentName(exportDepartment) || exportDepartment,
        'Exam Type': exportExamType === 'all' ? 'All Exam Types' : exportExamType,
        'Analysis View': exportAnalysisView.charAt(0).toUpperCase() + exportAnalysisView.slice(1).replace('-', ' '),
        'Total Records': filteredResults.length,
        'Total Students': uniqueStudentIds.size,
        'Generated On': new Date().toLocaleString()
      };
      
      let exportData: any[] = [];
      
      // Add filter info as first row
      exportData.push(filterInfo);
      exportData.push({}); // Empty row for spacing
      
      // Calculate data based on export filters and view
      switch (exportAnalysisView) {
        case 'basic': {
          const totalAppeared = uniqueStudentIds.size;
          let totalPassed = 0;
          let totalFailed = 0;
          Object.values(studentResults).forEach(results => {
            const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
            if (avgPercentage >= 40) totalPassed++;
            else totalFailed++;
          });
          const passPercentage = totalAppeared > 0 ? (totalPassed / totalAppeared) * 100 : 0;
          exportData.push({
            'Total Appeared': totalAppeared,
            'Total Passed': totalPassed,
            'Total Failed': totalFailed,
            'Pass Percentage': `${Math.round(passPercentage * 10) / 10}%`
          });
          break;
        }
        case 'branch': {
          const branchStudentMap: { [branch: string]: { [studentId: string]: any[] } } = {};
          Object.entries(studentResults).forEach(([studentId, results]) => {
            const branch = results[0]?.department || 'Unknown';
            if (!branchStudentMap[branch]) branchStudentMap[branch] = {};
            branchStudentMap[branch][studentId] = results;
          });
          exportData.push({
            'Branch': 'Branch',
            'Appeared': 'Appeared',
            'Passed': 'Passed',
            'Failed': 'Failed',
            'Pass %': 'Pass %'
          });
          Object.entries(branchStudentMap).forEach(([branch, students]) => {
            let appeared = 0;
            let passed = 0;
            let failed = 0;
            Object.values(students).forEach(results => {
              appeared++;
              const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
              if (avgPercentage >= 40) passed++;
              else failed++;
            });
            const passPercentage = appeared > 0 ? (passed / appeared) * 100 : 0;
            exportData.push({
              'Branch': branch,
              'Appeared': appeared,
              'Passed': passed,
              'Failed': failed,
              'Pass %': `${Math.round(passPercentage * 10) / 10}%`
            });
          });
          break;
        }
        case 'semester': {
          const semStudentMap: { [sem: string]: { [studentId: string]: any[] } } = {};
          Object.entries(studentResults).forEach(([studentId, results]) => {
            const sem = results[0]?.sem || 'Unknown';
            if (!semStudentMap[sem]) semStudentMap[sem] = {};
            semStudentMap[sem][studentId] = results;
          });
          exportData.push({
            'Semester': 'Semester',
            'Appeared': 'Appeared',
            'Passed': 'Passed',
            'Failed': 'Failed',
            'Pass %': 'Pass %',
            'Average Marks': 'Average Marks'
          });
          Object.entries(semStudentMap).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([semester, students]) => {
            let appeared = 0;
            let passed = 0;
            let failed = 0;
            let totalMarks = 0;
            let totalResults = 0;
            Object.values(students).forEach(results => {
              appeared++;
              const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
              totalMarks += results.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
              totalResults += results.length;
              if (avgPercentage >= 40) passed++;
              else failed++;
            });
            const passPercentage = appeared > 0 ? (passed / appeared) * 100 : 0;
            const averageMarks = totalResults > 0 ? totalMarks / totalResults : 0;
            exportData.push({
              'Semester': semester,
              'Appeared': appeared,
              'Passed': passed,
              'Failed': failed,
              'Pass %': `${Math.round(passPercentage * 10) / 10}%`,
              'Average Marks': Math.round(averageMarks * 10) / 10
            });
          });
          break;
        }
        case 'subject': {
          const subjectStudentMap: { [subject: string]: { [studentId: string]: any[] } } = {};
          Object.entries(studentResults).forEach(([studentId, results]) => {
            results.forEach(r => {
              const subject = r.subject || 'Unknown';
              if (!subjectStudentMap[subject]) subjectStudentMap[subject] = {};
              if (!subjectStudentMap[subject][studentId]) subjectStudentMap[subject][studentId] = [];
              subjectStudentMap[subject][studentId].push(r);
            });
          });
          exportData.push({
            'Subject': 'Subject',
            'Appeared': 'Appeared',
            'Passed': 'Passed',
            'Failed': 'Failed',
            'Fail %': 'Fail %',
            'Average Marks': 'Average Marks'
          });
          Object.entries(subjectStudentMap).forEach(([subject, students]) => {
            let appeared = 0;
            let passed = 0;
            let failed = 0;
            let totalMarks = 0;
            let totalResults = 0;
            Object.values(students).forEach(results => {
              appeared++;
              const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
              totalMarks += results.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
              totalResults += results.length;
              if (avgPercentage >= 40) passed++;
              else failed++;
            });
            const failPercentage = appeared > 0 ? (failed / appeared) * 100 : 0;
            const averageMarks = totalResults > 0 ? totalMarks / totalResults : 0;
            exportData.push({
              'Subject': subject,
              'Appeared': appeared,
              'Passed': passed,
              'Failed': failed,
              'Fail %': `${Math.round(failPercentage * 10) / 10}%`,
              'Average Marks': Math.round(averageMarks * 10) / 10
            });
          });
          break;
        }
        case 'grade': {
          const distinctionList: any[] = [];
          const firstClassList: any[] = [];
          const secondClassList: any[] = [];
          const passClassList: any[] = [];
          const failList: any[] = [];
          Object.entries(studentResults).forEach(([studentId, results]) => {
            const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
            if (avgPercentage >= 75) distinctionList.push(studentId);
            else if (avgPercentage >= 60) firstClassList.push(studentId);
            else if (avgPercentage >= 50) secondClassList.push(studentId);
            else if (avgPercentage >= 40) passClassList.push(studentId);
            else failList.push(studentId);
          });
          exportData.push({
            'Distinction (≥75%)': distinctionList.length,
            'First Class (60-74%)': firstClassList.length,
            'Second Class (50-59%)': secondClassList.length,
            'Pass Class (40-49%)': passClassList.length,
            'Fail (<40%)': failList.length
          });
          break;
        }
        case 'atkt': {
          const studentFailures: { [studentId: string]: { subjects: string[], branch: string } } = {};
          filteredResults.forEach(r => {
            if ((r.percentage || 0) < 40) {
              if (!studentFailures[r.userId]) {
                studentFailures[r.userId] = { subjects: [], branch: r.department || 'Unknown' };
              }
              if (!studentFailures[r.userId].subjects.includes(r.subject)) {
                studentFailures[r.userId].subjects.push(r.subject);
              }
            }
          });
          const totalATKT = Object.keys(studentFailures).length;
          const subjectWiseATKT: { [subject: string]: number } = {};
          const branchWiseATKT: { [branch: string]: number } = {};
          Object.values(studentFailures).forEach(failure => {
            failure.subjects.forEach(subject => {
              subjectWiseATKT[subject] = (subjectWiseATKT[subject] || 0) + 1;
            });
            branchWiseATKT[failure.branch] = (branchWiseATKT[failure.branch] || 0) + 1;
          });
          exportData.push({
            'Metric': 'Total ATKT Students',
            'Count': totalATKT
          });
          if (Object.keys(subjectWiseATKT).length > 0) {
            exportData.push({});
            exportData.push({ 'Metric': 'Subject-wise ATKT', 'Count': '' });
            exportData.push(...Object.entries(subjectWiseATKT).map(([subject, count]) => ({
              'Metric': subject,
              'Count': count
            })));
          }
          if (Object.keys(branchWiseATKT).length > 0) {
            exportData.push({});
            exportData.push({ 'Metric': 'Branch-wise ATKT', 'Count': '' });
            exportData.push(...Object.entries(branchWiseATKT).map(([branch, count]) => ({
              'Metric': branch,
              'Count': count
            })));
          }
          break;
        }
        case 'student': {
          const studentAnalysisData = Object.entries(studentResults).map(([studentId, results]) => {
            const subjectMap: { [subject: string]: any[] } = {};
            results.forEach(r => {
              if (!subjectMap[r.subject]) subjectMap[r.subject] = [];
              subjectMap[r.subject].push(r);
            });
            const uniqueSubjects = Object.keys(subjectMap);
            let passedSubjects = 0;
            let failedSubjects = 0;
            let totalPercentage = 0;
            let resultCount = 0;
            uniqueSubjects.forEach(subject => {
              const subjectResults = subjectMap[subject];
              const avgPercentage = subjectResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / subjectResults.length;
              totalPercentage += avgPercentage;
              resultCount++;
              if (avgPercentage >= 40) passedSubjects++;
              else failedSubjects++;
            });
            const averagePercentage = resultCount > 0 ? totalPercentage / resultCount : 0;
            return {
              rollNumber: results[0]?.rollNumber || studentId,
              userName: results[0]?.userName || 'Unknown',
              department: results[0]?.department || 'Unknown',
              year: results[0]?.year || 'Unknown',
              sem: results[0]?.sem || 'Unknown',
              div: results[0]?.div || 'Unknown',
              totalSubjects: uniqueSubjects.length,
              passedSubjects,
              failedSubjects,
              averagePercentage: Math.round(averagePercentage * 10) / 10,
              atktCount: failedSubjects
            };
          }).sort((a, b) => {
            if (a.rollNumber && b.rollNumber) {
              return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
            }
            return a.userName.localeCompare(b.userName);
          });
          exportData.push({
            'Roll Number': 'Roll Number',
            'Student Name': 'Student Name',
            'Department': 'Department',
            'Year': 'Year',
            'Semester': 'Semester',
            'Division': 'Division',
            'Total Subjects': 'Total Subjects',
            'Passed Subjects': 'Passed Subjects',
            'Failed Subjects': 'Failed Subjects',
            'Average Percentage': 'Average Percentage',
            'ATKT Count': 'ATKT Count',
            'Status': 'Status'
          });
          exportData.push(...studentAnalysisData.map(s => ({
            'Roll Number': s.rollNumber,
            'Student Name': s.userName,
            'Department': s.department,
            'Year': s.year,
            'Semester': s.sem,
            'Division': s.div,
            'Total Subjects': s.totalSubjects,
            'Passed Subjects': s.passedSubjects,
            'Failed Subjects': s.failedSubjects,
            'Average Percentage': `${s.averagePercentage}%`,
            'ATKT Count': s.atktCount,
            'Status': s.failedSubjects === 0 ? 'Pass' : 'ATKT'
          })));
          break;
        }
        case 'trend': {
          exportData.push({
            'Year': 'Year',
            'Appeared': 'Appeared',
            'Passed': 'Passed',
            'Failed': 'Failed',
            'Pass %': 'Pass %'
          });
          YEARS.forEach(year => {
            const yearResults = filteredResults.filter(r => r.year === year);
            const yearStudentIds = new Set(yearResults.map(r => r.userId || r.rollNumber));
            const yearStudentResults: { [key: string]: any[] } = {};
            yearResults.forEach(r => {
              const key = r.userId || r.rollNumber;
              if (!yearStudentResults[key]) yearStudentResults[key] = [];
              yearStudentResults[key].push(r);
            });
            let yearAppeared = yearStudentIds.size;
            let yearPassed = 0;
            Object.values(yearStudentResults).forEach(results => {
              const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
              if (avgPercentage >= 40) yearPassed++;
            });
            const yearPassPercentage = yearAppeared > 0 ? (yearPassed / yearAppeared) * 100 : 0;
            exportData.push({
              'Year': year,
              'Appeared': yearAppeared,
              'Passed': yearPassed,
              'Failed': yearAppeared - yearPassed,
              'Pass %': `${Math.round(yearPassPercentage * 10) / 10}%`
            });
          });
          break;
        }
      }
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Analysis');
      
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const viewName = exportAnalysisView.replace('-', '_');
      const filename = `result_analysis_${viewName}${filterSuffix}_${timestamp}.xlsx`;
      XLSX.writeFile(workbook, filename);
      setShowDownloadModal(false);
      alert(`Exported ${exportAnalysisView} analysis with applied filters successfully!`);
    } catch (error) {
      console.error('Error exporting analysis:', error);
      alert('Failed to export analysis. Please try again.');
    }
  };
  
  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Result Analysis</h1>
          <p className="text-sm text-slate-500">Comprehensive result statistics and analysis</p>
        </div>
        <button
          onClick={handleDownloadClick}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Download Report</span>
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="all">All Years</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Semester</label>
            <select
              value={selectedSem}
              onChange={e => setSelectedSem(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              disabled={selectedYear === 'all'}
            >
              <option value="all">All Semesters</option>
              {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
            <select
              value={selectedDiv}
              onChange={e => setSelectedDiv(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="all">All Divisions</option>
              {DIVS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="all">All Departments</option>
              <option value="CSE">Computer Science</option>
              <option value="IT">Information Technology</option>
              <option value="ME">Mechanical</option>
              <option value="EEE">Electrical</option>
              <option value="ECE">Electronics</option>
              <option value="CE">Civil</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Exam Type</label>
            <select
              value={selectedExamType}
              onChange={e => setSelectedExamType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="all">All Exam Types</option>
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Analysis View</label>
            <select
              value={analysisView}
              onChange={e => setAnalysisView(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="basic">Basic Summary</option>
              <option value="branch">Branch-wise</option>
              <option value="semester">Semester-wise</option>
              <option value="subject">Subject-wise</option>
              <option value="grade">Grade Distribution</option>
              <option value="atkt">ATKT Analysis</option>
              <option value="trend">Year-wise Trend</option>
              <option value="student">Student Analysis</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Basic Stats Cards - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => {
            setSelectedStatBox(selectedStatBox === 'appeared' ? null : 'appeared');
            setStatBoxStudents(allAppearedStudentsList);
          }}
          className={`bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow cursor-pointer ${
            selectedStatBox === 'appeared' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Total Appeared</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{basicStats.totalAppeared}</p>
              <p className="text-xs text-slate-500 mt-1">Click to view list</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div 
          onClick={() => {
            setSelectedStatBox(selectedStatBox === 'passed' ? null : 'passed');
            setStatBoxStudents(passedStudentsList);
          }}
          className={`bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow cursor-pointer ${
            selectedStatBox === 'passed' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Total Passed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{basicStats.totalPassed}</p>
              <p className="text-xs text-slate-500 mt-1">Click to view list</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div 
          onClick={() => {
            setSelectedStatBox(selectedStatBox === 'failed' ? null : 'failed');
            setStatBoxStudents(failedStudentsList);
          }}
          className={`bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow cursor-pointer ${
            selectedStatBox === 'failed' ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Total Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{basicStats.totalFailed}</p>
              <p className="text-xs text-slate-500 mt-1">Click to view list</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Pass Percentage</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{basicStats.passPercentage}%</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Student List for Selected Stat Box (for basic stats cards only) */}
      {selectedStatBox && ['appeared', 'passed', 'failed'].includes(selectedStatBox) && statBoxStudents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {selectedStatBox === 'appeared' && 'All Students Appeared'}
              {selectedStatBox === 'passed' && 'Students Passed'}
              {selectedStatBox === 'failed' && 'Students Failed'}
              <span className="ml-2 text-sm font-normal text-slate-500">({statBoxStudents.length} students)</span>
            </h3>
            <button
              onClick={() => {
                setSelectedStatBox(null);
                setStatBoxStudents([]);
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Roll No.</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Student Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Year/Sem/Div</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Avg %</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Results</th>
                </tr>
              </thead>
              <tbody>
                {statBoxStudents.map((student, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-800 font-medium">{student.rollNumber}</td>
                    <td className="px-4 py-3 text-slate-800">{student.userName}</td>
                    <td className="px-4 py-3 text-slate-600">{student.department}</td>
                    <td className="px-4 py-3 text-slate-600">{student.year} / Sem {student.sem} / Div {student.div}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        student.averagePercentage >= 75 ? 'bg-purple-100 text-purple-800' :
                        student.averagePercentage >= 60 ? 'bg-blue-100 text-blue-800' :
                        student.averagePercentage >= 50 ? 'bg-green-100 text-green-800' :
                        student.averagePercentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.averagePercentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="text-xs">
                        {student.passedResults}/{student.totalResults} passed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Analysis Views */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Branch-wise Analysis */}
          {analysisView === 'branch' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Branch-wise Result Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Branch</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Appeared</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Passed</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Failed</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Pass %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchAnalysis.map((b, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-slate-800 font-medium">{b.branch}</td>
                        <td className="px-4 py-3 text-slate-600">{b.appeared}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{b.passed}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{b.failed}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            b.passPercentage >= 80 ? 'bg-green-100 text-green-800' :
                            b.passPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {b.passPercentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Semester-wise Analysis */}
          {analysisView === 'semester' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Semester-wise Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Semester</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Appeared</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Passed</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Failed</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Pass %</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Avg Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesterAnalysis.map((s, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-slate-800 font-medium">Sem {s.semester}</td>
                        <td className="px-4 py-3 text-slate-600">{s.appeared}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{s.passed}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{s.failed}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            s.passPercentage >= 80 ? 'bg-green-100 text-green-800' :
                            s.passPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {s.passPercentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.averageMarks.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Subject-wise Analysis */}
          {analysisView === 'subject' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Subject-wise Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Subject</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Appeared</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Passed</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Failed</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Fail %</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Avg Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectAnalysis.map((s, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-slate-800 font-medium">{s.subject}</td>
                        <td className="px-4 py-3 text-slate-600">{s.appeared}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{s.passed}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{s.failed}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            s.failPercentage >= 30 ? 'bg-red-100 text-red-800' :
                            s.failPercentage >= 15 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {s.failPercentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.averageMarks.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Grade Distribution */}
          {analysisView === 'grade' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Grade / Percentage Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div 
                  onClick={() => {
                    setSelectedStatBox(selectedStatBox === 'distinction' ? null : 'distinction');
                    setStatBoxStudents(distinctionStudents);
                  }}
                  className={`bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedStatBox === 'distinction' ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    <span className="text-2xl font-bold text-purple-900">{gradeDistribution.distinction}</span>
                  </div>
                  <p className="text-xs font-medium text-purple-700">Distinction</p>
                  <p className="text-xs text-purple-600 mt-1">≥75%</p>
                  <p className="text-xs text-purple-500 mt-1">Click to view list</p>
                </div>
                <div 
                  onClick={() => {
                    setSelectedStatBox(selectedStatBox === 'firstClass' ? null : 'firstClass');
                    setStatBoxStudents(firstClassStudents);
                  }}
                  className={`bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedStatBox === 'firstClass' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-900">{gradeDistribution.firstClass}</span>
                  </div>
                  <p className="text-xs font-medium text-blue-700">First Class</p>
                  <p className="text-xs text-blue-600 mt-1">60-74%</p>
                  <p className="text-xs text-blue-500 mt-1">Click to view list</p>
                </div>
                <div 
                  onClick={() => {
                    setSelectedStatBox(selectedStatBox === 'secondClass' ? null : 'secondClass');
                    setStatBoxStudents(secondClassStudents);
                  }}
                  className={`bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedStatBox === 'secondClass' ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-900">{gradeDistribution.secondClass}</span>
                  </div>
                  <p className="text-xs font-medium text-green-700">Second Class</p>
                  <p className="text-xs text-green-600 mt-1">50-59%</p>
                  <p className="text-xs text-green-500 mt-1">Click to view list</p>
                </div>
                <div 
                  onClick={() => {
                    setSelectedStatBox(selectedStatBox === 'passClass' ? null : 'passClass');
                    setStatBoxStudents(passClassStudents);
                  }}
                  className={`bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedStatBox === 'passClass' ? 'ring-2 ring-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="w-5 h-5 text-yellow-600" />
                    <span className="text-2xl font-bold text-yellow-900">{gradeDistribution.passClass}</span>
                  </div>
                  <p className="text-xs font-medium text-yellow-700">Pass Class</p>
                  <p className="text-xs text-yellow-600 mt-1">40-49%</p>
                  <p className="text-xs text-yellow-500 mt-1">Click to view list</p>
                </div>
                <div 
                  onClick={() => {
                    setSelectedStatBox(selectedStatBox === 'fail' ? null : 'fail');
                    setStatBoxStudents(failStudents);
                  }}
                  className={`bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedStatBox === 'fail' ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-2xl font-bold text-red-900">{gradeDistribution.fail}</span>
                  </div>
                  <p className="text-xs font-medium text-red-700">Fail</p>
                  <p className="text-xs text-red-600 mt-1">&lt;40%</p>
                  <p className="text-xs text-red-500 mt-1">Click to view list</p>
                </div>
              </div>
              
              {/* Student List for Grade Cards - appears below grade cards */}
              {selectedStatBox && ['distinction', 'firstClass', 'secondClass', 'passClass', 'fail'].includes(selectedStatBox) && statBoxStudents.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {selectedStatBox === 'distinction' && 'Distinction Students (≥75%)'}
                      {selectedStatBox === 'firstClass' && 'First Class Students (60-74%)'}
                      {selectedStatBox === 'secondClass' && 'Second Class Students (50-59%)'}
                      {selectedStatBox === 'passClass' && 'Pass Class Students (40-49%)'}
                      {selectedStatBox === 'fail' && 'Failed Students (<40%)'}
                      <span className="ml-2 text-sm font-normal text-slate-500">({statBoxStudents.length} students)</span>
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedStatBox(null);
                        setStatBoxStudents([]);
                      }}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Roll No.</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Student Name</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Department</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Year/Sem/Div</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Avg %</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statBoxStudents.map((student, idx) => (
                          <tr key={idx} className="border-t border-slate-100">
                            <td className="px-4 py-3 text-slate-800 font-medium">{student.rollNumber}</td>
                            <td className="px-4 py-3 text-slate-800">{student.userName}</td>
                            <td className="px-4 py-3 text-slate-600">{student.department}</td>
                            <td className="px-4 py-3 text-slate-600">{student.year} / Sem {student.sem} / Div {student.div}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                student.averagePercentage >= 75 ? 'bg-purple-100 text-purple-800' :
                                student.averagePercentage >= 60 ? 'bg-blue-100 text-blue-800' :
                                student.averagePercentage >= 50 ? 'bg-green-100 text-green-800' :
                                student.averagePercentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {student.averagePercentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <span className="text-xs">
                                {student.passedResults}/{student.totalResults} passed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* ATKT Analysis */}
          {analysisView === 'atkt' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">ATKT / Backlog Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-orange-700">Total ATKT Students</p>
                        <p className="text-3xl font-bold text-orange-900 mt-1">{atktAnalysis.totalATKT}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Subject-wise ATKT Count</h4>
                  <div className="space-y-2">
                    {Object.entries(atktAnalysis.subjectWiseATKT)
                      .sort((a, b) => b[1] - a[1])
                      .map(([subject, count]) => (
                        <div key={subject} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-700">{subject}</span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Branch-wise ATKT</h4>
                  <div className="space-y-2">
                    {Object.entries(atktAnalysis.branchWiseATKT)
                      .sort((a, b) => b[1] - a[1])
                      .map(([branch, count]) => {
                        const branchResults = allResults.filter(r => r.department === branch);
                        const totalStudents = new Set(branchResults.map(r => r.userId)).size;
                        const atktPercentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
                        return (
                          <div key={branch} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-700">{branch}</span>
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">{count}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              ATKT %: {Math.round(atktPercentage * 10) / 10}%
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Year-wise Trend Analysis */}
          {analysisView === 'trend' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Year-wise Trend Analysis</h3>
              <div className="space-y-4">
                {YEARS.map(year => {
                  const yearResults = allResults.filter(r => r.year === year);
                  const yearAppeared = yearResults.length;
                  const yearPassed = yearResults.filter(r => (r.percentage || 0) >= 40).length;
                  const yearPassPercentage = yearAppeared > 0 ? (yearPassed / yearAppeared) * 100 : 0;
                  
                  return (
                    <div key={year} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-700">{year} Year</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          yearPassPercentage >= 80 ? 'bg-green-100 text-green-800' :
                          yearPassPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(yearPassPercentage * 10) / 10}% Pass
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-slate-500">Appeared</p>
                          <p className="text-lg font-bold text-slate-900">{yearAppeared}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Passed</p>
                          <p className="text-lg font-bold text-green-600">{yearPassed}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Failed</p>
                          <p className="text-lg font-bold text-red-600">{yearAppeared - yearPassed}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Download Report Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Download Report</h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Analysis View *</label>
                <select
                  value={exportAnalysisView}
                  onChange={e => setExportAnalysisView(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basic">Basic Summary</option>
                  <option value="branch">Branch-wise</option>
                  <option value="semester">Semester-wise</option>
                  <option value="subject">Subject-wise</option>
                  <option value="grade">Grade Distribution</option>
                  <option value="atkt">ATKT Analysis</option>
                  <option value="trend">Year-wise Trend</option>
                  <option value="student">Student Analysis</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                  <select
                    value={exportYear}
                    onChange={e => {
                      setExportYear(e.target.value);
                      if (e.target.value === 'all') setExportSem('all');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Years</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Semester</label>
                  <select
                    value={exportSem}
                    onChange={e => setExportSem(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={exportYear === 'all'}
                  >
                    <option value="all">All Semesters</option>
                    {exportAvailableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Division</label>
                  <select
                    value={exportDiv}
                    onChange={e => setExportDiv(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Divisions</option>
                    {DIVS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <select
                    value={exportDepartment}
                    onChange={e => setExportDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Departments</option>
                    <option value="CSE">Computer Science</option>
                    <option value="IT">Information Technology</option>
                    <option value="ME">Mechanical</option>
                    <option value="EEE">Electrical</option>
                    <option value="ECE">Electronics</option>
                    <option value="CE">Civil</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Exam Type</label>
                  <select
                    value={exportExamType}
                    onChange={e => setExportExamType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Exam Types</option>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={exportAnalysis}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultAnalysis;

