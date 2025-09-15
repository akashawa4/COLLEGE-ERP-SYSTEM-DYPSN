import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertCircle,
  Calendar,
  FileText,
  Camera,
  Users,
  Phone,
  Eye,
  AlertTriangle
} from 'lucide-react';

const SecurityPanel: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [securityLogs, setSecurityLogs] = useState([
    {
      id: 1,
      time: '08:30',
      location: 'Main Gate',
      activity: 'Visitor Entry',
      details: 'Mr. John Smith - Meeting with Principal',
      status: 'normal'
    },
    {
      id: 2,
      time: '09:15',
      location: 'Parking Area',
      activity: 'Vehicle Check',
      details: 'Unauthorized vehicle found',
      status: 'warning'
    },
    {
      id: 3,
      time: '10:45',
      location: 'Library',
      activity: 'Patrol',
      details: 'Routine security check completed',
      status: 'normal'
    },
    {
      id: 4,
      time: '12:30',
      location: 'Canteen',
      activity: 'Incident',
      details: 'Minor altercation between students',
      status: 'incident'
    }
  ]);

  const [incidents, setIncidents] = useState([
    {
      id: 1,
      type: 'Unauthorized Access',
      location: 'Computer Lab 2',
      time: '14:30',
      severity: 'medium',
      status: 'investigating',
      description: 'Student found in lab after hours'
    },
    {
      id: 2,
      type: 'Property Damage',
      location: 'Parking Area',
      time: '16:45',
      severity: 'low',
      status: 'resolved',
      description: 'Scratches on car door'
    }
  ]);

  const [patrolSchedule, setPatrolSchedule] = useState([
    { id: 1, location: 'Main Gate', time: '08:00', status: 'completed' },
    { id: 2, location: 'Library', time: '09:00', status: 'completed' },
    { id: 3, location: 'Canteen', time: '10:00', status: 'in-progress' },
    { id: 4, location: 'Parking Area', time: '11:00', status: 'pending' },
    { id: 5, location: 'Sports Complex', time: '12:00', status: 'pending' }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'incident': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'investigating': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updatePatrolStatus = (patrolId: number, newStatus: string) => {
    setPatrolSchedule(patrolSchedule.map(patrol => 
      patrol.id === patrolId ? { ...patrol, status: newStatus } : patrol
    ));
  };

  const addSecurityLog = () => {
    const newLog = {
      id: securityLogs.length + 1,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      location: 'Current Location',
      activity: 'Manual Entry',
      details: 'Security log entry',
      status: 'normal'
    };
    setSecurityLogs([newLog, ...securityLogs]);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-100">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security Management</h1>
            <p className="text-gray-600">Monitor security, manage incidents, and maintain safety</p>
          </div>
        </div>
      </div>

      {/* Security Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Security Status</p>
              <p className="text-2xl font-bold text-green-600">SECURE</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Active Cameras</p>
              <p className="text-2xl font-bold text-blue-600">24/7</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-500">On Duty</p>
              <p className="text-2xl font-bold text-purple-600">3</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">Active Incidents</p>
              <p className="text-2xl font-bold text-orange-600">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Security Logs</h2>
          <button
            onClick={addSecurityLog}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Log Entry
          </button>
        </div>

        <div className="space-y-3">
          {securityLogs.map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{log.time}</span>
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{log.location}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">{log.activity}</p>
                  <p className="text-gray-600 text-sm">{log.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patrol Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Patrol Schedule</h2>
        <div className="space-y-3">
          {patrolSchedule.map((patrol) => (
            <div key={patrol.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="font-medium text-gray-900">{patrol.location}</span>
                  <p className="text-sm text-gray-500">Scheduled: {patrol.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(patrol.status)}`}>
                  {patrol.status.replace('-', ' ').toUpperCase()}
                </span>
                <div className="flex gap-1">
                  {patrol.status === 'pending' && (
                    <button
                      onClick={() => updatePatrolStatus(patrol.id, 'in-progress')}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Start Patrol"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {patrol.status === 'in-progress' && (
                    <button
                      onClick={() => updatePatrolStatus(patrol.id, 'completed')}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Complete Patrol"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incidents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Incident Reports</h2>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Report Incident
          </button>
        </div>

        <div className="space-y-4">
          {incidents.map((incident) => (
            <div key={incident.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-gray-900">{incident.type}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                      {incident.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                      {incident.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{incident.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {incident.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {incident.time}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Emergency Contacts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Phone className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-900">Police</span>
            </div>
            <p className="text-2xl font-bold text-red-600">100</p>
            <p className="text-sm text-gray-500">Emergency Line</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Phone className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-900">Fire Department</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">101</p>
            <p className="text-sm text-gray-500">Fire Emergency</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Phone className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Medical</span>
            </div>
            <p className="text-2xl font-bold text-green-600">108</p>
            <p className="text-sm text-gray-500">Ambulance</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Camera className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">View Cameras</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-gray-900">Emergency Alert</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Eye className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">Visitor Check</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900">Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel;
