import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  Crown, 
  Users, 
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { departmentService } from '../../firebase/firestore';
import { Department, User } from '../../types';
import { injectDummyData, USE_DUMMY_DATA, getDummyData } from '../../utils/dummyData';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    description: '',
    hodId: '',
    isActive: true
  });
  const [selectedDepartmentForHOD, setSelectedDepartmentForHOD] = useState('');
  const [editDepartmentFilter, setEditDepartmentFilter] = useState('');

  // Load data from Firestore
  useEffect(() => {
    loadData();
  }, []);

  // Load teachers when editing a department
  useEffect(() => {
    if (showEditModal && selectedDepartment) {
      loadTeachersByDepartment(selectedDepartment.name);
    }
  }, [showEditModal, selectedDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load departments and teachers in parallel
      let [departmentsData, teachersData] = await Promise.all([
        departmentService.getAllDepartments(),
        departmentService.getAvailableTeachersForHOD()
      ]);
      
      // Inject dummy data if enabled and real data is empty
      if (USE_DUMMY_DATA) {
        if (departmentsData.length === 0) {
          departmentsData = getDummyData().departments();
        } else {
          departmentsData = injectDummyData.departments(departmentsData);
        }
        if (teachersData.length === 0) {
          teachersData = getDummyData().teachers();
        } else {
          teachersData = injectDummyData.teachers(teachersData);
        }
      }
      
      setDepartments(departmentsData);
      setTeachers(teachersData);
      setFilteredTeachers(teachersData); // Initially show all teachers
      
      // Initialize default departments if none exist
      if (departmentsData.length === 0 && !USE_DUMMY_DATA) {
        await departmentService.initializeDefaultDepartments();
        const newDepartments = await departmentService.getAllDepartments();
        setDepartments(newDepartments);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Use dummy data on error
      if (USE_DUMMY_DATA) {
        setDepartments(getDummyData().departments());
        setTeachers(getDummyData().teachers());
        setFilteredTeachers(getDummyData().teachers());
      } else {
        alert('Error loading data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load teachers by department
  const loadTeachersByDepartment = async (departmentName: string) => {
    try {
      if (!departmentName) {
        setFilteredTeachers(teachers);
        return;
      }
      
      // Normalize the department name for filtering
      const normalizedDeptName = normalizeDepartmentName(departmentName);
      
      // Filter teachers by normalized department name
      const departmentTeachers = teachers.filter(teacher => 
        normalizeDepartmentName(teacher.department) === normalizedDeptName
      );
      
      setFilteredTeachers(departmentTeachers);
    } catch (error) {
      console.error('Error loading teachers by department:', error);
      setFilteredTeachers(teachers); // Fallback to all teachers
    }
  };

  // Get unique departments from teachers
  const getTeacherDepartments = () => {
    const teacherDepartments = teachers.map(teacher => teacher.department).filter(Boolean);
    return [...new Set(teacherDepartments)].sort();
  };

  // Normalize department names to standard format
  const normalizeDepartmentName = (departmentName: string): string => {
    if (!departmentName) return '';
    
    const normalized = departmentName.toLowerCase().trim();
    
    // Map variations to standard names
    const departmentMap: { [key: string]: string } = {
      'cse': 'Computer Science Engineering',
      'computer science': 'Computer Science Engineering',
      'computer science & engineering': 'Computer Science Engineering',
      'computer science and engineering': 'Computer Science Engineering',
      'computer science engineering': 'Computer Science Engineering',
      'cs': 'Computer Science Engineering',
      'it': 'Information Technology',
      'information technology': 'Information Technology',
      'ece': 'Electronics and Communication Engineering',
      'electronics and communication': 'Electronics and Communication Engineering',
      'electronics and communication engineering': 'Electronics and Communication Engineering',
      'ee': 'Electrical Engineering',
      'electrical engineering': 'Electrical Engineering',
      'electrical': 'Electrical Engineering',
      'me': 'Mechanical Engineering',
      'mechanical engineering': 'Mechanical Engineering',
      'mechanical': 'Mechanical Engineering',
      'ce': 'Civil Engineering',
      'civil engineering': 'Civil Engineering',
      'civil': 'Civil Engineering',
      'ai/ml': 'Artificial Intelligence & Machine Learning',
      'artificial intelligence & machine learning': 'Artificial Intelligence & Machine Learning',
      'artificial intelligence and machine learning': 'Artificial Intelligence & Machine Learning',
      'ai': 'Artificial Intelligence & Machine Learning',
      'machine learning': 'Artificial Intelligence & Machine Learning',
      'ds': 'Data Science',
      'data science': 'Data Science',
      'data science (cse)': 'Data Science'
    };
    
    return departmentMap[normalized] || departmentName;
  };

  // Get normalized unique departments from teachers
  const getNormalizedTeacherDepartments = () => {
    const teacherDepartments = teachers.map(teacher => normalizeDepartmentName(teacher.department)).filter(Boolean);
    return [...new Set(teacherDepartments)].sort();
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDepartment = async () => {
    if (!newDepartment.name || !newDepartment.code) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      // Check if department code already exists
      const existingDept = await departmentService.getDepartmentByCode(newDepartment.code);
      if (existingDept) {
        alert('Department code already exists. Please use a different code.');
        return;
      }

      // Create department data
      const departmentData = {
        name: newDepartment.name,
        code: newDepartment.code.toUpperCase(),
        description: newDepartment.description,
        isActive: newDepartment.isActive
      };

      // Create department
      const departmentId = await departmentService.createDepartment(departmentData);

      // Assign HOD if selected
      if (newDepartment.hodId) {
        await departmentService.assignHOD(departmentId, newDepartment.hodId);
      }

      // Reload data
      await loadData();
      
      // Reset form and close modal
      setNewDepartment({ name: '', code: '', description: '', hodId: '', isActive: true });
      setSelectedDepartmentForHOD('');
      setFilteredTeachers(teachers);
      setShowAddModal(false);
      
      alert('Department created successfully!');
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Error creating department. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setShowEditModal(true);
  };

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      setSaving(true);
      
      // Check if department code already exists (excluding current department)
      if (selectedDepartment.code) {
        const existingDept = await departmentService.getDepartmentByCode(selectedDepartment.code);
        if (existingDept && existingDept.id !== selectedDepartment.id) {
          alert('Department code already exists. Please use a different code.');
          return;
        }
      }

      // Update department
      await departmentService.updateDepartment(selectedDepartment.id, {
        name: selectedDepartment.name,
        code: selectedDepartment.code.toUpperCase(),
        description: selectedDepartment.description,
        isActive: selectedDepartment.isActive
      });

      // Handle HOD assignment/removal
      if (selectedDepartment.hodId) {
        await departmentService.assignHOD(selectedDepartment.id, selectedDepartment.hodId);
      } else if (selectedDepartment.hodId === '') {
        await departmentService.removeHOD(selectedDepartment.id);
      }

      // Reload data
      await loadData();
      
      setShowEditModal(false);
      setSelectedDepartment(null);
      alert('Department updated successfully!');
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Error updating department. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      await departmentService.deleteDepartment(id);
      await loadData();
      alert('Department deleted successfully!');
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Error deleting department. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const department = departments.find(dept => dept.id === id);
      if (!department) return;

      await departmentService.updateDepartment(id, {
        isActive: !department.isActive
      });
      
      await loadData();
      alert(`Department ${!department.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling department status:', error);
      alert('Error updating department status. Please try again.');
    }
  };

  const getTeachersForDepartment = (departmentCode: string) => {
    return teachers.filter(teacher => teacher.department === departmentCode);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600 mt-1">Create, edit, and manage departments and HODs</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-mobile bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-mobile bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Department</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading departments...</span>
        </div>
      ) : (
        <>
      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <div
            key={department.id}
            className={`p-6 rounded-xl shadow-sm border ${
              department.isActive ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                  <p className="text-sm text-gray-600">{department.code}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleEditDepartment(department)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                  title="Edit department"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(department.id)}
                  className={`p-1 ${department.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                  title={department.isActive ? 'Deactivate department' : 'Activate department'}
                >
                  {department.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDeleteDepartment(department.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                  title="Delete department"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{department.description}</p>

            {/* HOD Info */}
            {department.hodName ? (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">HOD</span>
                </div>
                <p className="text-sm text-purple-800 mt-1">{department.hodName}</p>
                <p className="text-xs text-purple-600">{department.hodEmail}</p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">No HOD Assigned</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">Assign a HOD to manage this department</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <GraduationCap className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">{department.totalTeachers}</span>
                </div>
                <p className="text-xs text-gray-600">Teachers</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{department.totalStudents}</span>
                </div>
                <p className="text-xs text-gray-600">Students</p>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                department.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {department.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Department</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Computer Science Engineering"
                    value={newDepartment.name}
                    onChange={(e) => {
                      const departmentName = e.target.value;
                      setNewDepartment({...newDepartment, name: departmentName});
                      // Load teachers for this department
                      loadTeachersByDepartment(departmentName);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Code</label>
                  <input
                    type="text"
                    placeholder="e.g., CSE"
                    value={newDepartment.code}
                    onChange={(e) => setNewDepartment({...newDepartment, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Brief description of the department..."
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter Teachers by Department (for HOD selection)</label>
                  <select
                    value={selectedDepartmentForHOD}
                    onChange={(e) => {
                      const departmentName = e.target.value;
                      setSelectedDepartmentForHOD(departmentName);
                      loadTeachersByDepartment(departmentName);
                      setNewDepartment({...newDepartment, hodId: ''}); // Reset HOD selection
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  >
                    <option value="">All Departments</option>
                    {getNormalizedTeacherDepartments().map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign HOD (Optional)</label>
                  <select
                    value={newDepartment.hodId}
                    onChange={(e) => setNewDepartment({...newDepartment, hodId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select HOD</option>
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                          {teacher.name} - {teacher.designation} ({normalizeDepartmentName(teacher.department)})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {selectedDepartmentForHOD ? `No teachers found in ${selectedDepartmentForHOD}` : 'Select a department to filter teachers'}
                      </option>
                    )}
                  </select>
                  {selectedDepartmentForHOD && filteredTeachers.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No teachers found in "{selectedDepartmentForHOD}" department. Teachers must be assigned to this department to be eligible for HOD role.
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newDepartment.isActive}
                      onChange={(e) => setNewDepartment({...newDepartment, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active Department</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewDepartment({ name: '', code: '', description: '', hodId: '', isActive: true });
                    setSelectedDepartmentForHOD('');
                    setFilteredTeachers(teachers);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDepartment}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Add Department'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Department</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
                  <input
                    type="text"
                    value={selectedDepartment.name}
                    onChange={(e) => {
                      const departmentName = e.target.value;
                      setSelectedDepartment({...selectedDepartment, name: departmentName});
                      // Load teachers for this department
                      loadTeachersByDepartment(departmentName);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Code</label>
                  <input
                    type="text"
                    value={selectedDepartment.code}
                    onChange={(e) => setSelectedDepartment({...selectedDepartment, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={selectedDepartment.description}
                    onChange={(e) => setSelectedDepartment({...selectedDepartment, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter Teachers by Department (for HOD selection)</label>
                  <select
                    value={editDepartmentFilter}
                    onChange={(e) => {
                      const departmentName = e.target.value;
                      setEditDepartmentFilter(departmentName);
                      loadTeachersByDepartment(departmentName);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  >
                    <option value="">All Departments</option>
                    {getNormalizedTeacherDepartments().map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign HOD</label>
                  <select
                    value={selectedDepartment.hodId || ''}
                    onChange={(e) => {
                      const hodId = e.target.value;
                      const hod = filteredTeachers.find(t => t.id === hodId);
                      setSelectedDepartment({
                        ...selectedDepartment,
                        hodId: hodId || undefined,
                        hodName: hod?.name,
                        hodEmail: hod?.email
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select HOD</option>
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                          {teacher.name} - {teacher.designation} ({normalizeDepartmentName(teacher.department)})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {editDepartmentFilter ? `No teachers found in ${editDepartmentFilter}` : 'Select a department to filter teachers'}
                      </option>
                    )}
                  </select>
                  {editDepartmentFilter && filteredTeachers.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No teachers found in "{editDepartmentFilter}" department. Teachers must be assigned to this department to be eligible for HOD role.
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedDepartment.isActive}
                      onChange={(e) => setSelectedDepartment({...selectedDepartment, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active Department</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditDepartmentFilter('');
                    setFilteredTeachers(teachers);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDepartment}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                  Save Changes
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

export default DepartmentManagement;
