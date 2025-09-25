import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Search, 
  Filter, 
  File,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Calendar,
  User,
  Tag,
  Grid,
  List,
  SortAsc,
  SortDesc,
  GraduationCap,
  Building2,
  BookOpen,
  Users,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where, deleteDoc, doc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { buildAcademicPaths, getBatchYear, userService } from '../../firebase/firestore';
import { getDepartmentCode } from '../../utils/departmentMapping';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { User as UserType } from '../../types';

interface StudentDocument {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedByEmail: string;
  uploadedAt: Date;
  lastModified: Date;
  category: 'admission' | 'identity' | 'caste' | 'marksheet' | 'fee_receipt' | 'other';
  tags: string[];
  description: string;
  downloadUrl: string;
  isPublic: boolean;
  isStarred: boolean;
  department: string;
  year: string;
  semester: string;
  batch: string;
  division: string;
  studentName: string;
  studentId: string;
  studentEmail: string;
  feeYear?: string;
  storagePath: string;
}

const DocumentManagementPanel: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form states
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
    category: 'other' as StudentDocument['category'],
    department: user?.department || 'CSE',
    year: '2nd',
    semester: '3',
    batch: '2025',
    division: 'A',
    studentId: '',
    studentName: '',
    studentEmail: '',
    feeYear: '',
    description: '',
    tags: '',
    isPublic: false
  });

  const categories = [
    { value: 'admission', label: 'Admission Form', icon: '📝', color: 'bg-blue-100 text-blue-800' },
    { value: 'identity', label: 'Identity (Aadhaar/PAN)', icon: '🪪', color: 'bg-green-100 text-green-800' },
    { value: 'caste', label: 'Caste Certificate', icon: '📜', color: 'bg-purple-100 text-purple-800' },
    { value: 'marksheet', label: 'Marksheet', icon: '📊', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'fee_receipt', label: 'Fee Receipt', icon: '🧾', color: 'bg-red-100 text-red-800' },
    { value: 'other', label: 'Other', icon: '📄', color: 'bg-gray-100 text-gray-800' }
  ];

  const departments = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM'];
  const years = ['1st', '2nd', '3rd', '4th'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const divisions = ['A', 'B', 'C', 'D'];

  // Load documents and students based on current filters
  useEffect(() => {
    loadDocuments();
    loadStudents();
  }, [filterDepartment, filterYear, filterSemester, filterDivision]);

  const inferMimeType = (file: File): string => {
    if (file.type) return file.type;
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.doc')) return 'application/msword';
    if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (name.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (name.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.gif')) return 'image/gif';
    if (name.endsWith('.txt')) return 'text/plain';
    if (name.endsWith('.zip')) return 'application/zip';
    return 'application/octet-stream';
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const department = getDepartmentCode((filterDepartment || uploadForm.department || 'CSE').trim());
      const year = (filterYear || uploadForm.year || '2nd').trim();
      const sem = (filterSemester || uploadForm.semester || '3').trim();
      const batch = getBatchYear(year);
      const div = (filterDivision || uploadForm.division || 'A').trim();
      
      // New path structure: /batch/2025/CSE/year/2nd/sems/3/divs/A/students
      const path = `batch/${batch}/${department}/year/${year}/sems/${sem}/divs/${div}/students`;
      const q = query(collection(db, path), orderBy('uploadedAt', 'desc'));
      const snap = await getDocs(q);
      const docs: StudentDocument[] = snap.docs.map((d) => {
        const data: any = d.data();
        return {
          id: d.id,
          fileName: data.fileName,
          originalName: data.originalName || data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          mimeType: data.mimeType || 'application/octet-stream',
          uploadedBy: data.uploadedBy || '',
          uploadedByEmail: data.uploadedByEmail || '',
          uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(),
          lastModified: data.lastModified?.toDate ? data.lastModified.toDate() : new Date(),
          category: data.category || 'other',
          tags: Array.isArray(data.tags) ? data.tags : [],
          description: data.description || '',
          downloadUrl: data.downloadUrl,
          isPublic: !!data.isPublic,
          isStarred: !!data.isStarred,
          department: data.department,
          year: data.year,
          semester: data.semester,
          batch: data.batch,
          division: data.division,
          studentName: data.studentName,
          studentId: data.studentId,
          studentEmail: data.studentEmail,
          feeYear: data.feeYear,
          storagePath: data.storagePath
        } as StudentDocument;
      });
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
    setLoading(false);
  };

  const loadStudents = async () => {
    try {
      const department = filterDepartment || uploadForm.department || 'CSE';
      const year = filterYear || uploadForm.year || '2nd';
      const semester = filterSemester || uploadForm.semester || '3';
      const batch = getBatchYear(year);
      const division = filterDivision || uploadForm.division || 'A';
      
      const studentsData = await userService.getStudentsByBatchDeptYearSemDiv(batch, department, year, semester, division);
      setStudents(studentsData);
    } catch (err) {
      console.error('Failed to load students', err);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const createdDocs: StudentDocument[] = [];
      // Ensure Firebase auth is available to satisfy storage rules
      let effectiveUid = firebaseUser?.uid;
      if (!effectiveUid) {
        try {
          const cred = await signInAnonymously(auth);
          effectiveUid = cred.user.uid;
        } catch (e: any) {
          console.error('Anonymous auth failed:', e?.code || e);
          throw new Error('Firebase anonymous auth is disabled. Enable Anonymous sign-in or sign in with Firebase Auth.');
        }
      }
      try {
        await auth.currentUser?.getIdToken(true);
      } catch {}
      
      for (const file of uploadForm.files) {
        const safeName = (file.name || 'file')
          .normalize('NFKD')
          .replace(/[^\w.-]+/g, '_')
          .replace(/_+/g, '_');
        const department = getDepartmentCode((uploadForm.department || 'CSE').trim());
        const year = (uploadForm.year || '2nd').trim();
        const sem = (uploadForm.semester || '3').trim();
        const batch = (uploadForm.batch || getBatchYear(year)).trim();
        const div = (uploadForm.division || 'A').trim();
        const ownerUid = effectiveUid as string;
        
        // New storage path: /batch/2025/CSE/year/2nd/sems/3/divs/A/students/{studentId}/{timestamp}_{filename}
        const storagePath = `batch/${batch}/${department}/year/${year}/sems/${sem}/divs/${div}/students/${uploadForm.studentId}/${Date.now()}_${safeName}`;
        const sRef = storageRef(storage, storagePath);
        const snap = await uploadBytes(sRef, file, {
          contentType: inferMimeType(file),
          customMetadata: { isPublic: uploadForm.isPublic ? 'true' : 'false' }
        });
        const url = await getDownloadURL(snap.ref);

        const docMeta = {
          fileName: safeName.toLowerCase(),
          originalName: file.name,
          fileType: file.name.split('.').pop() || 'unknown',
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: user?.name || 'Unknown',
          uploadedByEmail: user?.email || '',
          uploadedAt: serverTimestamp(),
          lastModified: serverTimestamp(),
          category: uploadForm.category,
          tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
          description: uploadForm.description,
          downloadUrl: url,
          isPublic: uploadForm.isPublic,
          isStarred: false,
          department: uploadForm.department,
          year: uploadForm.year,
          semester: uploadForm.semester,
          batch: uploadForm.batch,
          division: uploadForm.division,
          studentName: uploadForm.studentName,
          studentId: uploadForm.studentId,
          studentEmail: uploadForm.studentEmail,
          feeYear: uploadForm.feeYear,
          storagePath
        };

        // New Firestore path: /batch/2025/CSE/year/2nd/sems/3/divs/A/students
        const docsPath = `batch/${batch}/${department}/year/${year}/sems/${sem}/divs/${div}/students`;
        const docRef = await addDoc(collection(db, docsPath), docMeta as any);

        createdDocs.push({
          id: docRef.id,
          ...docMeta,
          uploadedAt: new Date(),
          lastModified: new Date()
        } as StudentDocument);
      }

      setDocuments(prev => [...createdDocs, ...prev]);
    setUploadForm({
      files: [],
      category: 'other',
        department: user?.department || 'CSE',
        year: '2nd',
        semester: '3',
        batch: '2025',
        division: 'A',
      studentId: '',
        studentName: '',
        studentEmail: '',
      feeYear: '',
      description: '',
      tags: '',
      isPublic: false
    });
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload error:', error);
    }
    setLoading(false);
  };

  const handleDeleteDocument = async (docId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      // Delete from Storage
      const fileRef = storageRef(storage, storagePath);
      await deleteObject(fileRef);
      
      // Delete from Firestore
      const department = getDepartmentCode((filterDepartment || uploadForm.department || 'CSE').trim());
      const year = (filterYear || uploadForm.year || '2nd').trim();
      const sem = (filterSemester || uploadForm.semester || '3').trim();
      const batch = getBatchYear(year);
      const div = (filterDivision || uploadForm.division || 'A').trim();
      const path = `batch/${batch}/${department}/year/${year}/sems/${sem}/divs/${div}/students`;
      await deleteDoc(doc(db, path, docId));
      
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5 text-green-500" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-pink-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-5 h-5 text-orange-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
    
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.originalName.localeCompare(b.originalName);
        break;
      case 'date':
        comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
        break;
      case 'size':
        comparison = a.fileSize - b.fileSize;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[categories.length - 1];
  };

  const handleStudentSelect = (student: UserType) => {
    setUploadForm(prev => ({
      ...prev,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email
    }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              Student Document Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage student documents by batch, department, year, semester, and division
            </p>
        </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Documents
          </button>
      </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Department
              </label>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Year
              </label>
          <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year} Year</option>
                ))}
          </select>
            </div>

            {/* Semester Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Semester
              </label>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            {/* Division Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Division
              </label>
              <select
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Divisions</option>
                {divisions.map(div => (
                  <option key={div} value={div}>Division {div}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
      </div>

            {/* Search */}
                    <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
                    </div>
                  </div>
                </div>
                </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
              </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
          </div>
        </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                  </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900">{filteredDocuments.length}</p>
            </div>
                    </div>
                  </div>
                  
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Tag className="w-6 h-6 text-yellow-600" />
                    </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                    </div>
                    </div>
                  </div>
                  </div>

      {/* Students List */}
      {students.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Students ({students.length} students)
            </h2>
            <p className="text-gray-600 mt-1">
              {filterDepartment} • {filterYear} Year • Semester {filterSemester} • Division {filterDivision}
            </p>
                  </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <div key={student.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.studentId || student.rollNumber}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
            </div>
                      </div>
                    </div>
              ))}
                  </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Documents ({sortedDocuments.length} files)
            </h2>
            <div className="flex items-center gap-4">
              {/* Sort Controls */}
                  <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="size">Sort by Size</option>
                  <option value="category">Sort by Category</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </button>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-1 border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                >
                  <Grid className="w-4 h-4" />
                    </button>
                    <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                    >
                  <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
            </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading documents...</p>
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">
              {filterDepartment || filterYear || filterSemester || filterDivision || filterCategory || searchTerm
                ? 'Try adjusting your filters or search terms'
                : 'Upload some documents to get started'
              }
            </p>
              <button
                onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
              Upload Documents
              </button>
            </div>
        ) : (
          <div className={viewMode === 'grid' ? 'p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'divide-y divide-gray-200'}>
            {sortedDocuments.map((doc) => {
              const categoryInfo = getCategoryInfo(doc.category);
              return (
                <div
                  key={doc.id}
                  className={viewMode === 'grid' 
                    ? 'bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200'
                    : 'p-4 hover:bg-gray-50 transition-colors'
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getFileIcon(doc.mimeType)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{doc.originalName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {doc.studentName} • {doc.department} • {doc.year} Year • Sem {doc.semester} • Div {doc.division}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                            {categoryInfo.icon} {categoryInfo.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(doc.fileSize)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {doc.uploadedAt.toLocaleDateString()}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.description}</p>
          )}
        </div>
      </div>
                    <div className="flex items-center gap-1 ml-4">
                <button
                        onClick={() => window.open(doc.downloadUrl, '_blank')}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(doc.downloadUrl, '_blank')}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.storagePath)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
              </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Upload Student Documents</h2>
            <form onSubmit={handleFileUpload}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Files</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setUploadForm(prev => ({ ...prev, files: Array.from(e.target.files || []) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    >
                      {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={uploadForm.department}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                      value={uploadForm.year}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    >
                      {years.map(year => (
                      <option key={year} value={year}>{year} Year</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                    <select
                      value={uploadForm.semester}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, semester: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    >
                      {semesters.map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                  <select
                    value={uploadForm.division}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, division: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {divisions.map(div => (
                      <option key={div} value={div}>Division {div}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                  <input
                    type="text"
                    value={uploadForm.batch}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, batch: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2025"
                    required
                  />
                </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                  <select
                      value={uploadForm.studentId}
                    onChange={(e) => {
                      const selectedStudent = students.find(s => s.id === e.target.value);
                      if (selectedStudent) {
                        handleStudentSelect(selectedStudent);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.studentId || student.rollNumber})
                      </option>
                    ))}
                  </select>
                  </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief description of the document"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., important, final, draft"
              />
            </div>
            </div>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={uploadForm.isPublic}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Make documents public</span>
                  </label>
                </div>
              <div className="flex justify-end gap-3">
                  <button
                    type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                  disabled={loading || uploadForm.files.length === 0 || !uploadForm.studentId}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {uploadForm.files.length} file(s)
                    </>
                  )}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagementPanel;