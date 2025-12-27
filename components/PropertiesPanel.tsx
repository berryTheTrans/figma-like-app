import React, { useState } from 'react';
import { Layer, AppMode } from '../types';
import { 
  Code, Lock, Unlock, Trash2, 
  AlignLeft, AlignCenter, AlignRight, 
  Type, Layers, Move, Palette, Box, Cable 
} from 'lucide-react';

interface Props {
  selectedLayer: Layer | null;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  appMode: AppMode;
}

export const PropertiesPanel: React.FC<Props> = ({ selectedLayer, updateLayer, deleteLayer, appMode }) => {
  const [activeTab, setActiveTab] = useState<'DESIGN' | 'DEV'>('DESIGN');

  if (!selectedLayer) {
    return (
      <div className="w-64 bg-[#2C2C2C] border-l border-black h-[calc(100vh-48px)] flex flex-col items-center justify-center text-gray-500 text-sm">
        <p>No layer selected</p>
      </div>
    );
  }

  // --- Prototype Mode Panel ---
  if (appMode === AppMode.PROTOTYPE) {
    return (
       <div className="w-72 bg-[#2C2C2C] border-l border-black h-[calc(100vh-48px)] flex flex-col text-white overflow-y-auto">
          <div className="p-4 border-b border-black">
             <h2 className="font-bold text-sm flex items-center gap-2"><Cable size={14}/> Prototype Interactions</h2>
          </div>
          <div className="p-4 space-y-4">
             <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase">Interaction</label>
                {selectedLayer.prototype ? (
                   <div className="bg-[#383838] p-3 rounded text-xs space-y-2">
                      <div className="flex justify-between">
                         <span className="text-gray-400">Target</span>
                         <span>{selectedLayer.prototype.targetId.substring(0,8)}...</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-gray-400">Trigger</span>
                         <select 
                            value={selectedLayer.prototype.trigger}
                            onChange={(e) => updateLayer(selectedLayer.id, { prototype: { ...selectedLayer.prototype!, trigger: e.target.value as any } })}
                            className="bg-[#222] rounded p-1"
                         >
                            <option value="ON_CLICK">On Click</option>
                            <option value="ON_HOVER">On Hover</option>
                         </select>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-gray-400">Animation</span>
                         <select 
                            value={selectedLayer.prototype.animation}
                            onChange={(e) => updateLayer(selectedLayer.id, { prototype: { ...selectedLayer.prototype!, animation: e.target.value as any } })}
                            className="bg-[#222] rounded p-1"
                         >
                            <option value="INSTANT">Instant</option>
                            <option value="DISSOLVE">Dissolve</option>
                            <option value="SLIDE">Slide</option>
                         </select>
                      </div>
                      <button 
                        onClick={() => updateLayer(selectedLayer.id, { prototype: undefined })}
                        className="w-full text-center text-red-400 hover:text-red-300 pt-2 border-t border-gray-600 mt-2"
                      >
                         Remove Interaction
                      </button>
                   </div>
                ) : (
                   <div className="text-gray-500 text-xs italic">
                      Drag the blue connector handle on the canvas to link this layer to another frame.
                   </div>
                )}
             </div>
          </div>
       </div>
    )
  }

  const updateStyle = (key: string, value: any) => {
    updateLayer(selectedLayer.id, {
      style: { ...selectedLayer.style, [key]: value }
    });
  };

  const updateLayout = (key: string, value: any) => {
    const currentLayout = selectedLayer.layout || { 
      isAutoLayout: false, 
      direction: 'row', 
      gap: 10, 
      padding: 10,
      alignItems: 'flex-start',
      justifyContent: 'flex-start'
    };
    updateLayer(selectedLayer.id, {
      layout: { ...currentLayout, [key]: value }
    });
  };

  const generateCSS = () => {
    const s = selectedLayer.style;
    const l = selectedLayer.layout;
    
    // Build Shadow String
    const shadow = s.effects?.find(e => e.type === 'DROP_SHADOW' && e.visible);
    const shadowCSS = shadow ? `box-shadow: ${shadow.offset?.x}px ${shadow.offset?.y}px ${shadow.blur}px ${shadow.color || 'rgba(0,0,0,0.25)'};` : '';

    return `
/* ${selectedLayer.name} */
.element {
  position: absolute;
  width: ${selectedLayer.width}px;
  height: ${selectedLayer.height}px;
  left: ${selectedLayer.x}px;
  top: ${selectedLayer.y}px;
  background-color: ${s.fill};
  border: ${s.strokeWidth}px solid ${s.stroke};
  border-radius: ${s.cornerRadius}px;
  opacity: ${s.opacity};
  ${shadowCSS}
  ${selectedLayer.type === 'TEXT' ? `
  font-family: ${s.fontFamily};
  font-size: ${s.fontSize}px;
  font-weight: ${s.fontWeight};
  text-align: ${s.textAlign};
  color: ${s.stroke === 'transparent' ? s.fill : s.stroke};
  ` : ''}
  ${l?.isAutoLayout ? `
  display: flex;
  flex-direction: ${l.direction};
  gap: ${l.gap}px;
  padding: ${l.padding}px;
  align-items: ${l.alignItems};
  justify-content: ${l.justifyContent};
  ` : ''}
}
    `.trim();
  };

  const NumberInput = ({ label, value, onChange, className = "" }: any) => (
     <div className={`flex items-center gap-2 bg-[#383838] p-1.5 rounded hover:border-gray-500 border border-transparent group ${className}`}>
        <span className="text-gray-400 text-xs w-4 group-hover:text-white cursor-ew-resize select-none">{label}</span>
        <input 
           type="number" 
           value={Math.round(value)} 
           onChange={(e) => onChange(Number(e.target.value))}
           className="bg-transparent w-full text-xs focus:outline-none text-right"
        />
     </div>
  );

  return (
    <div className="w-72 bg-[#2C2C2C] border-l border-black h-[calc(100vh-48px)] flex flex-col text-white overflow-y-auto">
      {/* Tabs */}
      <div className="flex border-b border-black">
        <button 
          onClick={() => setActiveTab('DESIGN')}
          className={`flex-1 py-3 text-xs font-semibold ${activeTab === 'DESIGN' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
        >
          Design
        </button>
        <button 
          onClick={() => setActiveTab('DEV')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 ${activeTab === 'DEV' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}
        >
          <Code size={12} /> Dev Mode
        </button>
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'DESIGN' ? (
          <>
            {/* Header / Meta */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2 text-gray-300">
                    <Box size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">{selectedLayer.type}</span>
                 </div>
                <button onClick={() => deleteLayer(selectedLayer.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              
              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="X" value={selectedLayer.x} onChange={(v: number) => updateLayer(selectedLayer.id, { x: v })} />
                <NumberInput label="Y" value={selectedLayer.y} onChange={(v: number) => updateLayer(selectedLayer.id, { y: v })} />
                <NumberInput label="W" value={selectedLayer.width} onChange={(v: number) => updateLayer(selectedLayer.id, { width: v })} />
                <NumberInput label="H" value={selectedLayer.height} onChange={(v: number) => updateLayer(selectedLayer.id, { height: v })} />
                <NumberInput label="R" value={selectedLayer.style.cornerRadius} onChange={(v: number) => updateStyle('cornerRadius', v)} />
                <NumberInput label="∠" value={0} onChange={() => {}} /> 
              </div>
            </div>

            <hr className="border-gray-700" />

            {/* Auto Layout */}
             <div className="space-y-3">
              <div className="flex justify-between items-center group">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-2"><Layers size={12}/> Auto Layout</label>
                <button 
                   onClick={() => updateLayout('isAutoLayout', !selectedLayer.layout?.isAutoLayout)}
                   className="text-gray-400 hover:text-white"
                >
                   {selectedLayer.layout?.isAutoLayout ? <span className="text-xs text-white bg-blue-600 px-1 rounded">-</span> : <span className="text-xs text-white px-1 hover:bg-white/10 rounded">+</span>}
                </button>
              </div>
              {selectedLayer.layout?.isAutoLayout && (
                <div className="grid grid-cols-2 gap-2 bg-[#333] p-2 rounded">
                   <div className="col-span-2 flex gap-1">
                      <button onClick={() => updateLayout('direction', 'column')} className={`p-1 rounded ${selectedLayer.layout.direction === 'column' ? 'bg-black' : ''}`}>↓</button>
                      <button onClick={() => updateLayout('direction', 'row')} className={`p-1 rounded ${selectedLayer.layout.direction === 'row' ? 'bg-black' : ''}`}>→</button>
                   </div>
                   <NumberInput label="Gap" value={selectedLayer.layout.gap} onChange={(v: number) => updateLayout('gap', v)} />
                   <NumberInput label="Pad" value={selectedLayer.layout.padding} onChange={(v: number) => updateLayout('padding', v)} />
                </div>
              )}
            </div>

            <hr className="border-gray-700" />

            {/* Text Properties */}
            {(selectedLayer.type === 'TEXT' || selectedLayer.type === 'STICKY') && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-2"><Type size={12}/> Typography</label>
                <textarea 
                  value={selectedLayer.content || ''}
                  onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#444] text-xs p-2 rounded focus:outline-none focus:border-blue-500 resize-none h-16"
                  placeholder="Content..."
                />
                 {selectedLayer.type === 'TEXT' && (
                  <div className="grid grid-cols-2 gap-2">
                     <select 
                        className="col-span-2 bg-[#383838] text-xs p-1.5 rounded focus:outline-none"
                        value={selectedLayer.style.fontFamily}
                        onChange={(e) => updateStyle('fontFamily', e.target.value)}
                     >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                     </select>
                     <select 
                        className="bg-[#383838] text-xs p-1.5 rounded focus:outline-none"
                        value={selectedLayer.style.fontWeight}
                        onChange={(e) => updateStyle('fontWeight', e.target.value)}
                     >
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="700">Bold</option>
                        <option value="900">Black</option>
                     </select>
                     <NumberInput label="Sz" value={selectedLayer.style.fontSize} onChange={(v: number) => updateStyle('fontSize', v)} />
                     
                     <div className="flex bg-[#383838] rounded col-span-2">
                        <button onClick={() => updateStyle('textAlign', 'left')} className={`flex-1 flex justify-center items-center p-1.5 rounded ${selectedLayer.style.textAlign === 'left' ? 'bg-[#555] text-white' : 'text-gray-400'}`}><AlignLeft size={12}/></button>
                        <button onClick={() => updateStyle('textAlign', 'center')} className={`flex-1 flex justify-center items-center p-1.5 rounded ${selectedLayer.style.textAlign === 'center' ? 'bg-[#555] text-white' : 'text-gray-400'}`}><AlignCenter size={12}/></button>
                        <button onClick={() => updateStyle('textAlign', 'right')} className={`flex-1 flex justify-center items-center p-1.5 rounded ${selectedLayer.style.textAlign === 'right' ? 'bg-[#555] text-white' : 'text-gray-400'}`}><AlignRight size={12}/></button>
                     </div>
                  </div>
                 )}
              </div>
            )}

            {/* Fill & Stroke */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2"><Palette size={12}/> Fill</label>
              <div className="flex items-center gap-2 p-1 hover:bg-[#383838] rounded group">
                  <div className="w-4 h-4 rounded border border-gray-600 shadow-sm" style={{ backgroundColor: selectedLayer.style.fill }} />
                  <input 
                    type="text" 
                    value={selectedLayer.style.fill} 
                    onChange={(e) => updateStyle('fill', e.target.value)}
                    className="flex-1 bg-transparent text-xs focus:outline-none uppercase"
                  />
                  <span className="text-xs text-gray-500 group-hover:hidden">100%</span>
                  <input 
                      type="number"
                      value={Math.round(selectedLayer.style.opacity * 100)}
                      onChange={(e) => updateStyle('opacity', Number(e.target.value) / 100)}
                      className="w-10 bg-[#222] text-xs p-1 rounded hidden group-hover:block"
                   />
              </div>

              <label className="text-xs font-bold text-gray-400 flex items-center gap-2 mt-2">Stroke</label>
              <div className="flex items-center gap-2 p-1 hover:bg-[#383838] rounded">
                  <div className="w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: selectedLayer.style.stroke === 'transparent' ? '#333' : selectedLayer.style.stroke }} />
                  <input 
                    type="text" 
                    value={selectedLayer.style.stroke} 
                    onChange={(e) => updateStyle('stroke', e.target.value)}
                    className="flex-1 bg-transparent text-xs focus:outline-none uppercase"
                  />
                  <NumberInput label="px" value={selectedLayer.style.strokeWidth} onChange={(v: number) => updateStyle('strokeWidth', v)} className="w-16" />
              </div>
            </div>

            {/* Effects */}
            <div className="space-y-3">
               <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400">Effects</label>
                  <button 
                     onClick={() => {
                        const effects = selectedLayer.style.effects || [];
                        updateStyle('effects', [...effects, { type: 'DROP_SHADOW', visible: true, color: '#000000', blur: 4, offset: {x:0, y:4} }])
                     }}
                     className="text-gray-400 hover:text-white"
                  >
                     +
                  </button>
               </div>
               {selectedLayer.style.effects?.map((effect, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-[#333] rounded text-xs">
                     <span className="flex-1 text-gray-300">Drop Shadow</span>
                     <button onClick={() => {
                        const newEffects = [...selectedLayer.style.effects!];
                        newEffects.splice(idx, 1);
                        updateStyle('effects', newEffects);
                     }}><Trash2 size={12} className="text-gray-500 hover:text-red-400"/></button>
                  </div>
               ))}
            </div>

          </>
        ) : (
          <div className="space-y-4">
             <div className="bg-[#1E1E1E] p-3 rounded border border-gray-800 font-mono text-[10px] leading-relaxed text-green-400 overflow-x-auto whitespace-pre selection:bg-green-900">
               {generateCSS()}
             </div>
             <p className="text-xs text-gray-500">
               Copy this CSS to your clipboard. Use variables for colors and font families in production.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};