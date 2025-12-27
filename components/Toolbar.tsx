import React from 'react';
import { 
  MousePointer2, 
  Square, 
  Circle, 
  Type, 
  StickyNote, 
  Hand, 
  Sparkles,
  Share2,
  Layout,
  Cable
} from 'lucide-react';
import { ToolType, AppMode } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (t: ToolType) => void;
  appMode: AppMode;
  setAppMode: (m: AppMode) => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  currentTool, setTool, appMode, setAppMode, onExport, onUndo, onRedo, canUndo, canRedo 
}) => {
  const tools = [
    { type: ToolType.SELECT, icon: MousePointer2, label: 'Move (V)' },
    { type: ToolType.FRAME, icon: Layout, label: 'Frame (F)' },
    { type: ToolType.RECTANGLE, icon: Square, label: 'Rectangle (R)' },
    { type: ToolType.CIRCLE, icon: Circle, label: 'Circle (O)' },
    { type: ToolType.TEXT, icon: Type, label: 'Text (T)' },
    { type: ToolType.STICKY, icon: StickyNote, label: 'Sticky (S)' },
    { type: ToolType.HAND, icon: Hand, label: 'Hand (H)' },
  ];

  return (
    <div className="h-12 bg-[#2C2C2C] text-white flex items-center justify-between px-4 border-b border-black select-none z-50">
      <div className="flex items-center gap-4">
         <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center font-bold shadow-lg">
            F
         </div>
         
         {/* Tools - Only visible in Design Mode */}
         {appMode === AppMode.DESIGN && (
           <div className="flex items-center gap-1">
              {tools.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => setTool(tool.type)}
                  className={`p-1.5 rounded-md transition-all ${
                    currentTool === tool.type ? 'bg-[#0D99FF] text-white shadow-sm' : 'text-gray-400 hover:bg-[#444] hover:text-white'
                  }`}
                  title={tool.label}
                >
                  <tool.icon size={18} />
                </button>
              ))}
              <div className="w-px h-6 bg-gray-600 mx-2" />
               <button
                onClick={() => setTool(ToolType.MAGIC)}
                className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${
                   currentTool === ToolType.MAGIC ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-[#444]'
                }`}
                title="AI Generation"
             >
                <Sparkles size={18} />
             </button>
           </div>
         )}
      </div>

      {/* Mode Switcher */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bg-[#383838] p-1 rounded-lg flex gap-1">
         <button 
          onClick={() => setAppMode(AppMode.DESIGN)}
          className={`px-4 py-1 rounded text-xs font-medium transition-all ${appMode === AppMode.DESIGN ? 'bg-[#555] text-white shadow' : 'text-gray-400 hover:text-white'}`}
         >
           Design
         </button>
         <button 
          onClick={() => setAppMode(AppMode.PROTOTYPE)}
          className={`px-4 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${appMode === AppMode.PROTOTYPE ? 'bg-[#555] text-white shadow' : 'text-gray-400 hover:text-white'}`}
         >
           <Cable size={12} /> Prototype
         </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-[#383838] rounded-md overflow-hidden">
           <button onClick={onUndo} disabled={!canUndo} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 hover:bg-[#444]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
           </button>
           <button onClick={onRedo} disabled={!canRedo} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 hover:bg-[#444]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" transform="scale(-1, 1)"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
           </button>
        </div>
        
        <button 
          onClick={onExport}
          className="bg-[#0D99FF] hover:bg-[#007ACC] px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors text-white shadow-sm"
        >
          <Share2 size={14} />
          Export
        </button>
      </div>
    </div>
  );
};