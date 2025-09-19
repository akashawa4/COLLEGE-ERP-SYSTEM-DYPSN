import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Book,
  Pen,
  Calculator,
  Ruler,
  Phone,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { listenStationaryItems, upsertStationaryItem, deleteStationaryItem } from '../../firebase/canteenStationary';

interface StationaryItem {
  id: string;
  name: string;
  description: string;
  category: 'Books' | 'Writing Materials' | 'Office Supplies' | 'Electronics' | 'Art Supplies' | 'Service' | 'Other';
  price: number;
  stockQuantity?: number;
  lastRestocked: string;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
  image?: string;
  specifications?: string;
  createdAt: string;
}

const StationaryManagement: React.FC = () => {
  const { user } = useAuth();
  const WHATSAPP_NUMBER = '+919421367600';
  const CALL_NUMBER = '+919421367600  ';
  const [items, setItems] = useState<StationaryItem[]>([]);

  const [activeTab, setActiveTab] = useState<'inventory'>('inventory');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StationaryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const isVisitor = user?.role === 'visitor';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Books' as StationaryItem['category'],
    price: '',
    stockQuantity: '',
    specifications: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = formData.stockQuantity === '' ? undefined : parseInt(formData.stockQuantity);
    const newItem: StationaryItem = {
      id: editingItem?.id || '',
      ...formData,
      price: parseFloat(formData.price),
      stockQuantity: qty,
      lastRestocked: editingItem?.lastRestocked || new Date().toISOString(),
      status: qty === undefined ? 'Available' : (qty === 0 ? 'Out of Stock' : (qty <= 5 ? 'Low Stock' : 'Available')),
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    if (editingItem) {
      await upsertStationaryItem(newItem);
    } else {
      await upsertStationaryItem(newItem);
    }

    setShowForm(false);
    setEditingItem(null);
    resetForm();
  };

  const handleEdit = (item: StationaryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price.toString(),
      stockQuantity: (item.stockQuantity ?? '').toString(),
      specifications: item.specifications || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteStationaryItem(id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Books',
      price: '',
      stockQuantity: '',
      specifications: ''
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: StationaryItem['status']) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: StationaryItem['category']) => {
    switch (category) {
      case 'Books': return 'bg-purple-100 text-purple-800';
      case 'Writing Materials': return 'bg-blue-100 text-blue-800';
      case 'Office Supplies': return 'bg-gray-100 text-gray-800';
      case 'Electronics': return 'bg-green-100 text-green-800';
      case 'Art Supplies': return 'bg-pink-100 text-pink-800';
      case 'Service': return 'bg-indigo-100 text-indigo-800';
      case 'Other': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: StationaryItem['category']) => {
    switch (category) {
      case 'Books': return <Book className="w-5 h-5" />;
      case 'Writing Materials': return <Pen className="w-5 h-5" />;
      case 'Office Supplies': return <Package className="w-5 h-5" />;
      case 'Electronics': return <Calculator className="w-5 h-5" />;
      case 'Art Supplies': return <Ruler className="w-5 h-5" />;
      case 'Service': return <Package className="w-5 h-5" />;
      case 'Other': return <Package className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  useEffect(() => {
    const unsub = listenStationaryItems((list) => {
      setItems(list as unknown as StationaryItem[]);
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isVisitor ? 'Stationary & Xerox Centre' : user?.role === 'student' ? 'Stationary & Xerox Centre' : 'Xerox/Stationary Centre'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isVisitor 
              ? 'Browse our stationery and printing services' 
              : user?.role === 'student' 
                ? 'Browse items and contact centre' 
                : 'Manage inventory'
            }
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <a
            href={`tel:${CALL_NUMBER}`}
            className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <Phone className="w-5 h-5" />
            <span className="hidden sm:inline">Call</span>
          </a>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'inventory' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inventory
          </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <>
          {/* Inventory Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
              <div className="flex flex-wrap gap-4 flex-1 w-full">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                >
                  <option value="all">All Categories</option>
                  <option value="Books">Books</option>
                  <option value="Writing Materials">Writing Materials</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Art Supplies">Art Supplies</option>
                  <option value="Service">Service</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                >
                  <option value="all">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              {user?.role !== 'student' && !isVisitor && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 sm:ml-4"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Item</span>
                </button>
              )}
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-400">
                      {getCategoryIcon(item.category)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  </div>
                  {user?.role !== 'student' && !isVisitor && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-green-600">₹{item.price}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className={`font-semibold ${
                      (item.stockQuantity ?? Infinity) === 0 ? 'text-red-600' :
                      (item.stockQuantity ?? Infinity) <= 5 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {item.stockQuantity ?? 'N/A'}{item.stockQuantity !== undefined ? ' units' : ''}
                    </span>
                  </div>
                  
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                {item.specifications && (
                  <div className="text-xs text-gray-500 mb-2">
                    <span className="font-medium">Specs:</span> {item.specifications}
                  </div>
                )}

                
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </>
      )}

      

      {/* Item Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as StationaryItem['category'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Books">Books</option>
                      <option value="Writing Materials">Writing Materials</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Art Supplies">Art Supplies</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity (optional)</label>
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specifications (Optional)</label>
                  <textarea
                    rows={2}
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    placeholder="e.g., Hardcover, 500 pages, Latest Edition"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
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

export default StationaryManagement;
