import React from 'react';
import { User, Phone, Mail, Hash, Users, Calendar, BookOpen, GraduationCap } from 'lucide-react';

interface StudentProfileProps {
  name: string;
  gender: string;
  mobile: string;
  email: string;
  roll: string;
  div: string;
  year: string;
  sem: string;
}

const StudentProfile: React.FC<StudentProfileProps> = (props) => {

  const profileFields = [
    { label: 'Student Name', value: props.name, icon: User, color: 'bg-slate-100 text-slate-600' },
    { label: 'Gender', value: props.gender, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Mobile No', value: props.mobile, icon: Phone, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'E-Mail ID', value: props.email, icon: Mail, color: 'bg-amber-50 text-amber-600' },
    { label: 'Roll Number', value: props.roll, icon: Hash, color: 'bg-purple-50 text-purple-600' },
    { label: 'Division', value: props.div, icon: Users, color: 'bg-sky-50 text-sky-600' },
    { label: 'Year', value: props.year, icon: Calendar, color: 'bg-rose-50 text-rose-600' },
    { label: 'Semester', value: props.sem, icon: BookOpen, color: 'bg-indigo-50 text-indigo-600' },
  ];

  return (
    <div className="space-y-5 px-4 lg:px-0 max-w-2xl mx-auto">
      {/* Header */}
      <div className="theme-page-header">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="theme-page-title">Student Profile</h1>
            <p className="text-sm text-gray-600 mt-1">View your academic information</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="theme-card overflow-hidden">
        <div className="theme-card-header bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {props.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{props.name}</h2>
              <p className="text-sm text-slate-500">Roll No: {props.roll}</p>
            </div>
          </div>
        </div>

        <div className="theme-card-body space-y-4">
          {profileFields.map((field, index) => {
            const Icon = field.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${field.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">{field.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{field.value || '—'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Card */}
      <div className="theme-info-box-blue p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium">Academic Information</p>
            <p className="text-xs mt-1">
              For any updates to your profile information, please contact the administration office.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile; 