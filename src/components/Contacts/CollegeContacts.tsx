import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  User, 
  Search, 
  Filter, 
  GraduationCap, 
  Crown, 
  Shield, 
  Wrench, 
  Eye,
  MapPin,
  Calendar,
  Building,
  Users,
  AlertCircle,
  X,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle
} from 'lucide-react';
import { User as UserType, Department } from '../../types';
import { userService, departmentService } from '../../firebase/firestore';

const CollegeContacts: React.FC<{ user: any }> = ({ user }) => {
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    department: '',
    designation: '',
    workLocation: '',
    workStatus: 'active',
    workShift: 'day'
  });

  // Load users and departments from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load users and departments in parallel
        const [users, deptData] = await Promise.all([
          userService.getAllUsers(),
          departmentService.getAllDepartments()
        ]);
        
        // Filter out students
        const nonStudentUsers = users.filter(user => user.role !== 'student');
        setAllUsers(nonStudentUsers);
        setFilteredUsers(nonStudentUsers);
        setDepartments(deptData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load contacts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = allUsers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.designation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(user => user.department === departmentFilter);
    }

    setFilteredUsers(filtered);
  }, [allUsers, searchTerm, roleFilter, departmentFilter]);

  // Get unique roles and departments for filters
  const uniqueRoles = Array.from(new Set(allUsers.map(user => user.role).filter(Boolean)));
  const uniqueDepartments = Array.from(new Set(departments.map(dept => dept.name).filter(Boolean)));

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-5 h-5 text-red-600" />;
      case 'hod': return <Crown className="w-5 h-5 text-purple-600" />;
      case 'teacher': return <GraduationCap className="w-5 h-5 text-green-600" />;
      case 'non-teaching': return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'visitor': return <User className="w-5 h-5 text-gray-600" />;
      case 'driver': return <User className="w-5 h-5 text-yellow-600" />;
      default: return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'hod': return 'bg-purple-100 text-purple-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'non-teaching': return 'bg-blue-100 text-blue-800';
      case 'visitor': return 'bg-gray-100 text-gray-800';
      case 'driver': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubRoleDisplay = (user: UserType) => {
    if (user.subRole && user.role === 'non-teaching') {
      const subRoleMap: { [key: string]: string } = {
        'cleaner': 'Cleaner',
        'peon': 'Peon',
        'lab-assistant': 'Lab Assistant',
        'security': 'Security',
        'maintenance': 'Maintenance',
        'canteen-staff': 'Canteen Staff',
        'library-staff': 'Library Staff',
        'office-assistant': 'Office Assistant',
        'driver': 'Driver',
        'gardener': 'Gardener'
      };
      return subRoleMap[user.subRole] || user.subRole;
    }
    return user.designation || user.role;
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'Not provided';
    // Format phone number for display
    if (phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  // Check if user can perform CRUD operations
  const canManageContacts = user?.role === 'admin' || user?.role === 'hod';

  // Handle add user
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const userData = {
        ...newUser,
        id: '', // Will be generated by Firestore
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await userService.createUser(userData);
      
      // Reload users
      const users = await userService.getAllUsers();
      const nonStudentUsers = users.filter(user => user.role !== 'student');
      setAllUsers(nonStudentUsers);
      setFilteredUsers(nonStudentUsers);
      
      // Reset form and close modal
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: 'teacher',
        department: '',
        designation: '',
        workLocation: '',
        workStatus: 'active',
        workShift: 'day'
      });
      setShowAddModal(false);
      
      alert('Contact added successfully!');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!selectedUser || !selectedUser.id) return;

    try {
      setSaving(true);
      await userService.updateUser(selectedUser.id, selectedUser);
      
      // Reload users
      const users = await userService.getAllUsers();
      const nonStudentUsers = users.filter(user => user.role !== 'student');
      setAllUsers(nonStudentUsers);
      setFilteredUsers(nonStudentUsers);
      
      setShowEditModal(false);
      setSelectedUser(null);
      
      alert('Contact updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      setSaving(true);
      await userService.deleteUser(userId);
      
      // Reload users
      const users = await userService.getAllUsers();
      const nonStudentUsers = users.filter(user => user.role !== 'student');
      setAllUsers(nonStudentUsers);
      setFilteredUsers(nonStudentUsers);
      
      alert('Contact deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Open edit modal
  const openEditModal = (user: UserType) => {
    setSelectedUser({ ...user });
    setShowEditModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">College Contacts</h1>
          <p className="text-gray-600 mt-1">Find and contact college staff members</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {filteredUsers.length} contact{filteredUsers.length !== 1 ? 's' : ''}
          </span>
          {canManageContacts && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-800">Loading contacts...</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, phone, department, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setDepartmentFilter('all');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUsers.map((contact) => (
          <div
            key={contact.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow h-fit"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  {getRoleIcon(contact.role)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 break-words leading-tight">
                    {contact.name || 'Unknown'}
                  </h3>
                  <p className="text-xs text-gray-500 break-words leading-tight mt-1">
                    {getSubRoleDisplay(contact)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(contact.role)}`}>
                  {contact.role.replace('-', ' ')}
                </span>
                {canManageContacts && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(contact);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(contact.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              {/* Phone */}
              {contact.phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600 flex-1 min-w-0">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="break-words">{formatPhoneNumber(contact.phone)}</span>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors flex-shrink-0 ml-2"
                    title="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Email */}
              {contact.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-words">{contact.email}</span>
                </div>
              )}

              {/* Department */}
              {contact.department && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-words">{contact.department}</span>
                </div>
              )}

              {/* Work Location */}
              {contact.workLocation && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-words">{contact.workLocation}</span>
                </div>
              )}

              {/* Work Status */}
              {contact.workStatus && (
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-words capitalize">{contact.workStatus}</span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            {(contact.joiningDate || contact.workShift) && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {contact.joiningDate && (
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Since {new Date(contact.joiningDate).getFullYear()}</span>
                    </div>
                  )}
                  {contact.workShift && (
                    <span className="capitalize">{contact.workShift}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-600">
            {searchTerm || roleFilter !== 'all' || departmentFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No staff contacts available'
            }
          </p>
        </div>
      )}

      {/* Quick Stats */}
      {!loading && allUsers.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {uniqueRoles.map(role => {
              const count = allUsers.filter(user => user.role === role).length;
              return (
                <div key={role} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-600 capitalize">
                    {role.replace('-', ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Contact</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10-digit phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                    <option value="hod">HOD</option>
                    <option value="non-teaching">Non-Teaching Staff</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newUser.designation}
                    onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Job title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={newUser.workLocation}
                    onChange={(e) => setNewUser({ ...newUser, workLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Office location"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Adding...' : 'Add Contact'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Contact</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={selectedUser.name || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={selectedUser.email || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={selectedUser.phone || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10-digit phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={selectedUser.role || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                    <option value="hod">HOD</option>
                    <option value="non-teaching">Non-Teaching Staff</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={selectedUser.department || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={selectedUser.designation || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Job title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={selectedUser.workLocation || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, workLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Office location"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditUser}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeContacts;
