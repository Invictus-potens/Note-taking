'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import type { DropResult } from 'react-beautiful-dnd';

// Dynamic import for DragDropContext
const DragDropContext = dynamic(() => import('react-beautiful-dnd').then(mod => ({ default: mod.DragDropContext })), {
  ssr: false
});

interface DragDropWrapperProps {
  children: ReactNode;
  onDragEnd: (result: DropResult) => void;
}

const DragDropWrapper: React.FC<DragDropWrapperProps> = ({ children, onDragEnd }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
};

export default DragDropWrapper; 