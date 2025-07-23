'use client';

import { useSearchParams } from 'next/navigation';

export default function DebugPage() {
  const searchParams = useSearchParams();
  
  const allParams = {};
  searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Debug Page
          </h1>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Path:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'Loading...'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Search:</strong> {typeof window !== 'undefined' ? window.location.search : 'Loading...'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Hash:</strong> {typeof window !== 'undefined' ? window.location.hash : 'Loading...'}
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL Parameters:</p>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                {JSON.stringify(allParams, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 