
'use client';

import { useState } from 'react';
import { Sun, Moon, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onToggleTheme?: () => void;
  isDark?: boolean;
}

export default function Header({ onToggleTheme, isDark }: HeaderProps) {
  const router = useRouter();

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
            onClick={() => router.push('/calendar')}
            className="w-8 h-8 flex items-center justify-center p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            title="Go to Calendar"
            aria-label="Go to Calendar"
          >
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 flex items-center justify-center p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
