import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertCircle,
  Calendar,
  FileText,
  Package,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const PeonPanel: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      type: 'delivery',
      description: 'Deliver documents to Principal Office',
      from: 'Admin Office',
      to: 'Principal Office',
      status: 'completed',
      priority: 'high',
      timeSlot: '09:00 - 09:30'
    },
    {
      id: 2,
      type: 'pickup',
      description: 'Collect exam papers from HOD office',
      from: 'HOD Office',
      to: 'Exam Cell',
      status: 'in-progress',
      priority: 'medium',
      timeSlot: '10:00 - 10:30'
    },
    {
      id: 3,
      type: 'delivery',
      description: 'Distribute notices to all departments',
      from: 'Admin Office',
      to: 'All Departments',
      status: 'pending',
      priority: 'low',
      timeSlot: '11:00 - 12:00'
    },
    {
      id: 4,
      type: 'pickup',
      description: 'Collect attendance sheets',
      from: 'Various Classrooms',
      to: 'Admin Office',
      status: 'pending',
      priority: 'medium',
      timeSlot: '14:00 - 15:00'
    }
  ]);

  const [messages, setMessages] = useState([
    { id: 1, from: 'Principal Office', message: 'Urgent: Please collect the signed documents', time: '09:15', read: false },
    { id: 2, from: 'HOD CSE', message: 'Exam papers ready for pickup', time: '10:30', read: true },
    { id: 3, from: 'Admin Office', message: 'New notices to be distributed', time: '11:45', read: false }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <ArrowRight className="w-4 h-4 text-green-600" />;
      case 'pickup': return <ArrowLeft className="w-4 h-4 text-blue-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const updateTaskStatus = (taskId: number, newStatus: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const markMessageAsRead = (messageId: number) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-100">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Peon Management</h1>
            <p className="text-gray-600">Manage deliveries, pickups, and office support tasks</p>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-gray-600" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Messages & Instructions</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Unread:</span>
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {messages.filter(m => !m.read).length}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                message.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}
              onClick={() => markMessageAsRead(message.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{message.from}</span>
                    <span className="text-sm text-gray-500">{message.time}</span>
                    {!message.read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-700">{message.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery & Pickup Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Today's Tasks</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter by:</span>
            <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
              <option value="all">All Tasks</option>
              <option value="delivery">Deliveries</option>
              <option value="pickup">Pickups</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getTaskTypeIcon(task.type)}
                    <span className="font-medium text-gray-900 capitalize">{task.type}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{task.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {task.from} → {task.to}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {task.timeSlot}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('-', ' ').toUpperCase()}
                  </span>
                  <div className="flex gap-1">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'in-progress')}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Start Task"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Complete Task"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Office Support Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Office Support Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Document Sorting</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Sort and organize incoming documents</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status: Pending</span>
              <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                Start
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Phone className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Phone Coverage</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Answer calls during lunch break</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status: In Progress</span>
              <button className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200 transition-colors">
                Complete
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">Supply Management</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Check and restock office supplies</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status: Completed</span>
              <button className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm cursor-not-allowed">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Checklist */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Daily Checklist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Morning Routine</h3>
            <div className="space-y-2">
              {[
                'Check message board',
                'Collect delivery tasks',
                'Sort incoming mail',
                'Prepare delivery bags',
                'Check office supplies'
              ].map((task, index) => (
                <label key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">{task}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Evening Routine</h3>
            <div className="space-y-2">
              {[
                'Complete all deliveries',
                'Update task status',
                'Clean work area',
                'Prepare for next day',
                'Submit daily report'
              ].map((task, index) => (
                <label key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">{task}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">New Task</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-gray-900">Report Issue</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Phone className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">Emergency Call</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900">Inventory Check</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PeonPanel;
