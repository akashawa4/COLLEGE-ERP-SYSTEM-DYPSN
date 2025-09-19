import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Edit, 
  Search, 
  Filter, 
  Folder,
  FolderOpen,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Calendar,
  User,
  Tag,
  Share2,
  Copy,
  Star,
  MoreVertical,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Document {
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
  category: 'academic' | 'administrative' | 'student' | 'faculty' | 'general';
  tags: string[];
  description: string;
  downloadUrl: string;
  isPublic: boolean;
  isStarred: boolean;
  department?: string;
  year?: string;
  semester?: string;
  courseId?: string;
  courseName?: string;
}

interface Folder {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  documents: Document[];
  subfolders: Folder[];
  createdAt: Date;
  createdBy: string;
  isPublic: boolean;
}

const DocumentManagementPanel: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  // Form states
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
    category: 'general' as Document['category'],
    department: user?.department || '',
    year: '',
    semester: '',
    courseId: '',
    description: '',
    tags: '',
    isPublic: false
  });

  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  const categories = [
    { value: 'academic', label: 'Academic', icon: '📚' },
    { value: 'administrative', label: 'Administrative', icon: '📋' },
    { value: 'student', label: 'Student', icon: '👨‍🎓' },
    { value: 'faculty', label: 'Faculty', icon: '👨‍🏫' },
    { value: 'general', label: 'General', icon: '📄' }
  ];

  const departments = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM'];
  const years = ['1st', '2nd', '3rd', '4th'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Mock data - replace with actual Firebase integration
  useEffect(() => {
    loadDocuments();
    loadFolders();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    // Mock data - replace with actual Firebase call
    const mockDocuments: Document[] = [
      {
        id: '1',
        fileName: 'syllabus_cse_2024.pdf',
        originalName: 'CSE Syllabus 2024.pdf',
        fileType: 'pdf',
        fileSize: 2048000,
        mimeType: 'application/pdf',
        uploadedBy: 'Dr. John Smith',
        uploadedByEmail: 'john.smith@college.edu',
        uploadedAt: new Date('2024-01-15'),
        lastModified: new Date('2024-01-15'),
        category: 'academic',
        tags: ['syllabus', 'cse', '2024'],
        description: 'Complete syllabus for Computer Science Engineering 2024',
        downloadUrl: '#',
        isPublic: true,
        isStarred: false,
        department: 'CSE',
        year: '1st',
        semester: '1'
      },
      {
        id: '2',
        fileName: 'assignment_1_dsa.docx',
        originalName: 'Data Structures Assignment 1.docx',
        fileType: 'docx',
        fileSize: 512000,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedBy: 'Dr. Jane Doe',
        uploadedByEmail: 'jane.doe@college.edu',
        uploadedAt: new Date('2024-01-20'),
        lastModified: new Date('2024-01-20'),
        category: 'academic',
        tags: ['assignment', 'dsa', 'programming'],
        description: 'First assignment on data structures and algorithms',
        downloadUrl: '#',
        isPublic: false,
        isStarred: true,
        department: 'CSE',
        year: '2nd',
        semester: '3',
        courseId: 'cs201',
        courseName: 'Data Structures and Algorithms'
      },
      {
        id: '3',
        fileName: 'exam_results_2024.xlsx',
        originalName: 'Exam Results 2024.xlsx',
        fileType: 'xlsx',
        fileSize: 1024000,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedBy: 'Admin User',
        uploadedByEmail: 'admin@college.edu',
        uploadedAt: new Date('2024-01-25'),
        lastModified: new Date('2024-01-25'),
        category: 'administrative',
        tags: ['results', 'exams', '2024'],
        description: 'Final exam results for all departments',
        downloadUrl: '#',
        isPublic: false,
        isStarred: false,
        department: 'ALL'
      }
    ];
    setDocuments(mockDocuments);
    setLoading(false);
  };

  const loadFolders = async () => {
    // Mock data - replace with actual Firebase call
    const mockFolders: Folder[] = [
      {
        id: '1',
        name: 'Academic Documents',
        description: 'All academic related documents',
        documents: [],
        subfolders: [],
        createdAt: new Date('2024-01-01'),
        createdBy: 'admin',
        isPublic: true
      },
      {
        id: '2',
        name: 'CSE Department',
        description: 'Computer Science Engineering documents',
        documents: [],
        subfolders: [],
        createdAt: new Date('2024-01-01'),
        createdBy: 'admin',
        isPublic: true
      }
    ];
    setFolders(mockFolders);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate file upload
    const newDocuments: Document[] = uploadForm.files.map((file, index) => ({
      id: Date.now().toString() + index,
      fileName: file.name.toLowerCase().replace(/\s+/g, '_'),
      originalName: file.name,
      fileType: file.name.split('.').pop() || 'unknown',
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: user?.name || 'Unknown',
      uploadedByEmail: user?.email || '',
      uploadedAt: new Date(),
      lastModified: new Date(),
      category: uploadForm.category,
      tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      description: uploadForm.description,
      downloadUrl: '#',
      isPublic: uploadForm.isPublic,
      isStarred: false,
      department: uploadForm.department,
      year: uploadForm.year,
      semester: uploadForm.semester,
      courseId: uploadForm.courseId
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
    setShowUploadModal(false);
    setUploadForm({
      files: [],
      category: 'general',
      department: user?.department || '',
      year: '',
      semester: '',
      courseId: '',
      description: '',
      tags: '',
      isPublic: false
    });
    setLoading(false);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: folderForm.name,
      description: folderForm.description,
      documents: [],
      subfolders: [],
      createdAt: new Date(),
      createdBy: user?.id || '',
      isPublic: folderForm.isPublic
    };

    setFolders(prev => [...prev, newFolder]);
    setShowCreateFolderModal(false);
    setFolderForm({ name: '', description: '', isPublic: false });
  };

  const handleDeleteDocument = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm('Are you sure you want to delete this folder and all its contents?')) {
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
    }
  };

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'xls':
      case 'xlsx': return <FileText className="w-5 h-5 text-green-500" />;
      case 'ppt':
      case 'pptx': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <FileImage className="w-5 h-5 text-purple-500" />;
      case 'mp4':
      case 'avi':
      case 'mov': return <FileVideo className="w-5 h-5 text-pink-500" />;
      case 'mp3':
      case 'wav':
      case 'flac': return <FileAudio className="w-5 h-5 text-indigo-500" />;
      case 'zip':
      case 'rar':
      case '7z': return <Archive className="w-5 h-5 text-yellow-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !filterCategory || doc.category === filterCategory;
    const matchesDepartment = !filterDepartment || doc.department === filterDepartment;
    
    return matchesSearch && matchesCategory && matchesDepartment;
  }).sort((a, b) => {
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
      case 'type':
        comparison = a.fileType.localeCompare(b.fileType);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Document Management</h1>
          <p className="text-gray-600">Organize, share, and manage all your documents</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Folder className="w-4 h-4" />
            New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
            ))}
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
            <option value="type">Sort by Type</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Folders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map(folder => (
              <div key={folder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-8 h-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">{folder.name}</h4>
                      <p className="text-sm text-gray-500">{folder.documents.length} documents</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{folder.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created {folder.createdAt.toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded-full ${folder.isPublic ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {folder.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <span className="text-sm text-gray-500">{filteredDocuments.length} files</span>
            </div>
            {filteredDocuments.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.length === filteredDocuments.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                  Select All
                </label>
                {selectedDocuments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedDocuments.length} selected</span>
                    <button className="text-sm text-red-600 hover:text-red-700">
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map(doc => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => handleSelectDocument(doc.id)}
                        className="rounded border-gray-300"
                      />
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{doc.originalName}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{doc.description}</p>
                  
                  <div className="space-y-1 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{doc.uploadedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{doc.uploadedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{doc.tags.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center gap-1">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={() => handleSelectDocument(doc.id)}
                      className="rounded border-gray-300"
                    />
                    {getFileIcon(doc.fileType)}
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.originalName}</h4>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>Uploaded by {doc.uploadedBy}</span>
                        <span>{doc.uploadedAt.toLocaleDateString()}</span>
                        {doc.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
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
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">Upload your first document to get started</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Document
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Files</label>
                  <input
                    type="file"
                    multiple
                    required
                    onChange={(e) => setUploadForm(prev => ({ ...prev, files: Array.from(e.target.files || []) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.mp3,.wav,.zip,.rar"
                  />
                  {uploadForm.files.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">Selected files:</p>
                      <ul className="text-sm text-gray-500 space-y-1">
                        {uploadForm.files.map((file, index) => (
                          <li key={index}>• {file.name} ({formatFileSize(file.size)})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value as Document['category'] }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={uploadForm.department}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                      value={uploadForm.year}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                    <select
                      value={uploadForm.semester}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., syllabus, cse, 2024"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter document description..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={uploadForm.isPublic}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make documents public (visible to all users)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadForm.files.length === 0}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Uploading...' : `Upload ${uploadForm.files.length} File${uploadForm.files.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create New Folder</h2>
                <button
                  onClick={() => setShowCreateFolderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Folder Name</label>
                  <input
                    type="text"
                    required
                    value={folderForm.name}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter folder name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={folderForm.description}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter folder description..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="folderIsPublic"
                    checked={folderForm.isPublic}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="folderIsPublic" className="text-sm text-gray-700">
                    Make folder public (visible to all users)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateFolderModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Folder
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

export default DocumentManagementPanel;
