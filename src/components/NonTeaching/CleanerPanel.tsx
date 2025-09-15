import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertCircle,
  Calendar,
  FileText,
  Wrench,
  Trash2,
  Droplets
} from 'lucide-react';

const CleanerPanel: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      area: 'Main Building - Ground Floor',
      task: 'Sweep and mop corridors',
      status: 'completed',
      timeSlot: '08:00 - 10:00',
      priority: 'high'
    },
    {
      id: 2,
      area: 'Computer Lab 1',
      task: 'Clean desks and equipment',
      status: 'in-progress',
      timeSlot: '10:00 - 11:00',
      priority: 'medium'
    },
    {
      id: 3,
      area: 'Staff Room',
      task: 'Empty trash bins',
      status: 'pending',
      timeSlot: '11:00 - 12:00',
      priority: 'low'
    },
    {
      id: 4,
      area: 'Library',
      task: 'Vacuum carpeted areas',
      status: 'pending',
      timeSlot: '14:00 - 15:00',
      priority: 'medium'
    }
  ]);

  const [equipment, setEquipment] = useState([
    { id: 1, name: 'Vacuum Cleaner', status: 'working', lastMaintenance: '2024-01-15' },
    { id: 2, name: 'Mop Bucket Set', status: 'working', lastMaintenance: '2024-01-10' },
    { id: 3, name: 'Floor Polisher', status: 'needs-repair', lastMaintenance: '2023-12-20' },
    { id: 4, name: 'Cleaning Cart', status: 'working', lastMaintenance: '2024-01-05' }
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

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800';
      case 'needs-repair': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateTaskStatus = (taskId: number, newStatus: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cleaning Management</h1>
            <p className="text-gray-600">Manage cleaning tasks and equipment</p>
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

      {/* Cleaning Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Today's Cleaning Tasks</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter by:</span>
            <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{task.area}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{task.task}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
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

      {/* Equipment Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Equipment Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {equipment.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Wrench className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">{item.name}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEquipmentStatusColor(item.status)}`}>
                    {item.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Last Maintenance</span>
                  <span className="text-sm text-gray-900">{item.lastMaintenance}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cleaning Checklist */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Daily Cleaning Checklist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Morning Tasks</h3>
            <div className="space-y-2">
              {[
                'Sweep all corridors',
                'Mop main entrance',
                'Clean restrooms',
                'Empty trash bins',
                'Dust furniture'
              ].map((task, index) => (
                <label key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">{task}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Evening Tasks</h3>
            <div className="space-y-2">
              {[
                'Deep clean classrooms',
                'Sanitize door handles',
                'Clean windows',
                'Restock supplies',
                'Final inspection'
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Report Issue</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-gray-900">Request Supplies</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Droplets className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">Special Cleaning</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CleanerPanel;
