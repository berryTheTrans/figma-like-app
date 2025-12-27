import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { LayerList } from './components/LayerList';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Canvas } from './components/Canvas';
import { AIChat } from './components/AIChat';
import { ToolType, Layer, ViewPort, Point, HistoryStep, AppMode } from './types';

function App() {
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.SELECT);
  const [appMode, setAppMode] = useState<AppMode>(AppMode.DESIGN);
  
  // State
  const [layers, setLayers] = useState<Layer[]>([
    {
       id: '1',
       name: 'iPhone 14 Pro',
       type: 'FRAME',
       x: 100,
       y: 100,
       width: 393,
       height: 852,
       style: { fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 0, opacity: 1, cornerRadius: 40 }
    }
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewPort, setViewPort] = useState<ViewPort>({ x: 0, y: 0, zoom: 0.8 });
  const [isAiOpen, setIsAiOpen] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save state to history
  const saveToHistory = useCallback((newLayers: Layer[], newSelectedId: string | null) => {
    const newStep: HistoryStep = { layers: newLayers, selectedId: newSelectedId };
    
    // If we are in the middle of history, discard future
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newStep);
    
    // Limit history size
    if (newHistory.length > 50) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
     if (historyIndex > 0) {
        const prevStep = history[historyIndex - 1];
        setLayers(prevStep.layers);
        setSelectedId(prevStep.selectedId);
        setHistoryIndex(historyIndex - 1);
     }
  };

  const redo = () => {
     if (historyIndex < history.length - 1) {
        const nextStep = history[historyIndex + 1];
        setLayers(nextStep.layers);
        setSelectedId(nextStep.selectedId);
        setHistoryIndex(historyIndex + 1);
     }
  };

  // Helper to create IDs
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Keyboard Shortcuts
  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
           e.preventDefault();
           if (e.shiftKey) redo(); else undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
           e.preventDefault();
           redo();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
           if (selectedId) {
              const newLayers = layers.filter(l => l.id !== selectedId);
              setLayers(newLayers);
              setSelectedId(null);
              saveToHistory(newLayers, null);
           }
        }
        if (e.key === 'Escape') {
           setSelectedId(null);
           setCurrentTool(ToolType.SELECT);
        }
        // Tool shortcuts
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
           switch(e.key.toLowerCase()) {
              case 'v': setCurrentTool(ToolType.SELECT); break;
              case 'r': setCurrentTool(ToolType.RECTANGLE); break;
              case 'o': setCurrentTool(ToolType.CIRCLE); break;
              case 't': setCurrentTool(ToolType.TEXT); break;
              case 'f': setCurrentTool(ToolType.FRAME); break;
              case 'h': setCurrentTool(ToolType.HAND); break;
           }
        }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, layers, history, historyIndex]);


  const handleToolChange = (tool: ToolType) => {
     if (tool === ToolType.MAGIC) {
        setIsAiOpen(true);
        setCurrentTool(ToolType.SELECT);
     } else {
        setCurrentTool(tool);
        setSelectedId(null);
     }
  };

  const handleCanvasClick = (point: Point) => {
    let newLayer: Layer | null = null;
    const baseStyle = { fill: '#D9D9D9', stroke: '#000000', strokeWidth: 0, opacity: 1, cornerRadius: 0 };
    
    switch (currentTool) {
      case ToolType.FRAME:
         newLayer = {
            id: generateId(), name: 'Frame', type: 'FRAME',
            x: point.x, y: point.y, width: 300, height: 200,
            style: { ...baseStyle, fill: '#FFFFFF' }
         };
         break;
      case ToolType.RECTANGLE:
        newLayer = {
           id: generateId(), name: 'Rectangle', type: 'RECTANGLE',
           x: point.x, y: point.y, width: 100, height: 100,
           style: baseStyle
        };
        break;
      case ToolType.CIRCLE:
        newLayer = {
           id: generateId(), name: 'Ellipse', type: 'CIRCLE',
           x: point.x, y: point.y, width: 100, height: 100,
           style: { ...baseStyle, cornerRadius: 50 }
        };
        break;
      case ToolType.TEXT:
         newLayer = {
            id: generateId(), name: 'Text', type: 'TEXT',
            x: point.x, y: point.y, width: 100, height: 24,
            content: 'Type something...',
            style: { ...baseStyle, fill: '#000000', fontSize: 16, fontFamily: 'Inter', textAlign: 'left' }
         };
         break;
      case ToolType.STICKY:
         newLayer = {
            id: generateId(), name: 'Sticky', type: 'STICKY',
            x: point.x, y: point.y, width: 150, height: 150,
            content: 'Notes...',
            style: { ...baseStyle, fill: '#FFD700', cornerRadius: 4 }
         };
         break;
    }

    if (newLayer) {
       const updatedLayers = [...layers, newLayer];
       setLayers(updatedLayers);
       setSelectedId(newLayer.id);
       saveToHistory(updatedLayers, newLayer.id);
       setCurrentTool(ToolType.SELECT);
    }
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
     const newLayers = layers.map(l => l.id === id ? { ...l, ...updates } : l);
     setLayers(newLayers);
     // Optimization: Don't save dragging history on every frame, rely on mouseUp in Canvas to finalize history (not implemented here for simplicity, saving on every edit for now or just letting React state handle it until significant change). 
     // For a real app, 'drag end' triggers history push.
  };
  
  // Wrapper to save history on significant changes
  const updateLayerWithHistory = (id: string, updates: Partial<Layer>) => {
     updateLayer(id, updates);
     // Ideally we debounce this or check if it's a "final" action
  };

  const deleteLayer = (id: string) => {
     const newLayers = layers.filter(l => l.id !== id);
     setLayers(newLayers);
     if (selectedId === id) setSelectedId(null);
     saveToHistory(newLayers, null);
  };

  const handleExport = () => {
     const data = JSON.stringify(layers, null, 2);
     const blob = new Blob([data], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'design.json';
     a.click();
  };

  const handleAddAiLayer = (partial: Partial<Layer>) => {
     const newLayer: Layer = {
        id: generateId(),
        name: partial.name || 'AI Layer',
        type: partial.type || 'RECTANGLE',
        x: viewPort.x + (100 / viewPort.zoom), 
        y: viewPort.y + (100 / viewPort.zoom),
        width: partial.width || 100,
        height: partial.height || 100,
        content: partial.content,
        style: {
           fill: partial.style?.fill || '#D9D9D9',
           stroke: '#000000',
           strokeWidth: 0,
           opacity: 1,
           cornerRadius: partial.type === 'CIRCLE' ? 999 : 4,
           fontSize: 16,
           textAlign: 'center',
           fontFamily: 'Inter'
        }
     };
     const newLayers = [...layers, newLayer];
     setLayers(newLayers);
     setSelectedId(newLayer.id);
     saveToHistory(newLayers, newLayer.id);
  };

  const selectedLayer = layers.find(l => l.id === selectedId) || null;

  return (
    <div className="flex flex-col h-screen w-full bg-[#1E1E1E]">
      <Toolbar 
         currentTool={currentTool} 
         setTool={handleToolChange} 
         appMode={appMode}
         setAppMode={setAppMode}
         onExport={handleExport}
         onUndo={undo}
         onRedo={redo}
         canUndo={historyIndex > 0}
         canRedo={historyIndex < history.length - 1}
      />
      
      <div className="flex flex-1 overflow-hidden">
         <LayerList 
            layers={layers} 
            selectedId={selectedId} 
            onSelect={setSelectedId} 
         />
         
         <div className="flex-1 relative">
            <Canvas 
               layers={layers}
               viewPort={viewPort}
               setViewPort={setViewPort}
               selectedId={selectedId}
               onSelect={setSelectedId}
               onLayerUpdate={updateLayer}
               onCanvasClick={handleCanvasClick}
               currentTool={currentTool}
               appMode={appMode}
            />
            {isAiOpen && (
               <AIChat 
                  onClose={() => setIsAiOpen(false)} 
                  onAddLayer={handleAddAiLayer}
               />
            )}
         </div>

         <PropertiesPanel 
            selectedLayer={selectedLayer}
            updateLayer={updateLayerWithHistory}
            deleteLayer={deleteLayer}
            appMode={appMode}
         />
      </div>
    </div>
  );
}

export default App;