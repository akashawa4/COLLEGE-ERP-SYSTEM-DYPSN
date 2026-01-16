import React from 'react';
import { resultService, subjectService } from '../../firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { ResultRecord } from '../../types';
import { getDepartmentCode } from '../../utils/departmentMapping';
import { injectDummyData, getDummyDataForUser, USE_DUMMY_DATA } from '../../utils/dummyData';

const EXAM_TYPES = ['UT1', 'UT2', 'Practical', 'Viva', 'Midterm', 'Endsem'];

const MyResults: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = React.useState<ResultRecord[]>([]);
  const [filteredResults, setFilteredResults] = React.useState<ResultRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [availableSubjects, setAvailableSubjects] = React.useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = React.useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = React.useState<string>('All');
  const [selectedExamType, setSelectedExamType] = React.useState<string>('All');

  React.useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      let data: ResultRecord[] = [];
      if (USE_DUMMY_DATA) {
        data = getDummyDataForUser(user.id).results;
      } else {
        data = await resultService.getMyResults(user.id);
      }
      data = injectDummyData.results(data);
      setResults(data);
      setFilteredResults(data);
      setLoading(false);
    };
    run();
  }, [user?.id]);

  // Load available subjects based on user's department and year
  React.useEffect(() => {
    const loadSubjects = async () => {
      if (!user) return;
      try {
        setSubjectsLoading(true);
        const deptCode = getDepartmentCode(user.department);
        const subs = await subjectService.getSubjectsByDepartment(deptCode, user.year || '1st', user.sem || '1');
        const names = subs.map(s => s.subjectName).sort();
        setAvailableSubjects(names);
      } catch (error) {
        console.error('Error loading subjects:', error);
        setAvailableSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, [user?.department, user?.year, user?.sem]);

  // Filter results based on selected subject and exam type
  React.useEffect(() => {
    let filtered = results;
    
    // Filter by subject if selected and not "All"
    if (selectedSubject && selectedSubject !== 'All') {
      filtered = filtered.filter(r => r.subject === selectedSubject);
    }
    
    // Filter by exam type if selected and not "All"
    if (selectedExamType && selectedExamType !== 'All') {
      filtered = filtered.filter(r => r.examType === selectedExamType);
    }
    
    setFilteredResults(filtered);
  }, [results, selectedSubject, selectedExamType]);

  // Group filtered results by subject => examType
  const grouped = React.useMemo(() => {
    const map: { [subject: string]: { [examType: string]: ResultRecord[] } } = {};
    filteredResults.forEach(r => {
      map[r.subject] = map[r.subject] || {};
      map[r.subject][r.examType] = map[r.subject][r.examType] || [];
      map[r.subject][r.examType].push(r);
    });
    return map;
  }, [filteredResults]);

  const clearFilters = () => {
    setSelectedSubject('Advanced Database Systems');
    setSelectedExamType('UT1');
  };

  return (
    <div className="space-y-6 px-4 lg:px-0">
      {/* Header */}
      <div className="theme-page-header">
        <div>
          <h1 className="theme-page-title">My Results</h1>
          <p className="text-sm text-gray-600 mt-1">View your academic results by subject and exam type</p>
        </div>
      </div>

      {/* Filters */}
      <div className="theme-card">
        <div className="theme-card-header">
          <h2 className="theme-section-title">Filters</h2>
        </div>
        <div className="theme-card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="theme-label">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="theme-select"
                disabled={subjectsLoading}
              >
            <option value="All">All Subjects</option>
            {subjectsLoading ? (
              <option value="">Loading subjects...</option>
            ) : availableSubjects.length > 0 ? (
              availableSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))
            ) : (
              <option value="Advanced Database Systems">Advanced Database Systems</option>
            )}
          </select>
        </div>
            <div>
              <label className="theme-label">Exam Type</label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="theme-select"
              >
                <option value="All">All Exam Types</option>
                {EXAM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="theme-btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="theme-card p-8">
          <div className="flex items-center justify-center">
            <div className="theme-spinner"></div>
            <span className="ml-3 text-sm text-gray-600">Loading results...</span>
          </div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="theme-card p-8 text-center">
          {results.length === 0 ? (
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">No results found</p>
              <p className="text-sm text-gray-600">Your results will appear here once they are entered by your teachers.</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">No results found for {selectedSubject} - {selectedExamType}</p>
              <p className="text-sm text-gray-600">Try selecting a different subject or exam type.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(grouped).sort().map(subject => (
            <div key={subject} className="theme-card overflow-hidden">
              <div className="theme-card-header">
                <h3 className="theme-section-title">{subject}</h3>
              </div>
              <div className="theme-card-body space-y-4">
                {Object.keys(grouped[subject]).sort().map(examType => (
                  <div key={examType}>
                    <div className="text-sm font-semibold text-gray-700 mb-2">{examType}</div>
                    <div className="overflow-x-auto">
                      <table className="theme-table">
                        <thead>
                          <tr>
                            <th>Attempt</th>
                            <th>Marks</th>
                            <th>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grouped[subject][examType].map((r, idx) => (
                            <tr key={`${r.id}_${idx}`}>
                              <td>{idx + 1}</td>
                              <td>{r.marksObtained} / {r.maxMarks}</td>
                              <td>{typeof r.percentage === 'number' ? `${r.percentage.toFixed(1)}%` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyResults;


