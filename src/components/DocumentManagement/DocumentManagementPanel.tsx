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
  MoreVertical,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getBatchYear, userService, getCurrentBatchYear } from '../../firebase/firestore';
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
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalStudent, setUploadModalStudent] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterBatch, setFilterBatch] = useState(getCurrentBatchYear());
  const [filterDivision, _setFilterDivision] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'student'>('student');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showStudentList, setShowStudentList] = useState(true);

  // Generate batch years (current year and previous 4 years)
  const availableBatches = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  // Form states
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
    category: 'other' as StudentDocument['category'],
    department: user?.department || 'CSE',
    year: '2nd',
    semester: '3',
    batch: getCurrentBatchYear(),
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

  const departments = ['Computer Science', 'Information Technology', 'Mechanical', 'Electrical', 'Civil'];
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

  const availableSemesters = getSemestersForYear(uploadForm.year || '2');

  // Load documents and students based on current filters (including search term)
  useEffect(() => {
    loadDocuments();
    loadStudentsForFilters();
  }, [filterDepartment, filterBatch, filterDivision, searchTerm]);

  // Load students when upload form changes (for dropdown)
  useEffect(() => {
    loadStudents();
  }, [uploadForm.batch, uploadForm.department, uploadForm.year, uploadForm.semester, uploadForm.division]);

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
      const batch = filterBatch || getCurrentBatchYear();
      const selectedDiv = (filterDivision || '').trim();

      // Load documents for all years and semesters in the batch (removed year/sem filters)
      const divisionsToLoad = selectedDiv ? [selectedDiv] : divisions;
      const yearsToLoad = ['1st', '2nd', '3rd', '4th'];
      const semestersToLoad = ['1', '2', '3', '4', '5', '6', '7', '8'];
      let allDocs: StudentDocument[] = [];

      for (const div of divisionsToLoad) {
        for (const year of yearsToLoad) {
          for (const sem of semestersToLoad) {
            // Correct path structure: /documents/{batch}/{department}_{year}_{sem}_{div}
            const path = `documents/${batch}/${department}_${year}_${sem}_${div}`;
            try {
              const q = query(collection(db, path), orderBy('uploadedAt', 'desc'));
              const snap = await getDocs(q);
              console.log('Found documents:', snap.docs.length, 'in', path);

              // Debug: Log all document data
              snap.docs.forEach((doc, index) => {
                const data = doc.data();
                console.log(`Document ${index + 1} (div ${div}):`, {
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
                  division: data.division || div,
                  studentName: data.studentName,
                  studentId: data.studentId,
                  studentEmail: data.studentEmail,
                  feeYear: data.feeYear,
                  storagePath: data.storagePath
                } as StudentDocument;
              });
              allDocs = allDocs.concat(docs);
            } catch (err) {
              // Collection doesn't exist or error loading - skip
              console.log('No documents in path:', path);
            }
          }
        }
      }

      setDocuments(allDocs);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
    setLoading(false);
  };

  // Load students for the main filter view
  const loadStudentsForFilters = async (retryCount = 0) => {
    setStudentsLoading(true);
    try {
      const batch = filterBatch || getCurrentBatchYear();
      const selectedDiv = (filterDivision || '').trim();

      // Always fetch all students first, then filter
      console.log('Fetching students from Firestore...');
      const allStudents = await userService.getAllStudents();
      console.log('Fetched students from Firestore:', allStudents.length);

      // Filter students based on all criteria
      let filtered = allStudents.filter(s => {
        // Must be a student
        if (s.role !== 'student') return false;

        // Exclude students without essential fields (likely deleted or invalid)
        if (!s.id || !s.name || !s.email) {
          return false;
        }

        // Exclude students that might be demo/test data (optional - can be removed if not needed)
        // Filter out students with obviously invalid emails or names
        const email = (s.email || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        if (email.includes('test@') || email.includes('demo@') || name.includes('test student') || name.includes('demo student')) {
          // Only exclude if they don't have a valid batchYear (demo students might not have proper batchYear)
          const studentBatchYear = (s as any).batchYear;
          if (!studentBatchYear || studentBatchYear !== batch) {
            return false;
          }
        }

        // Filter by batch - require exact match when batch filter is selected
        if (batch) {
          const studentBatchYear = (s as any).batchYear;
          // Only include students with matching batchYear
          // Exclude students without batchYear or with different batchYear
          if (!studentBatchYear || studentBatchYear !== batch) {
            return false;
          }
        }

        // Filter by department - use exact match to avoid duplicates
        if (filterDepartment) {
          const studentDept = (s.department || '').trim();
          const filterDept = filterDepartment.trim();

          // Map filter department to both full name and code for matching
          const deptMap: { [key: string]: { full: string, code: string } } = {
            'Computer Science': { full: 'Computer Science', code: 'CSE' },
            'Information Technology': { full: 'Information Technology', code: 'IT' },
            'Mechanical': { full: 'Mechanical', code: 'MECH' },
            'Electrical': { full: 'Electrical', code: 'EEE' },
            'Civil': { full: 'Civil', code: 'CIVIL' }
          };

          const deptInfo = deptMap[filterDept] || { full: filterDept, code: filterDept };

          // Match against both full name and code (case-insensitive) to prevent duplicates
          // This ensures a student only appears in one department
          const studentDeptLower = studentDept.toLowerCase();
          const filterFullLower = deptInfo.full.toLowerCase();
          const filterCodeLower = deptInfo.code.toLowerCase();

          if (studentDeptLower !== filterFullLower && studentDeptLower !== filterCodeLower) {
            return false;
          }
        }

        // Filter by division
        if (selectedDiv && s.div !== selectedDiv) return false;

        // Filter by search term (student name)
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const studentName = (s.name || '').toLowerCase();
          const rollNumber = String(s.rollNumber || s.id || '').toLowerCase();
          if (!studentName.includes(searchLower) && !rollNumber.includes(searchLower)) {
            return false;
          }
        }

        return true;
      });

      // Remove duplicates by student id (in case of any duplicates)
      const uniqueById = new Map<string, UserType>();
      for (const s of filtered) {
        // Use id as key to ensure uniqueness
        // Also ensure student has valid data
        if (s.id && s.name && s.email && !uniqueById.has(s.id)) {
          uniqueById.set(s.id, s);
        }
      }
      const uniqueStudents = Array.from(uniqueById.values());

      console.log('Loaded students (filters):', uniqueStudents.length, 'for batch:', batch, 'dept:', filterDepartment || 'all', 'div:', selectedDiv || 'all', 'search:', searchTerm || 'none');
      console.log('Total students fetched:', allStudents.length, 'After filtering:', uniqueStudents.length);
      setStudents(uniqueStudents);
    } catch (err: any) {
      console.error('Failed to load students (filters):', err);

      // Retry up to 2 times if it's a network error
      if (retryCount < 2 && (err?.code === 'unavailable' || err?.message?.includes('QUIC') || err?.message?.includes('network') || err?.code === 'deadline-exceeded')) {
        console.log(`Retrying fetch students (attempt ${retryCount + 1})...`);
        setTimeout(() => {
          loadStudentsForFilters(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      // If all retries failed or it's a different error, show empty list
      setStudents([]);
      if (retryCount === 0) {
        console.error('Failed to load students after retries. Error:', err);
      }
    } finally {
      setStudentsLoading(false);
    }
  };

  // Load students for upload form dropdown
  const loadStudents = async () => {
    try {
      const department = getDepartmentCode(uploadForm.department || 'CSE');
      const year = uploadForm.year || '2nd';
      const semester = uploadForm.semester || '3';
      const batch = uploadForm.batch || getCurrentBatchYear();
      const selectedDiv = uploadForm.division || 'A';

      // Fetch students based on batch, department, year, semester, and division
      const studentsData = await userService.getStudentsByBatchDeptYearSemDiv(
        batch,
        department,
        year,
        semester,
        selectedDiv
      );

      // Remove duplicates by student id
      const uniqueById = new Map<string, UserType>();
      for (const s of studentsData) uniqueById.set(s.id, s);
      const uniqueStudents = Array.from(uniqueById.values());

      console.log('Loaded students (upload form):', uniqueStudents.length, 'for batch:', batch, 'dept:', department, 'year:', year, 'sem:', semester, 'div:', selectedDiv);
      // Only update students if we're in upload modal context
      // Don't override the main filter students
      if (showUploadModal) {
        // Create a separate state for upload modal students if needed
        // For now, we'll use the same state but this is for the dropdown
      }
    } catch (err) {
      console.error('Failed to load students (upload form):', err);
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

      // Find the document to get its year/semester/batch
      const documentToDelete = documents.find(d => d.id === docId);
      if (!documentToDelete) {
        console.error('Document not found');
        return;
      }

      // Delete from Firestore - use document's own year/semester/batch
      const department = getDepartmentCode((documentToDelete.department || filterDepartment || 'CSE').trim());
      const year = documentToDelete.year || '2nd';
      const sem = documentToDelete.semester || '3';
      const batch = documentToDelete.batch || getBatchYear(year);
      const div = documentToDelete.division || 'A';
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
    let filtered = documents;

    // Filter by batch if selected
    if (filterBatch) {
      filtered = filtered.filter(doc => doc.batch === filterBatch);
    }

    // Filter by selected student if viewing individual student
    if (selectedStudentId) {
      filtered = filtered.filter(doc => doc.studentId === selectedStudentId);
    }

    return filtered;
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
      batch: getCurrentBatchYear(),
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
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-slate-700" />
            </div>
            Document Management
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-11">
            Organize and manage student documents
          </p>
        </div>
        <button
          onClick={() => openUploadModal()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          Upload Documents
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <label className="text-sm font-semibold text-slate-900 mb-3 block border-b border-slate-100 pb-2">
          Filters & Search
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Department Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'Computer Science' ? 'CSE' :
                    dept === 'Information Technology' ? 'IT' :
                      dept === 'Mechanical' ? 'MECH' :
                        dept === 'Electrical' ? 'EEE' :
                          dept === 'Civil' ? 'CIVIL' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Batch
            </label>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              {availableBatches.map(batch => (
                <option key={batch} value={batch}>Batch {batch}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FileText className="w-5 h-5 text-slate-700" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-slate-500">Total Documents</p>
              <p className="text-xl font-bold text-slate-900">{documents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="w-5 h-5 text-slate-700" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-slate-500">Students with Docs</p>
              <p className="text-xl font-bold text-slate-900">{documentGroups.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Building2 className="w-5 h-5 text-slate-700" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-slate-500">Total Students</p>
              <p className="text-xl font-bold text-slate-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Tag className="w-5 h-5 text-slate-700" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-slate-500">Doc Categories</p>
              <p className="text-xl font-bold text-slate-900">{categories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student List View */}
      {showStudentList && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-700" />
              Students {studentsLoading ? '(Loading...)' : `(${students.length})`}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {filterDepartment && `${filterDepartment} • `}
              Batch {filterBatch}
              {filterDivision && ` • Division ${filterDivision}`}
              {searchTerm && ` • Search: "${searchTerm}"`}
            </p>
          </div>
          <div className="p-4">
            {studentsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-medium text-slate-900 mb-2">No students found</h3>
                <p className="text-slate-500 mb-4 text-sm">
                  {filterDepartment || filterBatch || filterDivision || searchTerm
                    ? 'Try adjusting your filters to find students'
                    : 'No students available. Please add students first.'}
                </p>
              </div>
            ) : (
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
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer hover:border-slate-300"
                      onClick={() => handleStudentClick(student.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                          <User className="w-5 h-5 text-slate-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 truncate text-sm">{student.name}</h3>
                          <p className="text-xs text-slate-500">{student.rollNumber || student.id}</p>
                          <p className="text-xs text-slate-400 truncate">{student.email}</p>
                        </div>
                      </div>

                      {/* Document Stats */}
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between text-xs text-slate-500">
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
                          <p className="text-xs text-slate-400 mt-1">
                            Last: {lastUploaded.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Student Documents View */}
      {!showStudentList && selectedStudentId && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToStudentList}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  title="Back to student list"
                >
                  <ChevronRight className="w-5 h-5 text-slate-500 rotate-180" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                    <User className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {getSelectedStudent()?.name || 'Student Documents'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {getSelectedStudent()?.email || ''} • {getSelectedStudent()?.rollNumber || getSelectedStudent()?.id || ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-500 font-medium">
                {getFilteredDocuments().length} documents
              </div>
            </div>
          </div>

          <div className="p-4">
            {getFilteredDocuments().length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-medium text-slate-900 mb-2">No documents found</h3>
                <p className="text-slate-500 mb-4 text-sm">
                  This student doesn't have any documents uploaded yet.
                </p>
                <button
                  onClick={() => openUploadModal(getSelectedStudent())}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
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
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.mimeType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-slate-900 truncate text-sm">{doc.originalName}</h4>
                            <StatusIcon className={`w-3 h-3 ${docStatus.color}`} />
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryInfo.color}`}>
                              {categoryInfo.icon} {categoryInfo.label}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatFileSize(doc.fileSize)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-3">
                            <Clock className="w-3 h-3" />
                            <span>{doc.uploadedAt.toLocaleDateString()}</span>
                            {doc.isPublic && (
                              <Shield className="w-3 h-3 text-green-500" />
                            )}
                          </div>

                          {doc.description && (
                            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{doc.description}</p>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => window.open(doc.downloadUrl, '_blank')}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => window.open(doc.downloadUrl, '_blank')}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id, doc.storagePath)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
                {filterDepartment || filterBatch || filterDivision || filterCategory || searchTerm
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
                  <select
                    value={uploadForm.batch}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, batch: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {availableBatches.map(batch => (
                      <option key={batch} value={batch}>Batch {batch}</option>
                    ))}
                  </select>
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