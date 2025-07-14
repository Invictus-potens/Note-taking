'use client';

import { useState } from 'react';
import Button from '../ui/Button';

interface HeaderProps {
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
}

export default function Header({ user, onLogout, onToggleTheme, isDark }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-pacifico">
            NotesApp
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 flex items-center justify-center p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <i className={`${isDark ? 'ri-sun-line' : 'ri-moon-line'} text-lg text-gray-600 dark:text-gray-300`}></i>
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <i className="ri-arrow-down-s-line text-gray-600 dark:text-gray-300"></i>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onLogout?.();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <i className="ri-logout-circle-line mr-2"></i>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button variant="primary" size="sm">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}