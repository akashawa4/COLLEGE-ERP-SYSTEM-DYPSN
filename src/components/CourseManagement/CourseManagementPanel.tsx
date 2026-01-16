import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Users,
  Calendar,
  Clock,
  GraduationCap,
  Building2,
  FileText,
  Download,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { buildAcademicPaths, getBatchYear } from '../../firebase/firestore';
import { getDepartmentCode } from '../../utils/departmentMapping';

interface Course {
  id: string;
  courseName: string;
  courseCode: string;
  department: string;
  year: string;
  semester: string;
  credits: number;
  description: string;
  instructor: string;
  instructorId: string;
  maxStudents: number;
  enrolledStudents: number;
  status: 'active' | 'inactive' | 'completed';
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  courseId?: string;
  category: 'syllabus' | 'notes' | 'assignment' | 'exam' | 'other';
  description: string;
  downloadUrl: string;
}

const CourseManagementPanel: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'courses' | 'documents'>('courses');

  // Form states for course creation
  const [courseForm, setCourseForm] = useState({
    courseName: '',
    courseCode: '',
    department: user?.department || '',
    year: '',
    semester: '',
    credits: 0,
    description: '',
    maxStudents: 0,
    startDate: '',
    endDate: ''
  });

  // Form states for document upload
  const [documentForm, setDocumentForm] = useState({
    fileName: '',
    description: '',
    category: 'notes' as Document['category'],
    courseId: ''
  });

  const departments = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM'];
  const years = ['1st', '2nd', '3rd', '4th'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  useEffect(() => {
    loadCourses();
    loadDocuments();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const department = getDepartmentCode((courseForm.department || 'CSE').trim());
      const year = (courseForm.year || '2nd').trim();
      const sem = (courseForm.semester || '3').trim();
      const batch = getBatchYear(year);
      const path = buildAcademicPaths.coursesCollection(batch, department, year, sem);
      const snap = await getDocs(collection(db, path));
      const courseItems: Course[] = snap.docs.map((d) => {
        const data: any = d.data();
        return {
          id: d.id,
          courseName: data.courseName,
          courseCode: data.courseCode,
          department: data.department,
          year: data.year,
          semester: data.semester,
          credits: data.credits || 0,
          description: data.description || '',
          instructor: data.instructor || '',
          instructorId: data.instructorId || '',
          maxStudents: data.maxStudents || 0,
          enrolledStudents: data.enrolledStudents || 0,
          status: data.status || 'active',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          createdAt: new Date(),
          updatedAt: new Date()
        } as Course;
      });
      setCourses(courseItems);
    } catch (err) {
      console.error('Failed to load courses', err);
    }
    setLoading(false);
  };

  const loadDocuments = async () => {
    try {
      if (!selectedCourse) {
        setDocuments([]);
        return;
      }
      const department = getDepartmentCode((selectedCourse.department || 'CSE').trim());
      const year = (selectedCourse.year || '2nd').trim();
      const sem = (selectedCourse.semester || '3').trim();
      const batch = getBatchYear(year);
      const path = buildAcademicPaths.courseDocumentsCollection(batch, department, year, sem, selectedCourse.id);
      const snap = await getDocs(collection(db, path));
      const docs: Document[] = snap.docs.map((d) => {
        const data: any = d.data();
        return {
          id: d.id,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize || 0,
          uploadedBy: data.uploadedBy || '',
          uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(),
          courseId: selectedCourse.id,
          category: data.category || 'other',
          description: data.description || '',
          downloadUrl: data.downloadUrl || ''
        } as Document;
      });
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load course documents', err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const department = getDepartmentCode((courseForm.department || 'CSE').trim());
      const year = (courseForm.year || '2nd').trim();
      const sem = (courseForm.semester || '3').trim();
      const batch = getBatchYear(year);
      const path = buildAcademicPaths.coursesCollection(batch, department, year, sem);
      const payload = {
        ...courseForm,
        department,
        year,
        semester: sem,
        instructor: user?.name || 'Unknown',
        instructorId: user?.id || '',
        enrolledStudents: 0,
        status: 'active',
        startDate: courseForm.startDate,
        endDate: courseForm.endDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const ref = await addDoc(collection(db, path), payload as any);
      setCourses(prev => [
        ...prev,
        {
          id: ref.id,
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date()
        } as unknown as Course
      ]);
      setShowCreateModal(false);
      setCourseForm({
        courseName: '',
        courseCode: '',
        department: user?.department || '',
        year: '',
        semester: '',
        credits: 0,
        description: '',
        maxStudents: 0,
        startDate: '',
        endDate: ''
      });
    } catch (err) {
      console.error('Failed to create course', err);
    }
    setLoading(false);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setCourses(prev => prev.filter(course => course.id !== courseId));
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const input = (e.target as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
      const file = input?.files?.[0];
      if (!file) return;
      const safeName = file.name.replace(/\s+/g, '_');
      const department = getDepartmentCode((selectedCourse.department || 'CSE').trim());
      const year = (selectedCourse.year || '2nd').trim();
      const sem = (selectedCourse.semester || '3').trim();
      const batch = getBatchYear(year);
      const storagePath = `course-documents/${batch}/${department}/year/${year}/sems/${sem}/${selectedCourse.id}/${Date.now()}_${safeName}`;
      const sRef = storageRef(storage, storagePath);
      const snap = await uploadBytes(sRef, file);
      const url = await getDownloadURL(snap.ref);
      const docsPath = buildAcademicPaths.courseDocumentsCollection(batch, department, year, sem, selectedCourse.id);
      const payload = {
        fileName: safeName,
        fileType: safeName.split('.').pop() || 'unknown',
        fileSize: file.size,
        uploadedBy: user?.name || 'Unknown',
        uploadedAt: serverTimestamp(),
        category: documentForm.category,
        description: documentForm.description,
        downloadUrl: url,
        storagePath
      };
      const ref = await addDoc(collection(db, docsPath), payload as any);
      setDocuments(prev => [
        ...prev,
        {
          id: ref.id,
          ...payload,
          uploadedAt: new Date(),
          courseId: selectedCourse.id
        } as unknown as Document
      ]);
    } catch (err) {
      console.error('Failed to upload course document', err);
    }
    setShowDocumentModal(false);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || course.department === filterDepartment;
    const matchesStatus = !filterStatus || course.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: Course['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: Document['category']) => {
    switch (category) {
      case 'syllabus': return <BookOpen className="w-4 h-4" />;
      case 'notes': return <FileText className="w-4 h-4" />;
      case 'assignment': return <Edit className="w-4 h-4" />;
      case 'exam': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Course Management</h1>
          <p className="text-sm text-slate-500">Manage courses, curriculum, and academic documents</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
          <button
            onClick={() => setShowDocumentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload Doc
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto self-start">
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'courses'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" />
            Courses
          </div>
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'documents'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </div>
        </button>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
                />
              </div>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </select>
              <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                <Filter className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.courseName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{course.courseCode}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{course.department} - {course.year} Year, Sem {course.semester}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>{course.credits} Credits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{course.enrolledStudents}/{course.maxStudents} Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>

                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                    View Details
                  </button>
                  <button className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                    Manage Students
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first course</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Course
              </button>
            </div>
          )}
        </>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Course Documents</h3>
              <button
                onClick={() => setShowDocumentModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>

            <div className="space-y-4">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getCategoryIcon(doc.category)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.fileName}</h4>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>Uploaded by {doc.uploadedBy}</span>
                        <span>{doc.uploadedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {documents.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
                <p className="text-gray-600 mb-4">Upload course materials, assignments, and other documents</p>
                <button
                  onClick={() => setShowDocumentModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Upload Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create New Course</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                    <input
                      type="text"
                      required
                      value={courseForm.courseName}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, courseName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                    <input
                      type="text"
                      required
                      value={courseForm.courseCode}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, courseCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      required
                      value={courseForm.department}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                      required
                      value={courseForm.year}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                    <select
                      required
                      value={courseForm.semester}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {semesters.map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credits</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={courseForm.credits}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={courseForm.maxStudents}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      required
                      value={courseForm.startDate}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      required
                      value={courseForm.endDate}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={courseForm.description}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter course description..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                  <input
                    type="file"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <select
                    value={documentForm.courseId}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.courseName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={documentForm.category}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, category: e.target.value as Document['category'] }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="syllabus">Syllabus</option>
                    <option value="notes">Notes</option>
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={documentForm.description}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter document description..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDocumentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Upload Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagementPanel;
