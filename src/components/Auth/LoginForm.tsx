import React, { useState } from 'react';
import { LogIn, Smartphone, User, GraduationCap, Crown, Shield, Wrench, UserCheck, TestTube, Eye, Library, Bus, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAllDemoAccounts, setShowAllDemoAccounts] = useState(false);
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

  const handleDemoLogin = async (role: 'hod' | 'teacher' | 'student' | 'principal' | 'director' | 'registrar' | 'admin' | 'cleaner' | 'peon' | 'lab-assistant' | 'security' | 'library-staff' | 'driver') => {
    setError('');
    setSuccess('');

    const demoCredentials = {
      hod: { email: 'hodcse@gmail.com', password: 'hodcse2025@attendance' },
      teacher: { email: 'sarah.johnson@dypsn.edu', password: '9876543211' },
      student: { email: 'student.demo@dypsn.edu', password: '9876543210' },
      // Admin hierarchy: Principal > Director > Registrar > Admin
      principal: { email: 'principal@dypsn.edu', password: 'principal@2025' },
      director: { email: 'director@dypsn.edu', password: 'director@2025' },
      registrar: { email: 'registrar@dypsn.edu', password: 'registrar@2025' },
      admin: { email: 'admin@dypsn.edu', password: 'admin@2025' },
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

  // Professional button style - unified slate/gray theme
  const primaryBtnClass = "flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md";
  const secondaryBtnClass = "flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";
  const accentBtnClass = "flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">D</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 font-heading">DYPSN Portal</h2>
          <p className="text-slate-600 text-sm lg:text-base font-body">Digital Leave & Attendance System</p>

          {/* Mobile indicator */}
          <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-slate-500">
            <Smartphone className="w-4 h-4" />
            <span>Mobile Optimized</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  Students & Teachers: Use your phone number as password
                  <br />
                  <span className="text-blue-600">Format: 10-digit number (e.g., 9876543210)</span>
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full ${accentBtnClass}`}
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

        {/* Visitor Login */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-5">
            <button
              onClick={loginAsVisitor}
              disabled={isLoading}
              className={`w-full ${primaryBtnClass}`}
            >
              <User className="w-5 h-5" />
              <span>Continue as Visitor</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Access */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-5">
            <div className="text-center mb-4">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Quick Demo Access</h3>
              <p className="text-xs text-slate-500">Test the system with demo accounts</p>
            </div>

            {/* Primary Roles - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleDemoLogin('principal')}
                disabled={isLoading}
                className={secondaryBtnClass}
              >
                <Crown className="w-4 h-4 text-slate-600" />
                <span>Principal</span>
              </button>

              <button
                onClick={() => handleDemoLogin('hod')}
                disabled={isLoading}
                className={secondaryBtnClass}
              >
                <Shield className="w-4 h-4 text-slate-600" />
                <span>HOD</span>
              </button>

              <button
                onClick={() => handleDemoLogin('teacher')}
                disabled={isLoading}
                className={secondaryBtnClass}
              >
                <GraduationCap className="w-4 h-4 text-slate-600" />
                <span>Teacher</span>
              </button>

              <button
                onClick={() => handleDemoLogin('student')}
                disabled={isLoading}
                className={secondaryBtnClass}
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>Student</span>
              </button>
            </div>

            {/* Toggle for more accounts */}
            <button
              onClick={() => setShowAllDemoAccounts(!showAllDemoAccounts)}
              className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <span>{showAllDemoAccounts ? 'Show Less' : 'Show All Demo Accounts'}</span>
              {showAllDemoAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* All Demo Accounts - Collapsible */}
            {showAllDemoAccounts && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                {/* Admin Hierarchy */}
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Admin Hierarchy</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDemoLogin('director')}
                      disabled={isLoading}
                      className={secondaryBtnClass}
                    >
                      <Shield className="w-4 h-4 text-slate-500" />
                      <span>Director</span>
                    </button>

                    <button
                      onClick={() => handleDemoLogin('registrar')}
                      disabled={isLoading}
                      className={secondaryBtnClass}
                    >
                      <GraduationCap className="w-4 h-4 text-slate-500" />
                      <span>Registrar</span>
                    </button>

                    <button
                      onClick={() => handleDemoLogin('admin')}
                      disabled={isLoading}
                      className={secondaryBtnClass}
                    >
                      <Wrench className="w-4 h-4 text-slate-500" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>

                {/* Non-Teaching Staff */}
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Non-Teaching Staff</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDemoLogin('cleaner')}
                      disabled={isLoading}
                      className={secondaryBtnClass}
                    >
                      <Wrench className="w-4 h-4 text-slate-500" />
                      <span>Cleaner</span>
                    </button>

                    <button
                      onClick={() => handleDemoLogin('peon')}
                      disabled={isLoading}
                      className={secondaryBtnClass}
                    >
                      <UserCheck className="w-4 h-4 text-slate-500" />
                      <span>Peon</span>
                    </button>

                    <button
                      onClick={() => handleDemoLogin('lab-assistant')}
                      disabled={isLoading}
                      className={secondaryBtnClass}
                    >
                      <TestTube className="w-4 h-4 text-slate-500" />
                      <span>Lab Assistant</span>
                    </button>

                    <button
                      onClick={() => handleDemoLogin('security')}
                      disabled={isLoading}
                      className={secondaryBtnClass}
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>Security</span>
                    </button>

                    <button
                      onClick={() => handleDemoLogin('library-staff')}
                      disabled={isLoading}
                      className={secondaryBtnClass}
                    >
                      <Library className="w-4 h-4 text-slate-500" />
                      <span>Library Staff</span>
                    </button>

                    <button
                      onClick={() => handleDemoLogin('driver')}
                      disabled={isLoading}
                      className={secondaryBtnClass}
                    >
                      <Bus className="w-4 h-4 text-slate-500" />
                      <span>Driver</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 text-center">
                    <strong>Note:</strong> Demo accounts are for testing purposes only.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 space-y-1 pb-4">
          <p>© 2026 DYPSN. All rights reserved.</p>
          <p>
            Developed by{' '}
            <span className="font-medium text-slate-600">Team Chaos</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;