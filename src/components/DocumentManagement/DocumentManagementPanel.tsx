import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Search, 
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
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Star,
  Clock,
  Shield,
  CheckCircle,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getBatchYear, userService } from '../../firebase/firestore';
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

interface StudentWithDocuments {
  student: UserType;
  documents: StudentDocument[];
  totalDocuments: number;
  categories: { [key: string]: number };
  lastUploaded?: Date;
}

interface DocumentGroup {
  studentName: string;
  studentId: string;
  studentEmail: string;
  documents: StudentDocument[];
  totalSize: number;
  categories: { [key: string]: number };
  lastUploaded?: Date;
}

const DocumentManagementPanel: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalStudent, setUploadModalStudent] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'student'>('student');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showStudentList, setShowStudentList] = useState(true);

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
  const divisions = ['A', 'B', 'C', 'D'];

  // Dynamic semester mapping based on year
  const getSemestersForYear = (year: string) => {
    switch (year) {
      case '1st':
        return ['1', '2'];
      case '2nd':
        return ['3', '4'];
      case '3rd':
        return ['5', '6'];
      case '4th':
        return ['7', '8'];
      default:
        return ['1', '2', '3', '4', '5', '6', '7', '8'];
    }
  };

  const availableSemesters = getSemestersForYear(filterYear || uploadForm.year);

  // Load documents and students based on current filters
  useEffect(() => {
    loadDocuments();
    loadStudents();
  }, [filterDepartment, filterYear, filterSemester, filterDivision]);

  // Organize documents by student when documents or students change
  useEffect(() => {
    organizeDocumentsByStudent();
  }, [documents, students]);

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
      
      // Correct path structure: /documents/{batch}/{department}_{year}_{sem}_{div}
      const path = `documents/${batch}/${department}_${year}_${sem}_${div}`;
      console.log('Loading documents from path:', path);
      console.log('Department:', department, 'Year:', year, 'Sem:', sem, 'Batch:', batch, 'Div:', div);
      
      const q = query(collection(db, path), orderBy('uploadedAt', 'desc'));
      const snap = await getDocs(q);
      console.log('Found documents:', snap.docs.length);
      
      // Debug: Log all document data
      snap.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Document ${index + 1}:`, {
          id: doc.id,
          studentId: data.studentId,
          studentName: data.studentName,
          fileName: data.fileName,
          uploadedAt: data.uploadedAt
        });
      });
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
      console.log('Loaded students:', studentsData.length);
      console.log('Student IDs:', studentsData.map(s => s.id));
      setStudents(studentsData);
    } catch (err) {
      console.error('Failed to load students', err);
    }
  };

  const organizeDocumentsByStudent = () => {
    const studentDocMap = new Map<string, StudentWithDocuments>();
    
    console.log('Organizing documents by student...');
    console.log('Total students:', students.length);
    console.log('Total documents:', documents.length);
    
    // Initialize student document groups
    students.forEach(student => {
      studentDocMap.set(student.id, {
        student,
        documents: [],
        totalDocuments: 0,
        categories: {},
        lastUploaded: undefined
      });
    });

    // Group documents by student
    documents.forEach(doc => {
      const studentId = doc.studentId;
      console.log('Document studentId:', studentId, 'Student name:', doc.studentName);
      console.log('Student ID exists in map:', studentDocMap.has(studentId));
      
      if (studentDocMap.has(studentId)) {
        const studentGroup = studentDocMap.get(studentId)!;
        studentGroup.documents.push(doc);
        studentGroup.totalDocuments++;
        
        // Count categories
        if (!studentGroup.categories[doc.category]) {
          studentGroup.categories[doc.category] = 0;
        }
        studentGroup.categories[doc.category]++;
        
        // Track last uploaded date
        if (!studentGroup.lastUploaded || doc.uploadedAt > studentGroup.lastUploaded) {
          studentGroup.lastUploaded = doc.uploadedAt;
        }
      } else {
        console.log('Student ID not found in student map:', studentId);
        console.log('Available student IDs:', Array.from(studentDocMap.keys()));
      }
    });

    // Convert to array and sort by student name
    const organizedStudents = Array.from(studentDocMap.values())
      .filter(group => group.documents.length > 0)
      .sort((a, b) => a.student.name.localeCompare(b.student.name));

    // setStudentDocuments(organizedStudents); // Not used in current implementation

    // Create document groups for professional display
    const documentGroups: DocumentGroup[] = organizedStudents.map(studentGroup => ({
      studentName: studentGroup.student.name,
      studentId: studentGroup.student.id,
      studentEmail: studentGroup.student.email,
      documents: studentGroup.documents,
      totalSize: studentGroup.documents.reduce((sum, doc) => sum + doc.fileSize, 0),
      categories: studentGroup.categories,
      lastUploaded: studentGroup.lastUploaded
    }));

    setDocumentGroups(documentGroups);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const createdDocs: StudentDocument[] = [];
      
      // Ensure Firebase auth is available to satisfy storage rules
      let effectiveUid = firebaseUser?.uid;
      console.log('Current user:', firebaseUser);
      console.log('Effective UID:', effectiveUid);
      
      if (!effectiveUid) {
        try {
          console.log('Attempting anonymous auth...');
          const cred = await signInAnonymously(auth);
          effectiveUid = cred.user.uid;
          console.log('Anonymous auth successful:', effectiveUid);
        } catch (e: any) {
          console.error('Anonymous auth failed:', e?.code || e);
          throw new Error('Firebase anonymous auth is disabled. Enable Anonymous sign-in or sign in with Firebase Auth.');
        }
      }
      
      // Refresh the auth token
      try {
        console.log('Refreshing auth token...');
        await auth.currentUser?.getIdToken(true);
        console.log('Auth token refreshed successfully');
      } catch (error) {
        console.error('Failed to refresh auth token:', error);
      }
      
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
        
        // Correct storage path: /documents/{batch}/{department}_{year}_{sem}_{div}/{studentId}/{timestamp}_{filename}
        const storagePath = `documents/${batch}/${department}_${year}_${sem}_${div}/${uploadForm.studentId}/${Date.now()}_${safeName}`;
        console.log('Storage path:', storagePath);
        console.log('File size:', file.size);
        console.log('File type:', file.type);
        
        const sRef = storageRef(storage, storagePath);
        console.log('Storage ref created:', sRef);
        
        const snap = await uploadBytes(sRef, file, {
          contentType: inferMimeType(file),
          customMetadata: { isPublic: uploadForm.isPublic ? 'true' : 'false' }
        });
        console.log('Upload successful:', snap);
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

        // Correct Firestore path: /documents/{batch}/{department}_{year}_{sem}_{div}
        const docsPath = `documents/${batch}/${department}_${year}_${sem}_${div}`;
        console.log('Saving document metadata to Firestore path:', docsPath);
        console.log('Student ID in metadata:', uploadForm.studentId);
        console.log('Student name in metadata:', uploadForm.studentName);
        console.log('Document metadata:', docMeta);
        
        const docRef = await addDoc(collection(db, docsPath), docMeta as any);
        console.log('Document saved to Firestore with ID:', docRef.id);

        createdDocs.push({
          id: docRef.id,
          ...docMeta,
          uploadedAt: new Date(),
          lastModified: new Date()
        } as StudentDocument);
      }

      setDocuments(prev => [...createdDocs, ...prev]);
      closeUploadModal();
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
      const path = `documents/${batch}/${department}_${year}_${sem}_${div}`;
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

  const toggleStudentExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  const getDocumentStatus = (doc: StudentDocument) => {
    const now = new Date();
    const uploadDate = doc.uploadedAt;
    const daysDiff = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) return { status: 'new', color: 'text-green-600', icon: CheckCircle };
    if (daysDiff <= 7) return { status: 'recent', color: 'text-blue-600', icon: Clock };
    if (doc.isStarred) return { status: 'starred', color: 'text-yellow-600', icon: Star };
    return { status: 'normal', color: 'text-gray-600', icon: File };
  };

  const handleStudentClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowStudentList(false);
    // Auto-expand the selected student
    setExpandedStudents(new Set([studentId]));
  };

  const handleBackToStudentList = () => {
    setSelectedStudentId('');
    setShowStudentList(true);
    setExpandedStudents(new Set());
  };

  const handleYearChange = (year: string) => {
    setFilterYear(year);
    // Reset semester when year changes
    const newSemesters = getSemestersForYear(year);
    if (newSemesters.length > 0) {
      setFilterSemester(newSemesters[0]); // Set to first available semester
    }
  };

  const handleUploadFormYearChange = (year: string) => {
    setUploadForm(prev => {
      const newSemesters = getSemestersForYear(year);
      return {
        ...prev,
        year,
        semester: newSemesters.length > 0 ? newSemesters[0] : prev.semester
      };
    });
  };

  const getFilteredDocuments = () => {
    if (selectedStudentId) {
      return documents.filter(doc => doc.studentId === selectedStudentId);
    }
    return documents;
  };

  const getSelectedStudent = () => {
    return students.find(student => student.id === selectedStudentId);
  };

  const openUploadModal = (student?: UserType) => {
    if (student) {
      setUploadModalStudent(student);
      setUploadForm(prev => ({
        ...prev,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        department: student.department || prev.department,
        year: student.year || prev.year,
        semester: student.sem || prev.semester,
        division: student.div || prev.division
      }));
    } else {
      setUploadModalStudent(null);
    }
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadModalStudent(null);
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
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              Professional Document Management System
            </h1>
            <p className="text-gray-600 mt-2">
              Organize and manage student documents with professional categorization and student-based organization
            </p>
        </div>
          <button
            onClick={() => openUploadModal()}
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
                onChange={(e) => handleYearChange(e.target.value)}
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
                disabled={!filterYear}
              >
                <option value="">All Semesters</option>
                {availableSemesters.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
              {!filterYear && (
                <p className="text-xs text-gray-500 mt-1">Select a year first</p>
              )}
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

      {/* Professional Stats */}
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
              <p className="text-sm font-medium text-gray-600">Students with Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documentGroups.length}</p>
                  </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
                    </div>
                  </div>
                  
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Tag className="w-6 h-6 text-yellow-600" />
                    </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Document Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                    </div>
                    </div>
                  </div>
                  </div>

      {/* Student List View */}
      {showStudentList && students.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Students ({students.length} students)
            </h2>
            <p className="text-gray-600 mt-1">
              {filterDepartment} • {filterYear} Year • Semester {filterSemester} • Division {filterDivision}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Click on a student to view their documents
            </p>
                  </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {students.map((student) => {
                const studentDocs = documents.filter(doc => doc.studentId === student.id);
                const totalSize = studentDocs.reduce((sum, doc) => sum + doc.fileSize, 0);
                const lastUploaded = studentDocs.length > 0 
                  ? studentDocs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0].uploadedAt
                  : null;

                return (
                  <div 
                    key={student.id} 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                    onClick={() => handleStudentClick(student.id)}
                  >
                  <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.rollNumber || student.id}</p>
                        <p className="text-xs text-gray-500 truncate">{student.email}</p>
            </div>
                      </div>
                    
                    {/* Document Stats */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {studentDocs.length} docs
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatFileSize(totalSize)}
                        </span>
                    </div>
                      {lastUploaded && (
                        <p className="text-xs text-gray-400 mt-1">
                          Last: {lastUploaded.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
                  </div>
          </div>
        </div>
      )}

      {/* Selected Student Documents View */}
      {!showStudentList && selectedStudentId && (
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToStudentList}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Back to student list"
                >
                  <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {getSelectedStudent()?.name || 'Student Documents'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {getSelectedStudent()?.email || ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getSelectedStudent()?.rollNumber || getSelectedStudent()?.id || ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {getFilteredDocuments().length} documents
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {getFilteredDocuments().length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-4">
                  This student doesn't have any documents uploaded yet.
                </p>
                <button
                  onClick={() => openUploadModal(getSelectedStudent())}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Upload Documents
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredDocuments().map((doc) => {
                  const categoryInfo = getCategoryInfo(doc.category);
                  const docStatus = getDocumentStatus(doc);
                  const StatusIcon = docStatus.icon;
                  
                  return (
                    <div
                      key={doc.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.mimeType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 truncate">{doc.originalName}</h4>
                            <StatusIcon className={`w-4 h-4 ${docStatus.color}`} />
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                              {categoryInfo.icon} {categoryInfo.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                            <Clock className="w-3 h-3" />
                            <span>{doc.uploadedAt.toLocaleDateString()}</span>
                            {doc.isPublic && (
                              <Shield className="w-3 h-3 text-green-500" />
                            )}
                          </div>
                          
                          {doc.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => window.open(doc.downloadUrl, '_blank')}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.open(doc.downloadUrl, '_blank')}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id, doc.storagePath)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents List - Only show when not in student list mode */}
      {!showStudentList && !selectedStudentId && (
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
                    onClick={() => setViewMode('student')}
                    className={`p-2 ${viewMode === 'student' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                    title="Student View"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                    title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                    </button>
                    <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                    title="List View"
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
        ) : viewMode === 'student' ? (
          // Professional Student-Based Document View
          <div className="p-6">
            {documentGroups.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No student documents found</h3>
            <p className="text-gray-600 mb-4">
              Upload documents for students to see them organized by student name
            </p>
            <button
              onClick={() => openUploadModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
              Upload Documents
              </button>
            </div>
        ) : (
              <div className="space-y-6">
                {documentGroups.map((group) => {
                  const isExpanded = expandedStudents.has(group.studentId);
                  
                  return (
                    <div key={group.studentId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {/* Student Header */}
                      <div 
                        className="p-6 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleStudentExpansion(group.studentId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{group.studentName}</h3>
                              <p className="text-sm text-gray-600">{group.studentEmail}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  {group.documents.length} documents
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(group.totalSize)}
                                </span>
                                {group.lastUploaded && (
                                  <span className="text-xs text-gray-500">
                                    Last updated: {group.lastUploaded.toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Category Stats */}
                            <div className="flex items-center gap-2">
                              {Object.entries(group.categories).map(([category, count]) => {
                                const categoryInfo = getCategoryInfo(category);
                                return (
                                  <span
                                    key={category}
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}
                                  >
                                    {categoryInfo.icon} {count}
                                  </span>
                                );
                              })}
                            </div>
                            
                            {/* Expand/Collapse Button */}
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Documents List */}
                      {isExpanded && (
                        <div className="p-6 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.documents.map((doc) => {
                              const categoryInfo = getCategoryInfo(doc.category);
                              const docStatus = getDocumentStatus(doc);
                              const StatusIcon = docStatus.icon;
                              
                              return (
                                <div
                                  key={doc.id}
                                  className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                      {getFileIcon(doc.mimeType)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-medium text-gray-900 truncate">{doc.originalName}</h4>
                                        <StatusIcon className={`w-4 h-4 ${docStatus.color}`} />
                                      </div>
                                      
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                                          {categoryInfo.icon} {categoryInfo.label}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatFileSize(doc.fileSize)}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                        <Clock className="w-3 h-3" />
                                        <span>{doc.uploadedAt.toLocaleDateString()}</span>
                                        {doc.isPublic && (
                                          <Shield className="w-3 h-3 text-green-500" />
                                        )}
                                      </div>
                                      
                                      {doc.description && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                                      )}
                                      
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => window.open(doc.downloadUrl, '_blank')}
                                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                          title="Download"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => window.open(doc.downloadUrl, '_blank')}
                                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                          title="View"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteDocument(doc.id, doc.storagePath)}
                                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                          title="More options"
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Original Grid/List View
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
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {uploadModalStudent ? `Upload Documents for ${uploadModalStudent.name}` : 'Upload Student Documents'}
              </h2>
              <button
                onClick={closeUploadModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            {uploadModalStudent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">{uploadModalStudent.name}</h3>
                    <p className="text-sm text-blue-700">{uploadModalStudent.email}</p>
                    <p className="text-xs text-blue-600">{uploadModalStudent.rollNumber || uploadModalStudent.id}</p>
                  </div>
                </div>
              </div>
            )}
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
                      onChange={(e) => handleUploadFormYearChange(e.target.value)}
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
                      {getSemestersForYear(uploadForm.year).map(sem => (
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
                  {uploadModalStudent ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                      {uploadModalStudent.name} ({uploadModalStudent.rollNumber || uploadModalStudent.id})
                    </div>
                  ) : (
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
                          {student.name} ({student.rollNumber || student.id})
                      </option>
                    ))}
                  </select>
                  )}
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
                  onClick={closeUploadModal}
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