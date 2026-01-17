import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { LostFoundItem } from '../../types';
import { lostFoundService } from '../../firebase/firestore';

const LostFoundManagement: React.FC<{ user: any }> = ({ user }) => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LostFoundItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: '',
    description: '',
    category: 'other' as const,
    foundBy: '',
    foundByPhone: '',
    foundByEmail: '',
    foundLocation: '',
    foundDate: new Date().toISOString().split('T')[0],
    foundTime: new Date().toTimeString().slice(0, 5),
    currentHolder: '',
    currentHolderPhone: '',
    currentHolderEmail: '',
    currentHolderRole: '',
    status: 'found' as const,
    notes: ''
  });

  // Check if user can perform CRUD operations
  const canManageItems = user?.role === 'admin' || user?.role === 'hod' || user?.role === 'teacher';

  // Load items from Firestore
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const itemsData = await lostFoundService.getAllLostFoundItems();
        setItems(itemsData);
        setFilteredItems(itemsData);
      } catch (error) {
        console.error('Error loading lost and found items:', error);
        setError('Failed to load lost and found items. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  // Filter items based on search and filters
  useEffect(() => {
    let filtered = items;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.foundBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.foundLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.currentHolder.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, statusFilter, categoryFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'found': return <Package className="w-4 h-4 text-blue-600" />;
      case 'claimed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'disposed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'found': return 'bg-blue-100 text-blue-800';
      case 'claimed': return 'bg-green-100 text-green-800';
      case 'disposed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electronics': return '📱';
      case 'clothing': return '👕';
      case 'books': return '📚';
      case 'accessories': return '🎒';
      case 'documents': return '📄';
      default: return '📦';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  // Handle add item
  const handleAddItem = async () => {
    if (!newItem.itemName || !newItem.foundBy || !newItem.foundLocation || !newItem.currentHolder || !newItem.currentHolderPhone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await lostFoundService.createLostFoundItem({
        ...newItem,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Reload items
      const itemsData = await lostFoundService.getAllLostFoundItems();
      setItems(itemsData);
      setFilteredItems(itemsData);

      // Reset form and close modal
      setNewItem({
        itemName: '',
        description: '',
        category: 'other',
        foundBy: '',
        foundByPhone: '',
        foundByEmail: '',
        foundLocation: '',
        foundDate: new Date().toISOString().split('T')[0],
        foundTime: new Date().toTimeString().slice(0, 5),
        currentHolder: '',
        currentHolderPhone: '',
        currentHolderEmail: '',
        currentHolderRole: '',
        status: 'found',
        notes: ''
      });
      setShowAddModal(false);

      alert('Lost and found item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit item
  const handleEditItem = async () => {
    if (!selectedItem || !selectedItem.id) return;

    try {
      setSaving(true);
      await lostFoundService.updateLostFoundItem(selectedItem.id, selectedItem);

      // Reload items
      const itemsData = await lostFoundService.getAllLostFoundItems();
      setItems(itemsData);
      setFilteredItems(itemsData);

      setShowEditModal(false);
      setSelectedItem(null);

      alert('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete item
  const handleDeleteItem = (item: LostFoundItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !itemToDelete.id) return;

    setIsDeleting(true);
    try {
      await lostFoundService.deleteLostFoundItem(itemToDelete.id);

      // Reload items
      const itemsData = await lostFoundService.getAllLostFoundItems();
      setItems(itemsData);
      setFilteredItems(itemsData);
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle claim item
  const handleClaimItem = async (item: LostFoundItem) => {
    const claimedBy = prompt('Enter your name:');
    const claimedByPhone = prompt('Enter your phone number:');

    if (!claimedBy || !claimedByPhone) return;

    try {
      setSaving(true);
      await lostFoundService.updateLostFoundItem(item.id, {
        status: 'claimed',
        claimedBy,
        claimedByPhone,
        claimedDate: new Date().toISOString()
      });

      // Reload items
      const itemsData = await lostFoundService.getAllLostFoundItems();
      setItems(itemsData);
      setFilteredItems(itemsData);

      alert('Item claimed successfully!');
    } catch (error) {
      console.error('Error claiming item:', error);
      alert('Error claiming item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Open modals
  const openEditModal = (item: LostFoundItem) => {
    setSelectedItem({ ...item });
    setShowEditModal(true);
  };

  const openViewModal = (item: LostFoundItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Lost and Found</h1>
          <p className="text-sm text-slate-500">Manage lost and found items</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </span>
          {canManageItems && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            <p className="text-slate-700">Loading items...</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="found">Found</option>
                  <option value="claimed">Claimed</option>
                  <option value="disposed">Disposed</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="books">Books</option>
                  <option value="accessories">Accessories</option>
                  <option value="documents">Documents</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center flex-1 min-w-0">
                <div className="text-2xl mr-3">{getCategoryIcon(item.category)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 break-words leading-tight">
                    {item.itemName}
                  </h3>
                  <p className="text-xs text-gray-500 break-words leading-tight mt-1">
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
                {canManageItems && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewModal(item);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(item);
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Item Information */}
            <div className="space-y-2">
              {/* Description */}
              <p className="text-sm text-gray-600 break-words line-clamp-2">
                {item.description}
              </p>

              {/* Found By */}
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="break-words">Found by: {item.foundBy}</span>
              </div>

              {/* Found Location */}
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="break-words">{item.foundLocation}</span>
              </div>

              {/* Found Date & Time */}
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{formatDate(item.foundDate)}</span>
                <Clock className="w-4 h-4 ml-2 mr-1 flex-shrink-0" />
                <span>{formatTime(item.foundTime)}</span>
              </div>

              {/* Current Holder */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600 flex-1 min-w-0">
                  <Package className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-words">Held by: {item.currentHolder}</span>
                </div>
                <a
                  href={`tel:${item.currentHolderPhone}`}
                  className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors flex-shrink-0 ml-2"
                  title="Call"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            {item.status === 'found' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleClaimItem(item)}
                  className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  Claim This Item
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No lost and found items available'
            }
          </p>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Lost and Found Item</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={newItem.itemName}
                    onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., iPhone 13, Black Jacket"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="books">Books</option>
                    <option value="accessories">Accessories</option>
                    <option value="documents">Documents</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the item in detail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Found By *</label>
                  <input
                    type="text"
                    value={newItem.foundBy}
                    onChange={(e) => setNewItem({ ...newItem, foundBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Name of person who found it"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Found By Phone</label>
                  <input
                    type="tel"
                    value={newItem.foundByPhone}
                    onChange={(e) => setNewItem({ ...newItem, foundByPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Found Location *</label>
                  <input
                    type="text"
                    value={newItem.foundLocation}
                    onChange={(e) => setNewItem({ ...newItem, foundLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Where was it found?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Found Date *</label>
                  <input
                    type="date"
                    value={newItem.foundDate}
                    onChange={(e) => setNewItem({ ...newItem, foundDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Found Time *</label>
                  <input
                    type="time"
                    value={newItem.foundTime}
                    onChange={(e) => setNewItem({ ...newItem, foundTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Holder *</label>
                  <input
                    type="text"
                    value={newItem.currentHolder}
                    onChange={(e) => setNewItem({ ...newItem, currentHolder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Who currently has the item?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Holder Phone *</label>
                  <input
                    type="tel"
                    value={newItem.currentHolderPhone}
                    onChange={(e) => setNewItem({ ...newItem, currentHolderPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number to contact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Holder Role</label>
                  <select
                    value={newItem.currentHolderRole}
                    onChange={(e) => setNewItem({ ...newItem, currentHolderRole: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="hod">HOD</option>
                    <option value="non-teaching">Non-Teaching Staff</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newItem.notes}
                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Lost and Found Item</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={selectedItem.itemName || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, itemName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., iPhone 13, Black Jacket"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedItem.category || 'other'}
                    onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="books">Books</option>
                    <option value="accessories">Accessories</option>
                    <option value="documents">Documents</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={selectedItem.description || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the item in detail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedItem.status || 'found'}
                    onChange={(e) => setSelectedItem({ ...selectedItem, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="found">Found</option>
                    <option value="claimed">Claimed</option>
                    <option value="disposed">Disposed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Holder *</label>
                  <input
                    type="text"
                    value={selectedItem.currentHolder || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, currentHolder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Who currently has the item?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Holder Phone *</label>
                  <input
                    type="tel"
                    value={selectedItem.currentHolderPhone || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, currentHolderPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number to contact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Holder Role</label>
                  <select
                    value={selectedItem.currentHolderRole || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, currentHolderRole: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="hod">HOD</option>
                    <option value="non-teaching">Non-Teaching Staff</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={selectedItem.notes || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditItem}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getCategoryIcon(selectedItem.category)}</div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedItem.itemName}</h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedItem.status)}`}>
                      {getStatusIcon(selectedItem.status)}
                      {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                    </span>
                  </div>
                </div>

                {selectedItem.description && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                    <p className="text-gray-600">{selectedItem.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Found Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>Found by: {selectedItem.foundBy}</span>
                      </div>
                      {selectedItem.foundByPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${selectedItem.foundByPhone}`} className="text-blue-600 hover:underline">
                            {selectedItem.foundByPhone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>Location: {selectedItem.foundLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Date: {formatDate(selectedItem.foundDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Time: {formatTime(selectedItem.foundTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Current Holder</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>Held by: {selectedItem.currentHolder}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${selectedItem.currentHolderPhone}`} className="text-green-600 hover:underline">
                          {selectedItem.currentHolderPhone}
                        </a>
                      </div>
                      {selectedItem.currentHolderEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a href={`mailto:${selectedItem.currentHolderEmail}`} className="text-blue-600 hover:underline">
                            {selectedItem.currentHolderEmail}
                          </a>
                        </div>
                      )}
                      {selectedItem.currentHolderRole && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>Role: {selectedItem.currentHolderRole}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedItem.claimedBy && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Claimed Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Claimed by: {selectedItem.claimedBy}</span>
                      </div>
                      {selectedItem.claimedByPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${selectedItem.claimedByPhone}`} className="text-blue-600 hover:underline">
                            {selectedItem.claimedByPhone}
                          </a>
                        </div>
                      )}
                      {selectedItem.claimedDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Claimed on: {formatDate(selectedItem.claimedDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedItem.notes && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                    <p className="text-gray-600 text-sm">{selectedItem.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedItem.status === 'found' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleClaimItem(selectedItem);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Claim This Item
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Delete Item</h2>
                </div>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isDeleting}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{itemToDelete.itemName}"</span>?
                </p>
                <p className="text-sm text-gray-500">
                  This action cannot be undone. The item will be permanently removed from the lost and found system.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
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

export default LostFoundManagement;
