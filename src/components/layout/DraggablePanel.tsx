import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { PanelId } from '../../types';
import { GripVertical } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DraggablePanelProps {
  id: PanelId;
  index: number;
  label: string;
  children: React.ReactNode;
  className?: string;
}

const ITEM_TYPE = 'WORKSPACE_PANEL';

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  index,
  label,
  children,
  className = '',
}) => {
  const { movePanel, layout } = useApp();
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (draggedItem: { id: PanelId; index: number }) => {
      if (draggedItem.index === index) return;
      // Perform reorder
      movePanel(draggedItem.index, index);
      draggedItem.index = index;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Attach drag and drop ref
  drop(preview(ref));

  return (
    <div
      ref={ref}
      data-panel-id={id}
      className={`relative flex flex-col h-full transition-all duration-150 ${className} ${
        isDragging ? 'opacity-40 scale-[0.99] ring-2 ring-indigo-500' : ''
      } ${isOver && canDrop ? 'ring-2 ring-indigo-400 bg-indigo-950/20' : ''}`}
    >
      {/* Drag Grip Handle on top if Edit handles enabled */}
      {layout.enableCustomUiHandles && (
        <div
          ref={drag as any}
          title={`Drag to reposition ${label}`}
          className="h-5 px-2 bg-slate-950/95 border-b border-indigo-900/50 flex items-center justify-between text-[10px] text-slate-400 hover:text-white cursor-grab active:cursor-grabbing select-none shrink-0 z-30"
        >
          <div className="flex items-center gap-1.5 font-mono">
            <GripVertical className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
          <span className="text-[9px] text-slate-600 font-mono">Slot {index + 1}</span>
        </div>
      )}

      {/* Main panel contents */}
      <div className="flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};
