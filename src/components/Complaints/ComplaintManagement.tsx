import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  User,
  Calendar,
  Flag,
  Loader2,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { complaintService } from '../../firebase/firestore';
import { Complaint } from '../../types';

const ComplaintManagement: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Academic' as Complaint['category'],
    priority: 'Medium' as Complaint['priority'],
    complainantName: '',
    complainantEmail: '',
    complainantPhone: '',
    complainantRole: 'Student' as Complaint['complainantRole'],
    assignedTo: '',
    assignedToEmail: '',
    anonymous: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const complaintsData = await complaintService.getAllComplaints();
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setError('Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const complaintData = {
        ...formData,
        status: 'Open' as Complaint['status'],
        submittedDate: editingComplaint?.submittedDate || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        attachments: []
      };

      if (editingComplaint) {
        await complaintService.updateComplaint(editingComplaint.id, complaintData);
      } else {
        await complaintService.createComplaint(complaintData);
      }

      await loadData();
      setShowForm(false);
      setEditingComplaint(null);
      resetForm();
    } catch (error) {
      console.error('Error saving complaint:', error);
      setError('Failed to save complaint. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setFormData({
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      complainantName: complaint.complainantName,
      complainantEmail: complaint.complainantEmail,
      complainantPhone: complaint.complainantPhone,
      complainantRole: complaint.complainantRole,
      assignedTo: complaint.assignedTo || '',
      assignedToEmail: complaint.assignedToEmail || '',
      anonymous: complaint.anonymous
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return;

    try {
      setSaving(true);
      setError(null);
      await complaintService.deleteComplaint(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      setError('Failed to delete complaint. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Complaint['status'], resolution?: string) => {
    try {
      setSaving(true);
      setError(null);
      await complaintService.updateComplaintStatus(id, newStatus, resolution);
      await loadData();
    } catch (error) {
      console.error('Error updating complaint status:', error);
      setError('Failed to update complaint status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Academic',
      priority: 'Medium',
      complainantName: '',
      complainantEmail: '',
      complainantPhone: '',
      complainantRole: 'Student',
      assignedTo: '',
      assignedToEmail: '',
      anonymous: false
    });
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || complaint.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || complaint.priority === filterPriority;
    const matchesDepartment = filterDepartment === 'all' || complaint.department === filterDepartment;
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority && matchesDepartment;
  });

  const getStatusColor = (status: Complaint['status']) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Complaint['priority']) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: Complaint['category']) => {
    switch (category) {
      case 'Academic': return 'bg-purple-100 text-purple-800';
      case 'Administrative': return 'bg-blue-100 text-blue-800';
      case 'Infrastructure': return 'bg-orange-100 text-orange-800';
      case 'Hostel': return 'bg-green-100 text-green-800';
      case 'Canteen': return 'bg-pink-100 text-pink-800';
      case 'Library': return 'bg-indigo-100 text-indigo-800';
      case 'Sports': return 'bg-yellow-100 text-yellow-800';
      case 'Other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isAdmin = user?.role && user.role !== 'student' && user.role !== 'visitor';

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
            {user?.role === 'student' ? 'Submit Complaint' : 'Complaint Management'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base truncate">
            {user?.role === 'student'
              ? 'Submit complaints and grievances'
              : 'Manage and track complaints and grievances'
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">Submit Complaint</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-800 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800"
              aria-label="Close error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-800 text-sm">Loading complaints...</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                aria-label="Search complaints"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px] w-full sm:w-auto text-sm"
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>
              <option value="CSE">Computer Science</option>
              <option value="IT">Information Technology</option>
              <option value="ECE">Electronics & Communication</option>
              <option value="ME">Mechanical</option>
              <option value="EE">Electrical</option>
              <option value="CE">Civil</option>
              <option value="Administration">Administration</option>
              <option value="Library">Library</option>
              <option value="Hostel">Hostel</option>
              <option value="Canteen">Canteen</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px] w-full sm:w-auto text-sm"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Administrative">Administrative</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Hostel">Hostel</option>
              <option value="Canteen">Canteen</option>
              <option value="Library">Library</option>
              <option value="Sports">Sports</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px] w-full sm:w-auto text-sm"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px] w-full sm:w-auto text-sm"
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map((complaint) => (
          <div key={complaint.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{complaint.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3 sm:line-clamp-2 break-words">{complaint.description}</p>
              </div>

              <div className="flex items-center gap-2 sm:ml-4 self-start sm:self-auto">
                <button
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setShowDetails(true);
                  }}
                  className="p-2.5 text-gray-500 hover:text-blue-600 transition-colors rounded-md"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleEdit(complaint)}
                      className="p-2.5 text-gray-500 hover:text-blue-600 transition-colors rounded-md"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(complaint.id)}
                      className="p-2.5 text-gray-500 hover:text-red-600 transition-colors rounded-md"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center min-w-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(complaint.category)}`}>
                  {complaint.category}
                </span>
              </div>
              <div className="flex items-center min-w-0">
                <User className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{complaint.anonymous ? 'Anonymous' : complaint.complainantName}</span>
              </div>
              <div className="flex items-center min-w-0">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{new Date(complaint.submittedDate).toLocaleDateString()}</span>
              </div>
            </div>

            {complaint.assignedTo && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Flag className="w-4 h-4 mr-2" />
                Assigned to: <span className="ml-2 truncate">{complaint.assignedTo}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              {isAdmin && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <select
                    value={complaint.status}
                    onChange={(e) => handleStatusChange(complaint.id, e.target.value as Complaint['status'])}
                    className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              )}
              <span className="text-xs text-gray-500">Last updated: {new Date(complaint.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredComplaints.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Complaint Form Modal / Bottom sheet on mobile */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                  {editingComplaint ? 'Edit Complaint' : 'Submit New Complaint'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingComplaint(null); resetForm(); }}
                  className="text-gray-500 hover:text-gray-700 p-2"
                  aria-label="Close form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as Complaint['category'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="Academic">Academic</option>
                      <option value="Administrative">Administrative</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Hostel">Hostel</option>
                      <option value="Canteen">Canteen</option>
                      <option value="Library">Library</option>
                      <option value="Sports">Sports</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Complaint['priority'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.anonymous}
                    onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
                    Submit anonymously
                  </label>
                </div>

                {!formData.anonymous && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                        <input
                          type="text"
                          required={!formData.anonymous}
                          value={formData.complainantName}
                          onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
                        <select
                          value={formData.complainantRole}
                          onChange={(e) => setFormData({ ...formData, complainantRole: e.target.value as Complaint['complainantRole'] })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="Student">Student</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Staff">Staff</option>
                          <option value="Parent">Parent</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          required={!formData.anonymous}
                          value={formData.complainantEmail}
                          onChange={(e) => setFormData({ ...formData, complainantEmail: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          required={!formData.anonymous}
                          value={formData.complainantPhone}
                          onChange={(e) => setFormData({ ...formData, complainantPhone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Optional)</label>
                    <input
                      type="text"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      placeholder="Department or Person"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To Email (Optional)</label>
                    <input
                      type="email"
                      value={formData.assignedToEmail}
                      onChange={(e) => setFormData({ ...formData, assignedToEmail: e.target.value })}
                      placeholder="email@dypsn.edu"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingComplaint(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {editingComplaint ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      editingComplaint ? 'Update Complaint' : 'Submit Complaint'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Details Modal */}
      {showDetails && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Complaint Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{selectedComplaint.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                      {selectedComplaint.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedComplaint.status)}`}>
                      {selectedComplaint.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedComplaint.category)}`}>
                      {selectedComplaint.category}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Complainant Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedComplaint.anonymous ? 'Anonymous' : selectedComplaint.complainantName}</div>
                      <div><span className="font-medium">Email:</span> {selectedComplaint.complainantEmail || 'N/A'}</div>
                      <div><span className="font-medium">Phone:</span> {selectedComplaint.complainantPhone || 'N/A'}</div>
                      <div><span className="font-medium">Role:</span> {selectedComplaint.complainantRole}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Assignment Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Assigned To:</span> {selectedComplaint.assignedTo || 'Not assigned'}</div>
                      <div><span className="font-medium">Email:</span> {selectedComplaint.assignedToEmail || 'N/A'}</div>
                      <div><span className="font-medium">Submitted:</span> {new Date(selectedComplaint.submittedDate).toLocaleDateString()}</div>
                      <div><span className="font-medium">Last Updated:</span> {new Date(selectedComplaint.lastUpdated).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                {selectedComplaint.resolution && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Resolution</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedComplaint.resolution}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      handleEdit(selectedComplaint);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Complaint
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintManagement;
