import React, { useState, useEffect, useCallback } from 'react';
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
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Book,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  Eye,
  EyeOff,
  Download,
  Upload,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { libraryBookService, libraryMemberService, libraryTransactionService } from '../../firebase/firestore';
import { LibraryBook, LibraryMember, LibraryTransaction } from '../../types';

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
    let filtered = books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.isbn.includes(searchTerm);
      const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
    setFilteredBooks(filtered);
  };

  const filterMembers = () => {
    let filtered = members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.memberId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = memberStatusFilter === 'all' || member.status === memberStatusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredMembers(filtered);
  };

  const filterTransactions = () => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.memberName.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Render functions
  const renderBooksTab = () => (
    <div className="space-y-6">
      {/* Books Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Library Books</h2>
          <p className="text-gray-600">Manage library book collection</p>
        </div>
        <button
          onClick={() => setShowBookForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Book
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search books by title, author, or ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <div key={book.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{book.title}</h3>
                <p className="text-sm text-gray-600 mb-1">by {book.author}</p>
                <p className="text-xs text-gray-500">ISBN: {book.isbn}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                book.status === 'Available' ? 'bg-green-100 text-green-800' :
                book.status === 'Issued' ? 'bg-yellow-100 text-yellow-800' :
                book.status === 'Reserved' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {book.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{book.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available:</span>
                <span className="font-medium">{book.availableCopies}/{book.totalCopies}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{book.shelfNumber}</span>
              </div>
            </div>

            <div className="flex gap-2">
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
                    location: book.location,
                    shelfNumber: book.shelfNumber,
                    price: book.price,
                    purchaseDate: book.purchaseDate,
                    tags: book.tags.join(', ')
                  });
                  setShowBookForm(true);
                }}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => libraryBookService.deleteBook(book.id).then(() => loadData())}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Library Members</h2>
          <p className="text-gray-600">Manage library membership</p>
        </div>
        <button
          onClick={() => setShowMemberForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search members by name, email, or member ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={memberStatusFilter}
            onChange={(e) => setMemberStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
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
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete member ${member.name}?`)) {
                            libraryMemberService.deleteMember(member.id).then(() => loadData());
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTransactionsTab = () => (
    <div className="space-y-6">
      {/* Transactions Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Book Transactions</h2>
          <p className="text-gray-600">Manage book issues and returns</p>
        </div>
        <button
          onClick={() => setShowTransactionForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Issue Book
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions by book title or member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={transactionStatusFilter}
            onChange={(e) => setTransactionStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Issued">Issued</option>
            <option value="Returned">Returned</option>
            <option value="Overdue">Overdue</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
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
                          className="text-green-600 hover:text-green-900"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Book Inventory Report</p>
              <p className="text-sm text-gray-600">Export complete book list</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Member Report</p>
              <p className="text-sm text-gray-600">Export member details</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
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
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Library Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage library books, members, and transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
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
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'books', label: 'Books', icon: BookOpen },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'transactions', label: 'Transactions', icon: Calendar },
              { id: 'reports', label: 'Reports', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'books' && renderBooksTab()}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'transactions' && renderTransactionsTab()}
          {activeTab === 'reports' && renderReportsTab()}
        </div>
      </div>

      {/* Book Form Modal */}
      {showBookForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleBookSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={bookForm.title}
                      onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                    <input
                      type="text"
                      value={bookForm.author}
                      onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ISBN *</label>
                    <input
                      type="text"
                      value={bookForm.isbn}
                      onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={bookForm.category}
                      onChange={(e) => setBookForm({...bookForm, category: e.target.value as LibraryBook['category']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year</label>
                    <input
                      type="number"
                      value={bookForm.publicationYear}
                      onChange={(e) => setBookForm({...bookForm, publicationYear: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Edition</label>
                    <input
                      type="text"
                      value={bookForm.edition}
                      onChange={(e) => setBookForm({...bookForm, edition: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                    <input
                      type="number"
                      value={bookForm.pages}
                      onChange={(e) => setBookForm({...bookForm, pages: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <input
                      type="text"
                      value={bookForm.language}
                      onChange={(e) => setBookForm({...bookForm, language: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Copies *</label>
                    <input
                      type="number"
                      value={bookForm.totalCopies}
                      onChange={(e) => setBookForm({...bookForm, totalCopies: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={bookForm.location}
                      onChange={(e) => setBookForm({...bookForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Number</label>
                    <input
                      type="text"
                      value={bookForm.shelfNumber}
                      onChange={(e) => setBookForm({...bookForm, shelfNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bookForm.price}
                      onChange={(e) => setBookForm({...bookForm, price: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={bookForm.purchaseDate}
                      onChange={(e) => setBookForm({...bookForm, purchaseDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={bookForm.description}
                    onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={bookForm.tags}
                    onChange={(e) => setBookForm({...bookForm, tags: e.target.value})}
                    placeholder="e.g., programming, algorithms, computer science"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Member Form Modal */}
      {showMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleMemberSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member ID *</label>
                    <input
                      type="text"
                      value={memberForm.memberId}
                      onChange={(e) => setMemberForm({...memberForm, memberId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({...memberForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm({...memberForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      value={memberForm.role}
                      onChange={(e) => setMemberForm({...memberForm, role: e.target.value as LibraryMember['role']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="text"
                      value={memberForm.year}
                      onChange={(e) => setMemberForm({...memberForm, year: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <input
                      type="text"
                      value={memberForm.semester}
                      onChange={(e) => setMemberForm({...memberForm, semester: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={memberForm.rollNumber}
                      onChange={(e) => setMemberForm({...memberForm, rollNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type *</label>
                    <select
                      value={memberForm.membershipType}
                      onChange={(e) => setMemberForm({...memberForm, membershipType: e.target.value as LibraryMember['membershipType']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      onChange={(e) => setMemberForm({...memberForm, maxBooksAllowed: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={memberForm.status}
                      onChange={(e) => setMemberForm({...memberForm, status: e.target.value as LibraryMember['status']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Membership End Date *</label>
                    <input
                      type="date"
                      value={memberForm.membershipEndDate}
                      onChange={(e) => setMemberForm({...memberForm, membershipEndDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Book *</label>
                    <select
                      value={transactionForm.bookId}
                      onChange={(e) => setTransactionForm({...transactionForm, bookId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a member</option>
                      {members.filter(member => member.status === 'Active' && member.currentBooksIssued < member.maxBooksAllowed).map((member) => (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      value={transactionForm.dueDate}
                      onChange={(e) => setTransactionForm({...transactionForm, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
