// LibraryManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Download,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { libraryBookService, libraryMemberService, libraryTransactionService } from '../../firebase/firestore';

// Local interfaces for library entities
interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: 'Academic' | 'Fiction' | 'Non-Fiction' | 'Reference' | 'Technical' | 'General';
  publisher: string;
  publicationYear: number;
  edition: string;
  pages: number;
  language: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  location?: string;
  shelfNumber?: string;
  status: 'Available' | 'Issued' | 'Reserved' | 'Maintenance' | 'Lost';
  price?: number;
  purchaseDate?: string;
  tags?: string[];
}

interface LibraryMember {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'teacher' | 'staff' | 'external';
  department?: string;
  year?: string;
  semester?: string;
  rollNumber?: string;
  address: string;
  membershipType: 'Regular' | 'Premium' | 'Temporary';
  membershipStartDate: string;
  membershipEndDate: string;
  maxBooksAllowed: number;
  currentBooksIssued: number;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Expired';
  fineAmount?: number;
}

interface LibraryTransaction {
  id: string;
  bookId: string;
  memberId: string;
  bookTitle: string;
  memberName: string;
  issueDate: string;
  dueDate: string;
  status: 'Issued' | 'Returned' | 'Overdue' | 'Lost';
  fineAmount: number;
}

const LibraryManagement: React.FC = () => {
  const { user } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState<'books' | 'members' | 'transactions' | 'reports'>('books');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Books state
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<LibraryBook[]>([]);
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Academic' as LibraryBook['category'],
    publisher: '',
    publicationYear: new Date().getFullYear(),
    edition: '',
    pages: 0,
    language: 'English',
    description: '',
    totalCopies: 1,
    location: '',
    shelfNumber: '',
    price: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    tags: ''
  });
  
  // Members state
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<LibraryMember[]>([]);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<LibraryMember | null>(null);
  const [memberForm, setMemberForm] = useState({
    memberId: '',
    name: '',
    email: '',
    phone: '',
    role: 'student' as LibraryMember['role'],
    department: '',
    year: '',
    semester: '',
    rollNumber: '',
    address: '',
    membershipType: 'Regular' as LibraryMember['membershipType'],
    membershipStartDate: new Date().toISOString().split('T')[0],
    membershipEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxBooksAllowed: 3,
    status: 'Active' as LibraryMember['status']
  });
  
  // Transactions state
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<LibraryTransaction[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    bookId: '',
    memberId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [memberStatusFilter, setMemberStatusFilter] = useState('all');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');

  // Load data from Firestore
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [booksData, membersData, transactionsData] = await Promise.all([
        libraryBookService.getAllBooks(),
        libraryMemberService.getAllMembers(),
        libraryTransactionService.getAllTransactions()
      ]);

      setBooks(booksData);
      setFilteredBooks(booksData);
      setMembers(membersData);
      setFilteredMembers(membersData);
      setTransactions(transactionsData);
      setFilteredTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading library data:', error);
      setError('Failed to load library data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  useEffect(() => {
    filterBooks();
  }, [books, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, memberStatusFilter]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, transactionStatusFilter]);

  const filterBooks = () => {
    const q = searchTerm.trim().toLowerCase();
    let filtered = books.filter(book => {
      const matchesSearch = !q || book.title.toLowerCase().includes(q) ||
                           book.author.toLowerCase().includes(q) ||
                           book.isbn.includes(q);
      const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
    setFilteredBooks(filtered);
  };

  const filterMembers = () => {
    const q = searchTerm.trim().toLowerCase();
    let filtered = members.filter(member => {
      const matchesSearch = !q || member.name.toLowerCase().includes(q) ||
                           member.email.toLowerCase().includes(q) ||
                           member.memberId.toLowerCase().includes(q);
      const matchesStatus = memberStatusFilter === 'all' || member.status === memberStatusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredMembers(filtered);
  };

  const filterTransactions = () => {
    const q = searchTerm.trim().toLowerCase();
    let filtered = transactions.filter(transaction => {
      const matchesSearch = !q || transaction.bookTitle.toLowerCase().includes(q) ||
                           transaction.memberName.toLowerCase().includes(q);
      const matchesStatus = transactionStatusFilter === 'all' || transaction.status === transactionStatusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredTransactions(filtered);
  };

  // Form handlers
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim()) {
      alert("Please provide book title.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const bookData = {
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        isbn: bookForm.isbn.trim(),
        category: bookForm.category as LibraryBook['category'],
        publisher: bookForm.publisher.trim(),
        publicationYear: bookForm.publicationYear,
        edition: bookForm.edition.trim(),
        pages: bookForm.pages,
        language: bookForm.language.trim(),
        description: bookForm.description.trim(),
        totalCopies: bookForm.totalCopies,
        availableCopies: bookForm.totalCopies,
        location: bookForm.location.trim(),
        shelfNumber: bookForm.shelfNumber.trim(),
        status: 'Available' as LibraryBook['status'],
        price: bookForm.price,
        purchaseDate: bookForm.purchaseDate,
        tags: bookForm.tags ? bookForm.tags.split(",").map(t => t.trim()).filter(Boolean) : []
      };

      if (editingBook) {
        await libraryBookService.updateBook(editingBook.id, bookData);
      } else {
        await libraryBookService.createBook(bookData);
      }

      await loadData(); // Reload data from Firestore
      setShowBookForm(false);
      setEditingBook(null);
    } catch (error) {
      console.error('Error saving book:', error);
      setError('Failed to save book. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) {
      alert("Please provide member name.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const memberData = {
        memberId: memberForm.memberId.trim(),
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
        phone: memberForm.phone.trim(),
        role: memberForm.role as LibraryMember['role'],
        department: memberForm.department?.trim() || undefined,
        year: memberForm.year?.trim() || undefined,
        semester: memberForm.semester?.trim() || undefined,
        rollNumber: memberForm.rollNumber?.trim() || undefined,
        address: memberForm.address.trim(),
        membershipType: memberForm.membershipType as LibraryMember['membershipType'],
        membershipStartDate: memberForm.membershipStartDate,
        membershipEndDate: memberForm.membershipEndDate,
        maxBooksAllowed: memberForm.maxBooksAllowed,
        currentBooksIssued: editingMember?.currentBooksIssued || 0,
        status: memberForm.status as LibraryMember['status'],
        fineAmount: editingMember?.fineAmount || 0
      };

      if (editingMember) {
        await libraryMemberService.updateMember(editingMember.id, memberData);
      } else {
        await libraryMemberService.createMember(memberData);
      }

      await loadData(); // Reload data from Firestore
      setShowMemberForm(false);
      setEditingMember(null);
    } catch (error) {
      console.error('Error saving member:', error);
      setError('Failed to save member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.bookId || !transactionForm.memberId) {
      alert("Please select both book and member.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Get book and member details
      const book = await libraryBookService.getBook(transactionForm.bookId);
      const member = await libraryMemberService.getMember(transactionForm.memberId);

      if (!book || !member) {
        alert("Book or member not found.");
        return;
      }

      if (book.availableCopies <= 0) {
        alert("Book is not available.");
        return;
      }

      if (member.currentBooksIssued >= member.maxBooksAllowed) {
        alert("Member has reached maximum book limit.");
        return;
      }

      const transactionData = {
        bookId: transactionForm.bookId,
        memberId: transactionForm.memberId,
        bookTitle: book.title,
        memberName: member.name,
        issueDate: transactionForm.issueDate,
        dueDate: transactionForm.dueDate,
        status: 'Issued' as LibraryTransaction['status'],
        fineAmount: 0,
        issuedBy: user?.name || 'Library Staff',
        notes: transactionForm.notes?.trim() || undefined
      };

      await libraryTransactionService.createTransaction(transactionData);
      await loadData(); // Reload data from Firestore
      setShowTransactionForm(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError('Failed to create transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // UI render helpers and responsive cards for small screens
  const renderBooksTab = () => (
    <div className="space-y-6">
      {/* Books Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Library Books</h2>
          <p className="text-gray-600">Manage library book collection</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => { setEditingBook(null); setBookForm(prev => ({ ...prev, title: '' })); setShowBookForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            aria-label="Add book"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Book</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search books by title, author, or ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-sm"
            >
              <option value="all">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Fiction">Fiction</option>
              <option value="Non-Fiction">Non-Fiction</option>
              <option value="Reference">Reference</option>
              <option value="Technical">Technical</option>
              <option value="General">General</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-sm"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Issued">Issued</option>
              <option value="Reserved">Reserved</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <div key={book.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{book.title}</h3>
                <p className="text-sm text-gray-600 mt-1 truncate">by {book.author}</p>
                <p className="text-xs text-gray-500 mt-1">ISBN: {book.isbn}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                book.status === 'Available' ? 'bg-green-100 text-green-800' :
                book.status === 'Issued' ? 'bg-yellow-100 text-yellow-800' :
                book.status === 'Reserved' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {book.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Category</span>
                <span className="font-medium">{book.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Available</span>
                <span className="font-medium">{book.availableCopies}/{book.totalCopies}</span>
              </div>
              <div className="flex justify-between">
                <span>Location</span>
                <span className="font-medium">{book.shelfNumber || book.location || '-'}</span>
              </div>
            </div>

            <div className="mt-auto flex gap-2">
              <button 
                onClick={() => {
                  setEditingBook(book);
                  setBookForm({
                    title: book.title,
                    author: book.author,
                    isbn: book.isbn,
                    category: book.category,
                    publisher: book.publisher,
                    publicationYear: book.publicationYear,
                    edition: book.edition,
                    pages: book.pages,
                    language: book.language,
                    description: book.description,
                    totalCopies: book.totalCopies,
                    location: book.location || '',
                    shelfNumber: book.shelfNumber || '',
                    price: book.price ?? 0,
                    purchaseDate: book.purchaseDate || new Date().toISOString().split('T')[0],
                    tags: (book.tags || []).join(', ')
                  });
                  setShowBookForm(true);
                }}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                aria-label={`Edit ${book.title}`}
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button 
                onClick={() => {
                  if (confirm(`Delete book "${book.title}"?`)) {
                    libraryBookService.deleteBook(book.id).then(() => loadData());
                  }
                }}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                aria-label={`Delete ${book.title}`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      {/* Members Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Library Members</h2>
          <p className="text-gray-600">Manage library membership</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowMemberForm(true)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            aria-label="Add member"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Member</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search members by name, email, or member ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={memberStatusFilter}
            onChange={(e) => setMemberStatusFilter(e.target.value)}
            className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-sm"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Members Table for desktop */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Books Issued</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">ID: {member.memberId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.email}</div>
                    <div className="text-sm text-gray-500">{member.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.role}</div>
                    {member.department && (
                      <div className="text-sm text-gray-500">{member.department}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.currentBooksIssued}/{member.maxBooksAllowed}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.status === 'Active' ? 'bg-green-100 text-green-800' :
                      member.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                      member.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingMember(member);
                          setMemberForm({
                            memberId: member.memberId,
                            name: member.name,
                            email: member.email,
                            phone: member.phone,
                            role: member.role,
                            department: member.department || '',
                            year: member.year || '',
                            semester: member.semester || '',
                            rollNumber: member.rollNumber || '',
                            address: member.address,
                            membershipType: member.membershipType,
                            membershipStartDate: member.membershipStartDate,
                            membershipEndDate: member.membershipEndDate,
                            maxBooksAllowed: member.maxBooksAllowed,
                            status: member.status
                          });
                          setShowMemberForm(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-2"
                        aria-label={`Edit ${member.name}`}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden md:inline">Edit</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete member ${member.name}?`)) {
                            libraryMemberService.deleteMember(member.id).then(() => loadData());
                          }
                        }}
                        className="text-red-600 hover:text-red-900 flex items-center gap-2"
                        aria-label={`Delete ${member.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden md:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Members cards for small screens */}
        <div className="sm:hidden space-y-3 p-3">
          {filteredMembers.map(member => (
            <div key={member.id} className="bg-white border rounded-lg p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{member.name}</div>
                  <div className="text-xs text-gray-500 truncate">ID: {member.memberId}</div>
                  <div className="text-xs text-gray-500 truncate">{member.email}</div>
                  <div className="text-xs text-gray-500 truncate">{member.phone}</div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                  member.status === 'Active' ? 'bg-green-100 text-green-800' :
                  member.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                  member.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {member.status}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setEditingMember(member);
                    setMemberForm({
                      memberId: member.memberId,
                      name: member.name,
                      email: member.email,
                      phone: member.phone,
                      role: member.role,
                      department: member.department || '',
                      year: member.year || '',
                      semester: member.semester || '',
                      rollNumber: member.rollNumber || '',
                      address: member.address,
                      membershipType: member.membershipType,
                      membershipStartDate: member.membershipStartDate,
                      membershipEndDate: member.membershipEndDate,
                      maxBooksAllowed: member.maxBooksAllowed,
                      status: member.status
                    });
                    setShowMemberForm(true);
                  }}
                  className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >Edit</button>
                <button
                  onClick={() => {
                    if (confirm(`Delete member "${member.name}"?`)) {
                      libraryMemberService.deleteMember(member.id).then(() => loadData());
                    }
                  }}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTransactionsTab = () => (
    <div className="space-y-6">
      {/* Transactions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Book Transactions</h2>
          <p className="text-gray-600">Manage book issues and returns</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowTransactionForm(true)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            aria-label="Issue book"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Issue Book</span>
            <span className="sm:hidden">Issue</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions by book title or member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={transactionStatusFilter}
            onChange={(e) => setTransactionStatusFilter(e.target.value)}
            className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-sm"
          >
            <option value="all">All Status</option>
            <option value="Issued">Issued</option>
            <option value="Returned">Returned</option>
            <option value="Overdue">Overdue</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Transactions Table for desktop */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.bookTitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.memberName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.status === 'Issued' ? 'bg-blue-100 text-blue-800' :
                      transaction.status === 'Returned' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{transaction.fineAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {transaction.status === 'Issued' && (
                        <button 
                          onClick={() => {
                            if (confirm(`Return book "${transaction.bookTitle}" from ${transaction.memberName}?`)) {
                              libraryTransactionService.returnBook(transaction.id, user?.name || 'Library Staff').then(() => loadData());
                            }
                          }}
                          className="px-3 py-2 bg-green-600 text-white rounded"
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Transactions cards for small screens */}
        <div className="sm:hidden space-y-3 p-3">
          {filteredTransactions.map(tx => (
            <div key={tx.id} className="bg-white border rounded-lg p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{tx.bookTitle}</div>
                  <div className="text-xs text-gray-500 truncate">{tx.memberName}</div>
                  <div className="text-xs text-gray-500">Issue: {new Date(tx.issueDate).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">Due: {new Date(tx.dueDate).toLocaleDateString()}</div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                  tx.status === 'Issued' ? 'bg-yellow-100 text-yellow-800' :
                  tx.status === 'Returned' ? 'bg-green-100 text-green-800' :
                  tx.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tx.status}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setEditingMember(null);
                    setShowTransactionForm(true);
                    setTransactionForm({
                      bookId: '',
                      memberId: '',
                      issueDate: new Date().toISOString().split('T')[0],
                      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      notes: ''
                    });
                  }}
                  className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >Return/Update</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Library Reports</h2>
        <p className="text-gray-600">Generate library statistics and reports</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Books</p>
              <p className="text-2xl font-bold text-gray-900">{books.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Books Issued</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions.filter(t => t.status === 'Issued').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Books</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions.filter(t => t.status === 'Overdue').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Actions */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Book Inventory Report</p>
              <p className="text-sm text-gray-600">Export complete book list</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Member Report</p>
              <p className="text-sm text-gray-600">Export member details</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-5 h-5 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Transaction Report</p>
              <p className="text-sm text-gray-600">Export transaction history</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Library Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage library books, members, and transactions</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm hidden sm:inline">Refresh</span>
          </button>
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
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex gap-3 sm:gap-8 px-3 sm:px-6 overflow-x-auto no-scrollbar">
            {[
              { id: 'books', label: 'Books', icon: BookOpen },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'transactions', label: 'Transactions', icon: Calendar },
              { id: 'reports', label: 'Reports', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-none flex items-center gap-2 py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <tab.icon className="w-4 h-4" />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 sm:p-6">
          {activeTab === 'books' && renderBooksTab()}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'transactions' && renderTransactionsTab()}
          {activeTab === 'reports' && renderReportsTab()}
        </div>
      </div>

      {/* Floating FAB for mobile (quick add) */}
      <div className="fixed right-4 bottom-6 z-40 sm:hidden">
        {activeTab === 'books' && (
          <button onClick={() => { setShowBookForm(true); }} className="p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700" aria-label="Add book">
            <Plus className="w-5 h-5" />
          </button>
        )}
        {activeTab === 'members' && (
          <button onClick={() => { setShowMemberForm(true); }} className="p-4 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700" aria-label="Add member">
            <Plus className="w-5 h-5" />
          </button>
        )}
        {activeTab === 'transactions' && (
          <button onClick={() => { setShowTransactionForm(true); }} className="p-4 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700" aria-label="Issue book">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Book Form Modal (responsive: full-screen on mobile, centered on desktop) */}
      {showBookForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0">
          <div className="bg-white w-full h-full sm:h-auto sm:w-full sm:max-w-2xl overflow-y-auto sm:rounded-lg">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h3>
                <button
                  onClick={() => {
                    setShowBookForm(false);
                    setEditingBook(null);
                    setBookForm({
                      title: '',
                      author: '',
                      isbn: '',
                      category: 'Academic',
                      publisher: '',
                      publicationYear: new Date().getFullYear(),
                      edition: '',
                      pages: 0,
                      language: 'English',
                      description: '',
                      totalCopies: 1,
                      location: '',
                      shelfNumber: '',
                      price: 0,
                      purchaseDate: new Date().toISOString().split('T')[0],
                      tags: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded"
                  aria-label="Close add book"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleBookSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={bookForm.title}
                      onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                    <input
                      type="text"
                      value={bookForm.author}
                      onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ISBN *</label>
                    <input
                      type="text"
                      value={bookForm.isbn}
                      onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={bookForm.category}
                      onChange={(e) => setBookForm({...bookForm, category: e.target.value as LibraryBook['category']})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="Academic">Academic</option>
                      <option value="Fiction">Fiction</option>
                      <option value="Non-Fiction">Non-Fiction</option>
                      <option value="Reference">Reference</option>
                      <option value="Technical">Technical</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                    <input
                      type="text"
                      value={bookForm.publisher}
                      onChange={(e) => setBookForm({...bookForm, publisher: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year</label>
                    <input
                      type="number"
                      value={bookForm.publicationYear}
                      onChange={(e) => setBookForm({...bookForm, publicationYear: parseInt(e.target.value || '0')})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Edition</label>
                    <input
                      type="text"
                      value={bookForm.edition}
                      onChange={(e) => setBookForm({...bookForm, edition: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                    <input
                      type="number"
                      value={bookForm.pages}
                      onChange={(e) => setBookForm({...bookForm, pages: parseInt(e.target.value || '0')})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <input
                      type="text"
                      value={bookForm.language}
                      onChange={(e) => setBookForm({...bookForm, language: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Copies *</label>
                    <input
                      type="number"
                      value={bookForm.totalCopies}
                      onChange={(e) => setBookForm({...bookForm, totalCopies: Math.max(1, parseInt(e.target.value || '1'))})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={1}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={bookForm.location}
                      onChange={(e) => setBookForm({...bookForm, location: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Number</label>
                    <input
                      type="text"
                      value={bookForm.shelfNumber}
                      onChange={(e) => setBookForm({...bookForm, shelfNumber: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bookForm.price}
                      onChange={(e) => setBookForm({...bookForm, price: parseFloat(e.target.value || '0')})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={bookForm.purchaseDate}
                      onChange={(e) => setBookForm({...bookForm, purchaseDate: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={bookForm.description}
                    onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                    rows={3}
                    className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={bookForm.tags}
                    onChange={(e) => setBookForm({...bookForm, tags: e.target.value})}
                    placeholder="e.g., programming, algorithms, computer science"
                    className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookForm(false);
                      setEditingBook(null);
                      setBookForm({
                        title: '',
                        author: '',
                        isbn: '',
                        category: 'Academic',
                        publisher: '',
                        publicationYear: new Date().getFullYear(),
                        edition: '',
                        pages: 0,
                        language: 'English',
                        description: '',
                        totalCopies: 1,
                        location: '',
                        shelfNumber: '',
                        price: 0,
                        purchaseDate: new Date().toISOString().split('T')[0],
                        tags: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingBook ? 'Update Book' : 'Add Book'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Member Form Modal (responsive) */}
      {showMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0">
          <div className="bg-white w-full h-full sm:h-auto sm:w-full sm:max-w-2xl overflow-y-auto sm:rounded-lg">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </h3>
                <button
                  onClick={() => {
                    setShowMemberForm(false);
                    setEditingMember(null);
                    setMemberForm({
                      memberId: '',
                      name: '',
                      email: '',
                      phone: '',
                      role: 'student',
                      department: '',
                      year: '',
                      semester: '',
                      rollNumber: '',
                      address: '',
                      membershipType: 'Regular',
                      membershipStartDate: new Date().toISOString().split('T')[0],
                      membershipEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      maxBooksAllowed: 3,
                      status: 'Active'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleMemberSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member ID *</label>
                    <input
                      type="text"
                      value={memberForm.memberId}
                      onChange={(e) => setMemberForm({...memberForm, memberId: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({...memberForm, email: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm({...memberForm, phone: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      value={memberForm.role}
                      onChange={(e) => setMemberForm({...memberForm, role: e.target.value as LibraryMember['role']})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="staff">Staff</option>
                      <option value="external">External</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={memberForm.department}
                      onChange={(e) => setMemberForm({...memberForm, department: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="text"
                      value={memberForm.year}
                      onChange={(e) => setMemberForm({...memberForm, year: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <input
                      type="text"
                      value={memberForm.semester}
                      onChange={(e) => setMemberForm({...memberForm, semester: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={memberForm.rollNumber}
                      onChange={(e) => setMemberForm({...memberForm, rollNumber: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type *</label>
                    <select
                      value={memberForm.membershipType}
                      onChange={(e) => setMemberForm({...memberForm, membershipType: e.target.value as LibraryMember['membershipType']})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="Regular">Regular</option>
                      <option value="Premium">Premium</option>
                      <option value="Temporary">Temporary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Books Allowed *</label>
                    <input
                      type="number"
                      value={memberForm.maxBooksAllowed}
                      onChange={(e) => setMemberForm({...memberForm, maxBooksAllowed: Math.max(1, parseInt(e.target.value || '1'))})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={1}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={memberForm.status}
                      onChange={(e) => setMemberForm({...memberForm, status: e.target.value as LibraryMember['status']})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Membership Start Date *</label>
                    <input
                      type="date"
                      value={memberForm.membershipStartDate}
                      onChange={(e) => setMemberForm({...memberForm, membershipStartDate: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Membership End Date *</label>
                    <input
                      type="date"
                      value={memberForm.membershipEndDate}
                      onChange={(e) => setMemberForm({...memberForm, membershipEndDate: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    value={memberForm.address}
                    onChange={(e) => setMemberForm({...memberForm, address: e.target.value})}
                    rows={3}
                    className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMemberForm(false);
                      setEditingMember(null);
                      setMemberForm({
                        memberId: '',
                        name: '',
                        email: '',
                        phone: '',
                        role: 'student',
                        department: '',
                        year: '',
                        semester: '',
                        rollNumber: '',
                        address: '',
                        membershipType: 'Regular',
                        membershipStartDate: new Date().toISOString().split('T')[0],
                        membershipEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        maxBooksAllowed: 3,
                        status: 'Active'
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingMember ? 'Update Member' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Form Modal (responsive) */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0">
          <div className="bg-white w-full h-full sm:h-auto sm:w-full sm:max-w-2xl overflow-y-auto sm:rounded-lg">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Issue Book</h3>
                <button
                  onClick={() => {
                    setShowTransactionForm(false);
                    setTransactionForm({
                      bookId: '',
                      memberId: '',
                      issueDate: new Date().toISOString().split('T')[0],
                      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      notes: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Book *</label>
                    <select
                      value={transactionForm.bookId}
                      onChange={(e) => setTransactionForm({...transactionForm, bookId: e.target.value})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a book</option>
                      {books.filter(book => book.availableCopies > 0).map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} by {book.author} (Available: {book.availableCopies})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Member *</label>
                    <select
                      value={transactionForm.memberId}
                      onChange={(e) => setTransactionForm({...transactionForm, memberId: e.target.value})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a member</option>
                      {members.filter(member => member.status === 'Active' && (member.currentBooksIssued || 0) < (member.maxBooksAllowed || 3)).map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.memberId}) - {member.currentBooksIssued}/{member.maxBooksAllowed} books
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                    <input
                      type="date"
                      value={transactionForm.issueDate}
                      onChange={(e) => setTransactionForm({...transactionForm, issueDate: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      value={transactionForm.dueDate}
                      onChange={(e) => setTransactionForm({...transactionForm, dueDate: e.target.value})}
                      className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={transactionForm.notes}
                    onChange={(e) => setTransactionForm({...transactionForm, notes: e.target.value})}
                    rows={3}
                    className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional notes about this transaction..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransactionForm(false);
                      setTransactionForm({
                        bookId: '',
                        memberId: '',
                        issueDate: new Date().toISOString().split('T')[0],
                        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Issue Book
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

export default LibraryManagement;
