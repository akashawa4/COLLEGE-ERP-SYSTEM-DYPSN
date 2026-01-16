import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
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
import { injectDummyData, USE_DUMMY_DATA } from '../../utils/dummyData';

const ComplaintManagement: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
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
    assignedTo: '',
    assignedToEmail: '',
    anonymous: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      let complaintsData: Complaint[] = [];
      if (USE_DUMMY_DATA) {
        complaintsData = injectDummyData.complaints([]);
      } else {
        complaintsData = await complaintService.getAllComplaints();
      }
      complaintsData = injectDummyData.complaints(complaintsData);
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

      // Auto-detect role from user profile
      const complainantRole = user?.role === 'student' ? 'Student' :
        user?.role === 'teacher' ? 'Teacher' :
          user?.role === 'hod' ? 'Teacher' : // HODs are also teachers
            user?.role === 'admin' ? 'Staff' : 'Other';

      const complaintData = {
        ...formData,
        complainantRole: complainantRole as Complaint['complainantRole'],
        status: 'Open' as Complaint['status'],
        submittedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        attachments: []
      };

      await complaintService.createComplaint(complaintData);

      await loadData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving complaint:', error);
      setError('Failed to save complaint. Please try again.');
    } finally {
      setSaving(false);
    }
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

  // Check if current user can delete this complaint
  const canDeleteComplaint = (complaint: Complaint) => {
    if (isAdmin) return true; // Admin can delete any complaint
    if (!user) return false;

    // Check if current user is the complainant
    if (complaint.complainantEmail === user.email) return true;
    if (complaint.complainantName === user.name) return true;

    return false;
  };

  const handleStatusChange = async (id: string, newStatus: Complaint['status'], resolution?: string) => {
    try {
      setSaving(true);
      setError(null);
      await complaintService.updateComplaintStatus(id, newStatus, resolution);
      await loadData();
    } catch (error: any) {
      console.error('Error updating complaint status:', error);
      const errorMessage = error.message || 'Failed to update complaint status. Please try again.';
      setError(errorMessage);
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

  const isAdmin = user?.role === 'admin';
  const isHOD = user?.role === 'hod';
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
            {user?.role === 'student' ? 'Submit Complaint' : 'Complaint Management'}
          </h1>
          <p className="text-sm text-slate-500">
            {user?.role === 'student'
              ? 'Submit complaints and grievances'
              : 'Manage and track complaints and grievances'
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Submit Complaint</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            <p className="text-slate-700 text-sm">Loading complaints...</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
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
                {canDeleteComplaint(complaint) && (
                  <button
                    onClick={() => handleDelete(complaint.id)}
                    className="p-2.5 text-gray-500 hover:text-red-600 transition-colors rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              {(isAdmin || isHOD || isTeacher) && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <select
                    value={complaint.status}
                    onChange={(e) => handleStatusChange(complaint.id, e.target.value as Complaint['status'])}
                    className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
                    disabled={complaint.status === 'Rejected'}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  {complaint.status === 'Rejected' && (
                    <span className="text-xs text-red-600 font-medium">Cannot be reopened</span>
                  )}
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
                  Submit New Complaint
                </h2>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
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
                        Submitting...
                      </>
                    ) : (
                      'Submit Complaint'
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

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintManagement;
