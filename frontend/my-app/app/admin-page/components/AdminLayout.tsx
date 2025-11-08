'use client';

import React, { useState, useEffect } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
  currentUser: any;
}

const menuSections = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'users', label: 'Users Management', icon: '👥' },
  { id: 'files', label: 'File Explorer', icon: '📁' },
  { id: 'database', label: 'Database Tables', icon: '🗃️' },
  { id: 'reports', label: 'Reports & Analytics', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({ 
  children, 
  currentSection, 
  onSectionChange, 
  currentUser 
}: AdminLayoutProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('admin-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('admin-theme', newTheme);
  };

  return (
    <div data-theme={theme} className="admin-layout flex">
      {/* Sidebar */}
      <div className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
        {/* Logo & Header */}
        <div className="p-6 border-b border-base-300">
          <div className="flex items-center space-x-3">
            <img 
              src="logo-withoutbackground.png" 
              className="w-10 h-10" 
              alt="Admin Logo" 
            />
            <div>
              <h1 className="text-xl font-bold text-base-content">KapryGest</h1>
              <p className="text-sm text-base-content/70">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center space-x-3">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-10">
                <span className="text-sm">
                  {currentUser?.name?.charAt(0) || 'A'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-base-content truncate">
                {currentUser?.name || 'Admin'}
              </p>
              <p className="text-xs text-base-content/70 truncate">
                {currentUser?.email || 'admin@kaprygest.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto sidebar-scrollbar">
          <ul className="space-y-2">
            {menuSections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => onSectionChange(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                    currentSection === section.id
                      ? 'bg-primary text-primary-content shadow-lg'
                      : 'text-base-content hover:bg-base-300 hover:text-base-content'
                  }`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-medium">{section.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Theme Toggle & Footer */}
        <div className="p-4 border-t border-base-300 space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
            <span className="text-sm text-base-content">Theme</span>
            <label className="swap swap-rotate">
              <input 
                type="checkbox" 
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              {/* Sun icon for light mode */}
              <div className="swap-on">🌙</div>
              {/* Moon icon for dark mode */}
              <div className="swap-off">☀️</div>
            </label>
          </div>

          {/* Logout Button */}
          <button 
            onClick={() => window.location.href = '/logout'}
            className="w-full btn btn-outline btn-error btn-sm"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}