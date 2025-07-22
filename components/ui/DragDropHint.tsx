'use client';

import { useState, useEffect } from 'react';

const DragDropHint: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show hint after 3 seconds if user hasn't dismissed it
    const timer = setTimeout(() => {
      const hasSeenHint = localStorage.getItem('drag-drop-hint-dismissed');
      if (!hasSeenHint) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const dismissHint = () => {
    setIsVisible(false);
    localStorage.setItem('drag-drop-hint-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm animate-pulse">
      <div className="flex items-start space-x-2">
        <i className="ri-drag-move-line text-lg mt-0.5"></i>
        <div className="flex-1">
          <p className="text-sm font-medium">Drag & Drop Tip</p>
          <p className="text-xs opacity-90 mt-1">
            Drag notes to any folder in the sidebar to organize them!
          </p>
        </div>
        <button
          onClick={dismissHint}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
  );
};

export default DragDropHint; 