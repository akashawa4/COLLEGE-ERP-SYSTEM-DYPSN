// UserManagement.responsive.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  Crown,
  Shield,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Save,
  X
} from "lucide-react";
import { userService } from "../../firebase/firestore";
import { User } from "../../types";
import { auth } from "../../firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { injectDummyData, USE_DUMMY_DATA, getDummyData } from "../../utils/dummyData";

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'admin',
    department: '',
    accessLevel: 'basic',
    isActive: true,
    phone: '',
    rollNumber: '',
    joiningDate: new Date().toISOString().split('T')[0],
    designation: '',
    subRole: undefined,
    workShift: undefined,
    workLocation: '',
    supervisor: '',
    contractType: undefined,
    workStatus: 'active'
  });

  // UI state for mobile
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [openActionFor, setOpenActionFor] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  // Load data from Firestore
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let usersData = await userService.getAllUsers();
      // Inject dummy data if enabled and real data is empty
      if (USE_DUMMY_DATA && usersData.length === 0) {
        usersData = [...getDummyData().teachers(), ...getDummyData().admins()];
      } else {
        usersData = injectDummyData.teachers(usersData.filter(u => u.role === 'teacher'));
        const admins = injectDummyData.admins(usersData.filter(u => u.role === 'admin'));
        usersData = [...usersData.filter(u => u.role !== 'teacher' && u.role !== 'admin'), ...usersData.filter(u => u.role === 'teacher'), ...admins];
      }
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      // Use dummy data on error
      if (USE_DUMMY_DATA) {
        const dummyData = [...getDummyData().teachers(), ...getDummyData().admins()];
        setUsers(dummyData);
        setFilteredUsers(dummyData);
      } else {
        alert('Error loading users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter users - exclude only students from admin user management
  useEffect(() => {
    let filtered = users.filter(user => user.role !== 'student');

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) =>
        statusFilter === "active" ? user.isActive : !user.isActive
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((user) => user.department === departmentFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter, departmentFilter]);

  // Close action menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target as Node)
      ) {
        setOpenActionFor(null);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-red-600" />;
      case "hod":
        return <Crown className="w-4 h-4 text-purple-600" />;
      case "teacher":
        return <GraduationCap className="w-4 h-4 text-green-600" />;
      case "student":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "non-teaching":
        return <Users className="w-4 h-4 text-orange-600" />;
      case "visitor":
        return <Users className="w-4 h-4 text-indigo-600" />;
      case "driver":
        return <Users className="w-4 h-4 text-cyan-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "hod":
        return "bg-purple-100 text-purple-800";
      case "teacher":
        return "bg-green-100 text-green-800";
      case "student":
        return "bg-blue-100 text-blue-800";
      case "non-teaching":
        return "bg-orange-100 text-orange-800";
      case "visitor":
        return "bg-indigo-100 text-indigo-800";
      case "driver":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return "Never";
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.department) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      // Check if user with email already exists
      const existingUsers = await userService.getAllUsers();
      const emailExists = existingUsers.some(user => user.email === newUser.email);
      if (emailExists) {
        alert('User with this email already exists');
        return;
      }

      // Generate unique ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create user data - filter out undefined values
      const userData: any = {
        id: userId,
        name: newUser.name!,
        email: newUser.email!,
        role: newUser.role!,
        department: newUser.department!,
        accessLevel: newUser.accessLevel!,
        isActive: newUser.isActive!,
        createdAt: new Date().toISOString()
      };

      // Only add optional fields if they have values
      if (newUser.phone) userData.phone = newUser.phone;
      if (newUser.rollNumber) userData.rollNumber = newUser.rollNumber;
      if (newUser.joiningDate) userData.joiningDate = newUser.joiningDate;
      if (newUser.designation) userData.designation = newUser.designation;
      if (newUser.subRole) userData.subRole = newUser.subRole;
      if (newUser.workShift) userData.workShift = newUser.workShift;
      if (newUser.workLocation) userData.workLocation = newUser.workLocation;
      if (newUser.supervisor) userData.supervisor = newUser.supervisor;
      if (newUser.contractType) userData.contractType = newUser.contractType;
      if (newUser.workStatus) userData.workStatus = newUser.workStatus;

      // Create Firebase Auth account first (if phone number is provided)
      if (newUser.phone) {
        try {
          await createUserWithEmailAndPassword(auth, newUser.email!, newUser.phone);
          console.log('Firebase Auth account created for:', newUser.email);
        } catch (error: any) {
          console.error('Error creating Firebase Auth account:', error);
          // Continue with Firestore creation even if Auth fails
        }
      }

      // Create user in Firestore
      await userService.createUser(userData);
      
      // Reload data
      await loadUsers();
      
      // Reset form and close modal
      setNewUser({
        name: '',
        email: '',
        role: 'admin',
        department: '',
        accessLevel: 'basic',
        isActive: true,
        phone: '',
        rollNumber: '',
        joiningDate: new Date().toISOString().split('T')[0],
        designation: '',
        subRole: undefined,
        workShift: undefined,
        workLocation: '',
        supervisor: '',
        contractType: undefined,
        workStatus: 'active'
      });
      setShowAddModal(false);
      
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      
      // Check if email is being changed and if it already exists
      if (selectedUser.email) {
        const existingUsers = await userService.getAllUsers();
        const emailExists = existingUsers.some(user => 
          user.email === selectedUser.email && user.id !== selectedUser.id
        );
        if (emailExists) {
          alert('User with this email already exists');
          return;
        }
      }

      // Update user - filter out undefined values
      const updateData: any = {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        department: selectedUser.department,
        accessLevel: selectedUser.accessLevel,
        isActive: selectedUser.isActive,
        updatedAt: new Date().toISOString()
      };

      // Only add optional fields if they have values
      if (selectedUser.phone) updateData.phone = selectedUser.phone;
      if (selectedUser.rollNumber) updateData.rollNumber = selectedUser.rollNumber;
      if (selectedUser.joiningDate) updateData.joiningDate = selectedUser.joiningDate;
      if (selectedUser.designation) updateData.designation = selectedUser.designation;
      if (selectedUser.subRole) updateData.subRole = selectedUser.subRole;
      if (selectedUser.workShift) updateData.workShift = selectedUser.workShift;
      if (selectedUser.workLocation) updateData.workLocation = selectedUser.workLocation;
      if (selectedUser.supervisor) updateData.supervisor = selectedUser.supervisor;
      if (selectedUser.contractType) updateData.contractType = selectedUser.contractType;
      if (selectedUser.workStatus) updateData.workStatus = selectedUser.workStatus;

      await userService.updateUser(selectedUser.id, updateData);

      // Reload data
      await loadUsers();
      
      setShowEditModal(false);
      setSelectedUser(null);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      setSaving(true);
      await userService.deleteUser(userId);
      await loadUsers();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      await userService.updateUser(userId, {
        isActive: !user.isActive,
        updatedAt: new Date().toISOString()
      });
      
      await loadUsers();
      alert(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Error updating user status. Please try again.');
    }
  };

  // Small helper to create initials
  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create, edit, and manage user accounts and roles
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile: search + filter toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                aria-label="Search users"
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <button
              onClick={() => setShowMobileFilters((s) => !s)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 md:hidden"
              aria-expanded={showMobileFilters}
              aria-label="Toggle filters"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        {/* Desktop filters: grid */}
        <div className="hidden md:grid md:grid-cols-5 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="hod">HOD</option>
              <option value="teacher">Teacher</option>
              <option value="non-teaching">Non-Teaching Staff</option>
              <option value="visitor">Visitor</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              <option value="CSE">Computer Science</option>
              <option value="IT">Information Technology</option>
              <option value="ECE">Electronics & Communication</option>
              <option value="ME">Mechanical Engineering</option>
              <option value="CE">Civil Engineering</option>
              <option value="EE">Electrical Engineering</option>
              <option value="Administration">Administration</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Security">Security</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Mobile filters: collapsible */}
        {showMobileFilters && (
          <div className="md:hidden mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="hod">HOD</option>
                <option value="teacher">Teacher</option>
                <option value="non-teaching">Non-Teaching Staff</option>
                <option value="visitor">Visitor</option>
                <option value="driver">Driver</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Departments</option>
                <option value="CSE">Computer Science</option>
                <option value="IT">Information Technology</option>
                <option value="ECE">Electronics & Communication</option>
                <option value="ME">Mechanical Engineering</option>
                <option value="CE">Civil Engineering</option>
                <option value="EE">Electrical Engineering</option>
                <option value="Administration">Administration</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Security">Security</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Users: table (desktop) + cards (mobile) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                      <span className="text-gray-600">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {initials(user.name)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.rollNumber && (
                          <div className="text-xs text-gray-400">
                            ID: {user.rollNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(user.isActive)}
                      <span
                        className={`ml-2 text-sm ${
                          user.isActive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatLastLogin(user.lastLogin)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`p-1 rounded ${
                          user.isActive
                            ? "text-yellow-600 hover:text-yellow-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                        title={user.isActive ? "Deactivate user" : "Activate user"}
                      >
                        {user.isActive ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list (cards) */}
        <div className="md:hidden space-y-2 p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-gray-700">
                      {initials(user.name)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role}</span>
                      </span>

                      <span className={`text-xs ${user.isActive ? "text-green-600" : "text-red-600"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative" ref={actionMenuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionFor((cur) => (cur === user.id ? null : user.id));
                    }}
                    className="p-2 rounded hover:bg-gray-100"
                    aria-expanded={openActionFor === user.id}
                    aria-haspopup="true"
                    aria-label="Open user actions"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>

                  {openActionFor === user.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                      <button
                        onClick={() => {
                          handleEditUser(user);
                          setOpenActionFor(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          handleToggleStatus(user.id);
                          setOpenActionFor(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        {user.isActive ? (
                          <>
                            <XCircle className="w-4 h-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          handleDeleteUser(user.id);
                          setOpenActionFor(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatLastLogin(user.lastLogin)}</span>
                  </div>
                  <div className="text-xs text-gray-400">Dept: {user.department}</div>
                </div>

                <div className="flex items-center gap-2">
                  {/* quick action icons for faster mobile access */}
                  <button
                    onClick={() => handleEditUser(user)}
                    className="p-1 rounded hover:bg-gray-100"
                    aria-label="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user.id)}
                    className="p-1 rounded hover:bg-gray-100"
                    aria-label={user.isActive ? "Deactivate" : "Activate"}
                  >
                    {user.isActive ? (
                      <XCircle className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Crown className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">HODs</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === "hod").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === "admin").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Non-Teaching Staff</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === "non-teaching").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <GraduationCap className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Teachers</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === "teacher").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Visitors</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === "visitor").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-cyan-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Drivers</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === "driver").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NOTE: Add modal components or page-level routing for Add/Edit as appropriate */}
      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={newUser.name || ''}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newUser.email || ''}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    value={newUser.role || 'admin'}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="admin">Admin</option>
                    <option value="hod">Head of Department</option>
                    <option value="teacher">Teacher</option>
                    <option value="non-teaching">Non-Teaching Staff</option>
                    <option value="visitor">Visitor</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <input
                    type="text"
                    value={newUser.department || ''}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone || ''}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                  <input
                    type="text"
                    value={newUser.rollNumber || ''}
                    onChange={(e) => setNewUser({...newUser, rollNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter roll number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newUser.isActive || false}
                      onChange={(e) => setNewUser({...newUser, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active User</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Add User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="admin">Admin</option>
                    <option value="hod">Head of Department</option>
                    <option value="teacher">Teacher</option>
                    <option value="non-teaching">Non-Teaching Staff</option>
                    <option value="visitor">Visitor</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <input
                    type="text"
                    value={selectedUser.department}
                    onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={selectedUser.phone || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                  <input
                    type="text"
                    value={selectedUser.rollNumber || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, rollNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedUser.isActive}
                      onChange={(e) => setSelectedUser({...selectedUser, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active User</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
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

export default UserManagement;
