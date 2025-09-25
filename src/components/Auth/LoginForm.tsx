import React, { useState } from 'react';
import { LogIn, Smartphone, User, GraduationCap, Crown, Shield, Wrench, UserCheck, TestTube, Eye, Library, Bus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, loginAsVisitor, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await login(email, password);
      setSuccess('Login successful!');
    } catch (err: any) {
      // Provide more specific error messages
      if (err.message.includes('phone number')) {
        setError('Student account found but phone number is missing. Please contact administrator.');
      } else if (err.message.includes('Invalid password')) {
        setError('Invalid password. Please check your credentials.');
      } else if (err.message.includes('User not found')) {
        setError('User not found. Please check your email or contact administrator.');
      } else {
        setError(err.message || 'Invalid credentials. Please try again.');
      }
    }
  };

  const handleDemoLogin = async (role: 'hod' | 'teacher' | 'student' | 'admin' | 'cleaner' | 'peon' | 'lab-assistant' | 'security' | 'library-staff' | 'driver') => {
    setError('');
    setSuccess('');
    
    const demoCredentials = {
      hod: { email: 'hodcse@gmail.com', password: 'hodcse2025@attendance' },
      teacher: { email: 'sarah.johnson@dypsn.edu', password: '9876543211' },
      student: { email: 'student.demo@dypsn.edu', password: '9876543210' },
      admin: { email: 'admin@dypsn.edu', password: '9876543212' },
      cleaner: { email: 'cleaner.demo@dypsn.edu', password: '9876543213' },
      peon: { email: 'peon.demo@dypsn.edu', password: '9876543214' },
      'lab-assistant': { email: 'labassistant.demo@dypsn.edu', password: '9876543215' },
      security: { email: 'security.demo@dypsn.edu', password: '9876543216' },
      'library-staff': { email: 'library.demo@dypsn.edu', password: '9876543217' },
      driver: { email: 'driver@dypsn.edu', password: '9876543218' }
    };

    const credentials = demoCredentials[role];
    setEmail(credentials.email);
    setPassword(credentials.password);
    
    try {
      await login(credentials.email, credentials.password);
      setSuccess(`Demo ${role.toUpperCase()} login successful!`);
    } catch (err: any) {
      console.error(`Demo ${role} login error:`, err);
      setError(`Demo ${role} account not available. Please contact administrator.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-mobile">
            <span className="text-white font-bold text-3xl">D</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">DYPSN Portal</h2>
          <p className="text-gray-600 text-sm lg:text-base">Digital Leave & Attendance System</p>
          
          {/* Mobile indicator */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Smartphone className="w-4 h-4" />
            <span>Mobile Optimized</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-mobile-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label-mobile">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-mobile"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <div>
                <label className="label-mobile">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-mobile"
                  placeholder="Enter your password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Students & Teachers: Use your phone number as password
                  <br />
                  <span className="text-blue-600">Format: 10-digit number (e.g., 9876543210)</span>
                </p>
              </div>
              
              {error && (
                <div className="error-mobile">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="success-mobile">
                  <p className="text-sm">{success}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="btn-mobile w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Demo Login Section */}
        <div className="bg-white rounded-2xl shadow-mobile-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Or continue as</h3>
            </div>
            <button
              onClick={loginAsVisitor}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-lg hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              <User className="w-5 h-5" />
              <span>Login as Visitor</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Access */}
        <div className="bg-white rounded-2xl shadow-mobile-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Demo Access</h3>
              <p className="text-sm text-gray-600">Most commonly used demo accounts</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDemoLogin('admin')}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium rounded-lg hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>

              <button
                onClick={() => handleDemoLogin('hod')}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                <Crown className="w-4 h-4" />
                <span>HOD</span>
              </button>

              <button
                onClick={() => handleDemoLogin('teacher')}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Teacher</span>
              </button>

              <button
                onClick={() => handleDemoLogin('student')}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                <User className="w-4 h-4" />
                <span>Student</span>
              </button>
            </div>
          </div>
        </div>

        {/* All Demo Accounts Section */}
        <div className="bg-white rounded-2xl shadow-mobile-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Demo Accounts</h3>
              <p className="text-sm text-gray-600">Complete list of available demo accounts</p>
            </div>
            
            <div className="space-y-3">
              {/* Non-Teaching Staff Demo Buttons */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Non-Teaching Staff</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDemoLogin('cleaner')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium rounded-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Cleaner</span>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('peon')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Peon</span>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('lab-assistant')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    <TestTube className="w-4 h-4" />
                    <span>Lab Assistant</span>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('security')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Security</span>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('library-staff')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    <Library className="w-4 h-4" />
                    <span>Library Staff</span>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('driver')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    <Bus className="w-4 h-4" />
                    <span>Driver</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                <strong>Note:</strong> Demo accounts are for testing purposes only. 
                Some demo accounts may not be available if not set up in the system.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 space-y-2">
          <p>© 2025 DYPSN. All rights reserved.</p>
          <p>
            Developed by{' '}
            <span className="font-semibold text-blue-600">Team Chaos</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;