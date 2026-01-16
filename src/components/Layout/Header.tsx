import React, { useState } from 'react';
import { Bell, Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
  onProfileClick?: () => void;
  notifications?: any[];
  showNotifications?: boolean;
  setShowNotifications?: (show: boolean) => void;
  isOnline?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onProfileClick,
  notifications = [],
  showNotifications = false,
  setShowNotifications = () => { },
  isOnline = true
}) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>

          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-lg font-bold text-slate-900">DYPSN</span>
          </div>
        </div>

        {/* Center section */}
        <div className="hidden lg:block flex-1 max-w-md mx-8" />

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Desktop offline indicator */}
          {!isOnline && (
            <div className="hidden lg:flex items-center">
              <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Offline
              </div>
            </div>
          )}

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-slate-800 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden lg:block text-sm font-medium text-slate-700 max-w-[120px] truncate">{user?.name}</span>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-40 animate-scale-in overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white font-semibold text-base shadow-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <p className="text-xs text-slate-600 capitalize font-medium mt-0.5">{user?.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        onProfileClick && onProfileClick();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-slate-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;