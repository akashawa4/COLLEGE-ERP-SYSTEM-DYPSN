import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Users, Calendar, BookOpen, Download, AlertCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { batchService, userService, getCurrentBatchYear } from '../../firebase/firestore';
import { getDepartmentCode } from '../../utils/departmentMapping';
import { getAvailableSemesters, isValidSemesterForYear, getDefaultSemesterForYear } from '../../utils/semesterMapping';
import * as XLSX from 'xlsx';
import { User } from '../../types';

interface BatchData {
  id?: string;
  batchName: string;
  fromRollNo: string;
  toRollNo: string;
  year: string;
  sem: string;
  div: string;
  department: string;
  createdAt?: any;
  updatedAt?: any;
}

const YEARS = ['1st', '2nd', '3rd', '4th'];
const DIVS = ['A', 'B', 'C', 'D'];

const BatchManagementPanel: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<BatchData[]>([]);

  // Filter states
  const [selectedYear, setSelectedYear] = useState('2nd');
  const [selectedSem, setSelectedSem] = useState('3');
  const [selectedDiv, setSelectedDiv] = useState('A');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [availableSemesters, setAvailableSemesters] = useState<string[]>(getAvailableSemesters('2'));

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<BatchData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newBatch, setNewBatch] = useState<BatchData>({
    batchName: '',
    fromRollNo: '',
    toRollNo: '',
    year: '2nd',
    sem: '3',
    div: 'A',
    department: 'CSE'
  });
  
  // Roll number dropdown states
  const [availableRollNumbers, setAvailableRollNumbers] = useState<number[]>([]);
  const [loadingRollNumbers, setLoadingRollNumbers] = useState(false);

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

  // Load batches based on filters
  useEffect(() => {
    loadBatches();
  }, [selectedYear, selectedSem, selectedDiv]);

  // Filter batches based on search
  useEffect(() => {
    filterBatches();
  }, [batches, selectedDepartment]);

  // Fetch available roll numbers when modal opens or filters change
  useEffect(() => {
    if (showAddModal || showEditModal) {
      fetchAvailableRollNumbers();
    }
  }, [showAddModal, showEditModal, selectedYear, selectedSem, selectedDiv]);

  const fetchAvailableRollNumbers = async () => {
    setLoadingRollNumbers(true);
    try {
      const batch = getCurrentBatchYear();
      // Use selected department if not 'all', otherwise use user's department, fallback to 'CSE'
      let department: string;
      if (selectedDepartment !== 'all') {
        // selectedDepartment is already a code (CSE, IT, etc.)
        department = selectedDepartment;
      } else {
        // Use user's department, convert to code if needed
        department = user?.department ? getDepartmentCode(user.department) : 'CSE';
      }
      
      const students = await userService.getStudentsByBatchDeptYearSemDiv(
        batch,
        department,
        selectedYear,
        selectedSem,
        selectedDiv
      );
      
      // Extract unique roll numbers, filter out invalid ones, and sort
      const rollNumbers = students
        .map(s => {
          const rollNo = s.rollNumber || (s as any).rollNumber;
          if (!rollNo) return null;
          const parsed = parseInt(String(rollNo));
          return isNaN(parsed) ? null : parsed;
        })
        .filter((roll): roll is number => roll !== null)
        .sort((a, b) => a - b);
      
      // Remove duplicates
      const uniqueRollNumbers = Array.from(new Set(rollNumbers));
      setAvailableRollNumbers(uniqueRollNumbers);
    } catch (error) {
      console.error('Error fetching roll numbers:', error);
      setAvailableRollNumbers([]);
    } finally {
      setLoadingRollNumbers(false);
    }
  };

  const loadBatches = async () => {
    setLoading(true);
    try {
      const batch = '2025'; // Default batch year
      const department = getDepartmentCode(user?.department || 'CSE');

      const fetchedBatches = await batchService.getBatchesByFilters(
        batch,
        department,
        selectedYear,
        selectedSem,
        selectedDiv
      );

      setBatches(fetchedBatches);
    } catch (error) {
      console.error('Error loading batches:', error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBatches = () => {
    const filtered = batches.filter(batch =>
      selectedDepartment === 'all' || batch.department === selectedDepartment
    );
    setFilteredBatches(filtered);
  };

  const generateBatchNames = (div: string): string[] => {
    const batchNames: string[] = [];
    for (let i = 1; i <= 8; i++) {
      batchNames.push(`${div}${i}`);
    }
    return batchNames;
  };

  const getAvailableBatchNames = (div: string): string[] => {
    const allBatchNames = generateBatchNames(div);
    const existingBatchNames = batches.map(b => b.batchName);
    return allBatchNames.filter(name => !existingBatchNames.includes(name));
  };

  const handleAddBatch = async () => {
    if (!newBatch.batchName || !newBatch.fromRollNo || !newBatch.toRollNo) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseInt(newBatch.fromRollNo) >= parseInt(newBatch.toRollNo)) {
      alert('From Roll No must be less than To Roll No');
      return;
    }

    try {
      setLoading(true);
      const batchData = {
        ...newBatch,
        year: selectedYear,
        sem: selectedSem,
        div: selectedDiv,
        department: getDepartmentCode(user?.department || 'CSE')
      };

      await batchService.createBatch(batchData);
      setShowAddModal(false);
      setNewBatch({
        batchName: '',
        fromRollNo: '',
        toRollNo: '',
        year: selectedYear,
        sem: selectedSem,
        div: selectedDiv,
        department: 'CSE'
      });
      loadBatches();
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Error creating batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBatch = async () => {
    if (!editingBatch || !editingBatch.batchName || !editingBatch.fromRollNo || !editingBatch.toRollNo) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseInt(editingBatch.fromRollNo) >= parseInt(editingBatch.toRollNo)) {
      alert('From Roll No must be less than To Roll No');
      return;
    }

    try {
      setLoading(true);
      await batchService.updateBatch(editingBatch.id!, editingBatch);
      setShowEditModal(false);
      setEditingBatch(null);
      loadBatches();
    } catch (error) {
      console.error('Error updating batch:', error);
      alert('Error updating batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = (batch: BatchData) => {
    setBatchToDelete(batch);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!batchToDelete || !batchToDelete.id) return;

    setIsDeleting(true);
    try {
      await batchService.deleteBatch(batchToDelete.id);
      loadBatches();
      setShowDeleteModal(false);
      setBatchToDelete(null);
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Error deleting batch. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (batch: BatchData) => {
    setEditingBatch({ ...batch });
    setShowEditModal(true);
  };

  const calculateRollNumbers = (fromRoll: string, toRoll: string): number[] => {
    const from = parseInt(fromRoll);
    const to = parseInt(toRoll);
    const rollNumbers: number[] = [];
    for (let i = from; i <= to; i++) {
      rollNumbers.push(i);
    }
    return rollNumbers;
  };

  const exportBatches = () => {
    try {
      if (filteredBatches.length === 0) {
        alert('No batches to export.');
        return;
      }

      // Prepare data for export
      const exportData = filteredBatches.map(batch => ({
        'Batch Name': batch.batchName || '',
        'From Roll Number': batch.fromRollNo || '',
        'To Roll Number': batch.toRollNo || '',
        'Year': batch.year || '',
        'Semester': batch.sem || '',
        'Division': batch.div || '',
        'Department': batch.department || '',
        'Total Students': batch.toRollNo && batch.fromRollNo ? 
          (parseInt(batch.toRollNo) - parseInt(batch.fromRollNo) + 1) : 0,
        'Created At': batch.createdAt ? new Date(batch.createdAt).toLocaleString() : '',
        'Updated At': batch.updatedAt ? new Date(batch.updatedAt).toLocaleString() : ''
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Batches');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `batches_export_${timestamp}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);
      alert(`Exported ${filteredBatches.length} batches successfully!`);
    } catch (error) {
      console.error('Error exporting batches:', error);
      alert('Failed to export batches. Please try again.');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Batch Management</h2>
          <p className="text-sm text-slate-500">Create and manage student batches for attendance tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportBatches}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Report</span>
          </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Batch
        </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="all">All Departments</option>
              <option value="CSE">Computer Science</option>
              <option value="IT">Information Technology</option>
              <option value="ECE">Electronics & Communication</option>
              <option value="EEE">Electrical & Electronics</option>
              <option value="ME">Mechanical</option>
              <option value="CE">Civil</option>
              <option value="AI&ML">AI & Machine Learning</option>
              <option value="Data Science">Data Science</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={e => handleYearChange(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-slate-400 text-sm"
            >
              {YEARS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
            <select
              value={selectedSem}
              onChange={e => setSelectedSem(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-slate-400 text-sm"
            >
              {availableSemesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Division</label>
            <select
              value={selectedDiv}
              onChange={e => setSelectedDiv(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-slate-400 text-sm"
            >
              {DIVS.map(div => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Batches List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading batches...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
          <p className="text-gray-600 mb-4">
            No batches have been created for {selectedYear} Year, Semester {selectedSem}, Division {selectedDiv}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map((batch) => {
            const rollNumbers = calculateRollNumbers(batch.fromRollNo, batch.toRollNo);
            return (
              <div key={batch.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{batch.batchName}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(batch)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit batch"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(batch)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{batch.year} Year, Sem {batch.sem}, Div {batch.div}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Roll Numbers: {batch.fromRollNo} - {batch.toRollNo}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>Total Students: {rollNumbers.length}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Roll Numbers: {rollNumbers.slice(0, 5).join(', ')}
                    {rollNumbers.length > 5 && ` ... and ${rollNumbers.length - 5} more`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Batch</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                <select
                  value={newBatch.batchName}
                  onChange={e => setNewBatch({ ...newBatch, batchName: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Batch</option>
                  {getAvailableBatchNames(selectedDiv).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Roll Number
                  {loadingRollNumbers && <span className="text-xs text-gray-500 ml-2">(Loading...)</span>}
                </label>
                <select
                  value={newBatch.fromRollNo}
                  onChange={e => {
                    const fromRoll = e.target.value;
                    setNewBatch({ ...newBatch, fromRollNo: fromRoll, toRollNo: '' });
                  }}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingRollNumbers || availableRollNumbers.length === 0}
                >
                  <option value="">Select From Roll Number</option>
                  {availableRollNumbers.map(roll => (
                    <option key={roll} value={roll.toString()}>{roll}</option>
                  ))}
                </select>
                {!loadingRollNumbers && availableRollNumbers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No students found for selected filters</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Roll Number</label>
                <select
                  value={newBatch.toRollNo}
                  onChange={e => setNewBatch({ ...newBatch, toRollNo: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingRollNumbers || !newBatch.fromRollNo || availableRollNumbers.length === 0}
                >
                  <option value="">Select To Roll Number</option>
                  {newBatch.fromRollNo && availableRollNumbers
                    .filter(roll => roll >= parseInt(newBatch.fromRollNo))
                    .map(roll => (
                      <option key={roll} value={roll.toString()}>{roll}</option>
                    ))}
                </select>
                {!newBatch.fromRollNo && (
                  <p className="text-xs text-gray-500 mt-1">Please select From Roll Number first</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBatch}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {showEditModal && editingBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Batch</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                <input
                  type="text"
                  value={editingBatch.batchName}
                  onChange={e => setEditingBatch({ ...editingBatch, batchName: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Batch name cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Roll Number
                  {loadingRollNumbers && <span className="text-xs text-gray-500 ml-2">(Loading...)</span>}
                </label>
                <select
                  value={editingBatch.fromRollNo}
                  onChange={e => {
                    const fromRoll = e.target.value;
                    setEditingBatch({ ...editingBatch, fromRollNo: fromRoll, toRollNo: '' });
                  }}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingRollNumbers || availableRollNumbers.length === 0}
                >
                  <option value="">Select From Roll Number</option>
                  {availableRollNumbers.map(roll => (
                    <option key={roll} value={roll.toString()}>{roll}</option>
                  ))}
                </select>
                {!loadingRollNumbers && availableRollNumbers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No students found for selected filters</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Roll Number</label>
                <select
                  value={editingBatch.toRollNo}
                  onChange={e => setEditingBatch({ ...editingBatch, toRollNo: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingRollNumbers || !editingBatch.fromRollNo || availableRollNumbers.length === 0}
                >
                  <option value="">Select To Roll Number</option>
                  {editingBatch.fromRollNo && availableRollNumbers
                    .filter(roll => roll >= parseInt(editingBatch.fromRollNo))
                    .map(roll => (
                      <option key={roll} value={roll.toString()}>{roll}</option>
                    ))}
                </select>
                {!editingBatch.fromRollNo && (
                  <p className="text-xs text-gray-500 mt-1">Please select From Roll Number first</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditBatch}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && batchToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Delete Batch</h2>
                </div>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isDeleting}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{batchToDelete.batchName}"</span>?
                </p>
                <p className="text-sm text-gray-500">
                  This action cannot be undone. The batch and all associated data will be permanently removed.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagementPanel;
