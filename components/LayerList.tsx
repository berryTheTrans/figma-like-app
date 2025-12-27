import React from 'react';
import { Layer } from '../types';
import { Box, Circle, Type, StickyNote, Layout } from 'lucide-react';

interface Props {
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const LayerList: React.FC<Props> = ({ layers, selectedId, onSelect }) => {
  const getIcon = (type: Layer['type']) => {
    switch (type) {
      case 'RECTANGLE': return <Box size={14} />;
      case 'CIRCLE': return <Circle size={14} />;
      case 'TEXT': return <Type size={14} />;
      case 'STICKY': return <StickyNote size={14} />;
      case 'FRAME': return <Layout size={14} />;
      default: return <Box size={14} />;
    }
  };

  return (
    <div className="w-56 bg-[#2C2C2C] border-r border-gray-700 h-[calc(100vh-48px)] flex flex-col">
      <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
        Layers
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {layers.slice().reverse().map((layer) => (
          <div
            key={layer.id}
            onClick={() => onSelect(layer.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-[#383838] transition-colors ${
              selectedId === layer.id ? 'bg-[#0D99FF] text-white hover:bg-[#0D99FF]' : 'text-gray-300'
            }`}
          >
            <span className="opacity-70">{getIcon(layer.type)}</span>
            <span className="truncate">{layer.name}</span>
          </div>
        ))}
        {layers.length === 0 && (
           <div className="text-center text-xs text-gray-500 mt-10 px-4">
              Canvas is empty. Add shapes or use AI to generate content.
           </div>
        )}
      </div>
    </div>
  );
};