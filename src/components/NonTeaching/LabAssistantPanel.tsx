import React, { useState } from 'react';
import { 
  Wrench, 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertCircle,
  Calendar,
  FileText,
  Shield,
  TestTube,
  Settings,
  AlertTriangle,
  CheckSquare
} from 'lucide-react';

const LabAssistantPanel: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [equipment, setEquipment] = useState([
    {
      id: 1,
      name: 'Microscope',
      lab: 'Physics Lab',
      status: 'working',
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-02-15',
      issues: []
    },
    {
      id: 2,
      name: 'Computer System',
      lab: 'Computer Lab 1',
      status: 'needs-repair',
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-02-10',
      issues: ['Keyboard not working', 'Slow performance']
    },
    {
      id: 3,
      name: 'Projector',
      lab: 'Chemistry Lab',
      status: 'maintenance',
      lastMaintenance: '2024-01-20',
      nextMaintenance: '2024-01-25',
      issues: ['Bulb needs replacement']
    },
    {
      id: 4,
      name: 'Electronic Balance',
      lab: 'Chemistry Lab',
      status: 'working',
      lastMaintenance: '2024-01-05',
      nextMaintenance: '2024-02-05',
      issues: []
    }
  ]);

  const [safetyChecks, setSafetyChecks] = useState([
    { id: 1, item: 'Fire extinguisher check', status: 'completed', date: '2024-01-20' },
    { id: 2, item: 'Emergency exit clear', status: 'completed', date: '2024-01-20' },
    { id: 3, item: 'First aid kit stocked', status: 'pending', date: null },
    { id: 4, item: 'Safety goggles available', status: 'completed', date: '2024-01-20' },
    { id: 5, item: 'Chemical storage check', status: 'pending', date: null },
    { id: 6, item: 'Lab ventilation check', status: 'completed', date: '2024-01-20' }
  ]);

  const [maintenanceTasks, setMaintenanceTasks] = useState([
    {
      id: 1,
      equipment: 'Computer System',
      task: 'Clean keyboard and mouse',
      priority: 'high',
      status: 'pending',
      dueDate: '2024-01-25'
    },
    {
      id: 2,
      equipment: 'Projector',
      task: 'Replace projector bulb',
      priority: 'medium',
      status: 'in-progress',
      dueDate: '2024-01-30'
    },
    {
      id: 3,
      equipment: 'Microscope',
      task: 'Calibrate lenses',
      priority: 'low',
      status: 'pending',
      dueDate: '2024-02-01'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800';
      case 'needs-repair': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateSafetyCheck = (checkId: number) => {
    setSafetyChecks(safetyChecks.map(check => 
      check.id === checkId 
        ? { ...check, status: 'completed', date: new Date().toISOString().split('T')[0] }
        : check
    ));
  };

  const updateMaintenanceTask = (taskId: number, newStatus: string) => {
    setMaintenanceTasks(maintenanceTasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-100">
            <Wrench className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lab Assistant Management</h1>
            <p className="text-gray-600">Manage lab equipment, safety checks, and maintenance tasks</p>
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

      {/* Equipment Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Equipment Status</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter by:</span>
            <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
              <option value="all">All Equipment</option>
              <option value="working">Working</option>
              <option value="needs-repair">Needs Repair</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {equipment.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <TestTube className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.lab}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Last Maintenance</span>
                  <span className="text-sm text-gray-900">{item.lastMaintenance}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Next Due</span>
                  <span className="text-sm text-gray-900">{item.nextMaintenance}</span>
                </div>

                {item.issues.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-red-600 font-medium">Issues:</span>
                    <ul className="text-xs text-red-600 mt-1">
                      {item.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Checklist */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Safety Checklist</h2>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">
              {safetyChecks.filter(c => c.status === 'completed').length}/{safetyChecks.length} Completed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safetyChecks.map((check) => (
            <div key={check.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateSafetyCheck(check.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    check.status === 'completed' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {check.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                </button>
                <div>
                  <span className="font-medium text-gray-900">{check.item}</span>
                  {check.date && (
                    <p className="text-xs text-gray-500">Completed: {check.date}</p>
                  )}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                {check.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Maintenance Tasks</h2>
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
          {maintenanceTasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">{task.equipment}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{task.task}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Due: {task.dueDate}
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
                        onClick={() => updateMaintenanceTask(task.id, 'in-progress')}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Start Task"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button
                        onClick={() => updateMaintenanceTask(task.id, 'completed')}
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

      {/* Lab Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Lab Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Daily Report</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Submit daily lab status report</p>
            <button className="w-full px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition-colors">
              Generate Report
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-900">Issue Report</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Report equipment issues</p>
            <button className="w-full px-3 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm hover:bg-orange-200 transition-colors">
              Report Issue
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckSquare className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Maintenance Log</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">View maintenance history</p>
            <button className="w-full px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200 transition-colors">
              View Log
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TestTube className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Add Equipment</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-gray-900">Emergency Alert</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">Schedule Maintenance</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Shield className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900">Safety Training</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabAssistantPanel;
