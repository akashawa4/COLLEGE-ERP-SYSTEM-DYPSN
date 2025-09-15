import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  ShoppingCart, 
  DollarSign, 
  Filter,
  Search,
  Printer,
  FileText,
  Book,
  Pen,
  Calculator,
  Ruler,
  Scissors,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface StationaryItem {
  id: string;
  name: string;
  description: string;
  category: 'Books' | 'Writing Materials' | 'Office Supplies' | 'Electronics' | 'Art Supplies' | 'Other';
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  supplier: string;
  supplierContact: string;
  lastRestocked: string;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
  image?: string;
  specifications?: string;
  createdAt: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Ready' | 'Completed' | 'Cancelled';
  orderDate: string;
  pickupDate?: string;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Online';
  specialInstructions?: string;
}

const StationaryManagement: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<StationaryItem[]>([
    {
      id: '1',
      name: 'Engineering Mathematics - Volume 1',
      description: 'Comprehensive mathematics textbook for engineering students',
      category: 'Books',
      price: 450,
      stockQuantity: 25,
      minStockLevel: 10,
      supplier: 'Academic Publishers',
      supplierContact: '+91 98765 43210',
      lastRestocked: '2024-03-01',
      status: 'Available',
      specifications: 'Hardcover, 500 pages, Latest Edition',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'Scientific Calculator',
      description: 'Advanced scientific calculator with 300+ functions',
      category: 'Electronics',
      price: 850,
      stockQuantity: 5,
      minStockLevel: 15,
      supplier: 'Tech Solutions',
      supplierContact: '+91 98765 43211',
      lastRestocked: '2024-02-15',
      status: 'Low Stock',
      specifications: 'Solar + Battery, LCD Display, Protective Case',
      createdAt: '2024-01-01'
    },
    {
      id: '3',
      name: 'A4 Notebook - 200 Pages',
      description: 'Spiral bound notebook with ruled pages',
      category: 'Writing Materials',
      price: 120,
      stockQuantity: 0,
      minStockLevel: 20,
      supplier: 'Paper Products Ltd',
      supplierContact: '+91 98765 43212',
      lastRestocked: '2024-01-20',
      status: 'Out of Stock',
      specifications: 'A4 Size, 200 Pages, Spiral Bound',
      createdAt: '2024-01-01'
    },
    {
      id: '4',
      name: 'Drawing Set',
      description: 'Complete drawing set with compass, protractor, and rulers',
      category: 'Art Supplies',
      price: 180,
      stockQuantity: 12,
      minStockLevel: 8,
      supplier: 'Art Supplies Co',
      supplierContact: '+91 98765 43213',
      lastRestocked: '2024-03-10',
      status: 'Available',
      specifications: 'Metal Compass, Plastic Protractor, Steel Rulers',
      createdAt: '2024-01-01'
    }
  ]);

  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      customerName: 'John Doe',
      customerEmail: 'john.doe@dypsn.edu',
      customerPhone: '+91 98765 43210',
      items: [
        { itemId: '1', itemName: 'Engineering Mathematics - Volume 1', quantity: 1, price: 450 },
        { itemId: '4', itemName: 'Drawing Set', quantity: 1, price: 180 }
      ],
      totalAmount: 630,
      status: 'Ready',
      orderDate: '2024-03-20T10:30:00',
      pickupDate: '2024-03-21T14:00:00',
      paymentMethod: 'Cash',
      specialInstructions: 'Please keep the books wrapped'
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@dypsn.edu',
      customerPhone: '+91 98765 43211',
      items: [
        { itemId: '2', itemName: 'Scientific Calculator', quantity: 1, price: 850 }
      ],
      totalAmount: 850,
      status: 'Processing',
      orderDate: '2024-03-20T11:15:00',
      paymentMethod: 'UPI'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StationaryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Books' as StationaryItem['category'],
    price: '',
    stockQuantity: '',
    minStockLevel: '',
    supplier: '',
    supplierContact: '',
    specifications: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StationaryItem = {
      id: editingItem?.id || Date.now().toString(),
      ...formData,
      price: parseFloat(formData.price),
      stockQuantity: parseInt(formData.stockQuantity),
      minStockLevel: parseInt(formData.minStockLevel),
      lastRestocked: editingItem?.lastRestocked || new Date().toISOString(),
      status: parseInt(formData.stockQuantity) === 0 ? 'Out of Stock' :
              parseInt(formData.stockQuantity) <= parseInt(formData.minStockLevel) ? 'Low Stock' : 'Available',
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    if (editingItem) {
      setItems(items.map(item => item.id === editingItem.id ? newItem : item));
    } else {
      setItems([...items, newItem]);
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
      stockQuantity: item.stockQuantity.toString(),
      minStockLevel: item.minStockLevel.toString(),
      supplier: item.supplier,
      supplierContact: item.supplierContact,
      specifications: item.specifications || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Books',
      price: '',
      stockQuantity: '',
      minStockLevel: '',
      supplier: '',
      supplierContact: '',
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

  const getOrderStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
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
      case 'Other': return <Package className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'student' ? 'Stationary & Xerox Centre' : 'Xerox/Stationary Centre'}
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'student' 
              ? 'Browse and order stationary items' 
              : 'Manage inventory and orders for stationary items'
            }
          </p>
        </div>
        <div className="flex space-x-2">
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
          {user?.role !== 'student' && (
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'orders' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Orders ({orders.length})
            </button>
          )}
        </div>
      </div>

      {activeTab === 'inventory' && (
        <>
          {/* Inventory Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="flex-1 min-w-64">
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="Books">Books</option>
                  <option value="Writing Materials">Writing Materials</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Art Supplies">Art Supplies</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              {user?.role !== 'student' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 ml-4"
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
                  {user?.role !== 'student' && (
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
                      item.stockQuantity === 0 ? 'text-red-600' :
                      item.stockQuantity <= item.minStockLevel ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {item.stockQuantity} units
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-2" />
                    Min Level: {item.minStockLevel}
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

                <div className="text-xs text-gray-500">
                  Supplier: {item.supplier}
                </div>
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

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600">{order.customerName} ({order.customerEmail})</p>
                  <p className="text-sm text-gray-600">{order.customerPhone}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-lg font-semibold text-green-600">₹{order.totalAmount}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.itemName} x {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Order Date:</span>
                  <p className="text-gray-600">{new Date(order.orderDate).toLocaleString()}</p>
                </div>
                {order.pickupDate && (
                  <div>
                    <span className="font-medium text-gray-700">Pickup Date:</span>
                    <p className="text-gray-600">{new Date(order.pickupDate).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Payment:</span>
                  <p className="text-gray-600">{order.paymentMethod}</p>
                </div>
              </div>

              {order.specialInstructions && (
                <div className="mb-4">
                  <span className="font-medium text-gray-700">Special Instructions:</span>
                  <p className="text-gray-600">{order.specialInstructions}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <select
                  value={order.status}
                  onChange={(e) => handleOrderStatusChange(order.id, e.target.value as Order['status'])}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Ready">Ready</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Complete
                  </button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">Orders will appear here when customers place them</p>
            </div>
          )}
        </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                    <input
                      type="number"
                      required
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input
                      type="text"
                      required
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Contact</label>
                    <input
                      type="tel"
                      required
                      value={formData.supplierContact}
                      onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
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
