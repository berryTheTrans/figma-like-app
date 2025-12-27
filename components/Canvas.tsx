import React, { useRef, useState, useEffect } from 'react';
import { Layer, Point, ViewPort, ToolType, Collaborator, AppMode } from '../types';

interface Props {
  layers: Layer[];
  viewPort: ViewPort;
  setViewPort: (vp: ViewPort) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onCanvasClick: (point: Point) => void; 
  currentTool: ToolType;
  appMode: AppMode;
}

export const Canvas: React.FC<Props> = ({ 
  layers, viewPort, setViewPort, selectedId, onSelect, onLayerUpdate, onCanvasClick, currentTool, appMode
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [dragState, setDragState] = useState<{
    mode: 'MOVE' | 'RESIZE' | 'PAN' | 'CONNECTION' | 'NONE';
    startPoint: Point; // Screen coords
    startLayerState?: { x: number; y: number; w: number; h: number };
    resizeHandle?: string; // 'nw', 'se', etc.
  }>({ mode: 'NONE', startPoint: {x:0,y:0} });

  // Add key listener for spacebar panning
  useEffect(() => {
     const down = (e: KeyboardEvent) => { if (e.code === 'Space') document.body.style.cursor = 'grab'; };
     const up = (e: KeyboardEvent) => { if (e.code === 'Space') document.body.style.cursor = 'default'; };
     window.addEventListener('keydown', down);
     window.addEventListener('keyup', up);
     return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const getMousePos = (e: React.MouseEvent | MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - viewPort.x) / viewPort.zoom,
      y: (e.clientY - rect.top - viewPort.y) / viewPort.zoom
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const isSpacePressed = e.button === 1 || currentTool === ToolType.HAND; 

    if (isSpacePressed) {
      setDragState({ mode: 'PAN', startPoint: { x: e.clientX, y: e.clientY } });
      return;
    }

    // Creating shapes
    if (currentTool !== ToolType.SELECT) {
       onCanvasClick(getMousePos(e));
       return;
    }

    // If clicking blank space
    if (e.target === svgRef.current) {
       onSelect(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState.mode === 'PAN') {
      const dx = e.clientX - dragState.startPoint.x;
      const dy = e.clientY - dragState.startPoint.y;
      setViewPort({ ...viewPort, x: viewPort.x + dx, y: viewPort.y + dy });
      setDragState({ ...dragState, startPoint: { x: e.clientX, y: e.clientY } });
      return;
    }

    if (dragState.mode === 'MOVE' && selectedId && dragState.startLayerState) {
       const currentPos = getMousePos(e);
       // Calculate delta in world coordinates
       // We need to compare current screen pos with start screen pos, then divide by zoom
       const screenDx = e.clientX - dragState.startPoint.x;
       const screenDy = e.clientY - dragState.startPoint.y;
       
       onLayerUpdate(selectedId, {
          x: dragState.startLayerState.x + (screenDx / viewPort.zoom),
          y: dragState.startLayerState.y + (screenDy / viewPort.zoom)
       });
    }

    if (dragState.mode === 'RESIZE' && selectedId && dragState.startLayerState && dragState.resizeHandle) {
       const screenDx = (e.clientX - dragState.startPoint.x) / viewPort.zoom;
       const screenDy = (e.clientY - dragState.startPoint.y) / viewPort.zoom;
       
       const { x, y, w, h } = dragState.startLayerState;
       let newX = x, newY = y, newW = w, newH = h;

       if (dragState.resizeHandle.includes('e')) newW = Math.max(1, w + screenDx);
       if (dragState.resizeHandle.includes('s')) newH = Math.max(1, h + screenDy);
       if (dragState.resizeHandle.includes('w')) {
          newW = Math.max(1, w - screenDx);
          newX = x + screenDx;
       }
       if (dragState.resizeHandle.includes('n')) {
          newH = Math.max(1, h - screenDy);
          newY = y + screenDy;
       }

       onLayerUpdate(selectedId, { x: newX, y: newY, width: newW, height: newH });
    }
    
    // Prototype connection dragging
    if (dragState.mode === 'CONNECTION' && selectedId) {
        // Redraw temporary line (handled by React state re-render if we stored the temp point, 
        // but for perf we might skip heavy state updates. 
        // For now, we rely on the final drop).
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragState.mode === 'CONNECTION' && selectedId) {
       // Hit test for target
       // Simple check: iterate layers and see if mouse is inside
       const mouse = getMousePos(e);
       const target = layers.find(l => 
          l.id !== selectedId && 
          mouse.x >= l.x && mouse.x <= l.x + l.width &&
          mouse.y >= l.y && mouse.y <= l.y + l.height
       );
       if (target) {
          onLayerUpdate(selectedId, { 
             prototype: { targetId: target.id, trigger: 'ON_CLICK', animation: 'INSTANT' } 
          });
       }
    }

    setDragState({ mode: 'NONE', startPoint: {x:0,y:0} });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
       e.preventDefault();
       const zoomFactor = -e.deltaY * 0.001;
       const newZoom = Math.max(0.1, Math.min(10, viewPort.zoom + zoomFactor));
       
       // Zoom towards mouse pointer logic could go here
       // For now, center zoom
       setViewPort({ ...viewPort, zoom: newZoom });
    } else {
       setViewPort({ ...viewPort, x: viewPort.x - e.deltaX, y: viewPort.y - e.deltaY });
    }
  };

  // Render individual layer
  const renderLayer = (layer: Layer) => {
     const isSelected = selectedId === layer.id;
     
     // Effects
     const filterId = `filter-${layer.id}`;
     const hasShadow = layer.style.effects?.some(e => e.type === 'DROP_SHADOW' && e.visible);

     const style: React.CSSProperties = {
        fill: layer.style.fill,
        stroke: layer.style.stroke,
        strokeWidth: layer.style.strokeWidth,
        opacity: layer.style.opacity,
        pointerEvents: 'all',
        filter: hasShadow ? `url(#${filterId})` : undefined
     };

     const onMouseDown = (e: React.MouseEvent) => {
        if (currentTool === ToolType.SELECT) {
           e.stopPropagation();
           onSelect(layer.id);
           setDragState({ 
              mode: 'MOVE', 
              startPoint: { x: e.clientX, y: e.clientY },
              startLayerState: { x: layer.x, y: layer.y, w: layer.width, h: layer.height }
           });
        }
     };

     let content;
     if (layer.type === 'TEXT') {
        content = (
           <text
              x={layer.x}
              y={layer.y + layer.style.fontSize!}
              style={{
                 ...style,
                 fontSize: layer.style.fontSize,
                 fontFamily: layer.style.fontFamily,
                 fontWeight: layer.style.fontWeight,
                 fill: layer.style.fill, // Text fill is main color
                 stroke: 'none',
                 userSelect: 'none'
              }}
           >
              {layer.content}
           </text>
        );
     } else if (layer.type === 'CIRCLE') {
         content = <ellipse cx={layer.x + layer.width/2} cy={layer.y + layer.height/2} rx={layer.width/2} ry={layer.height/2} style={style} />;
     } else {
         content = <rect x={layer.x} y={layer.y} width={layer.width} height={layer.height} rx={layer.style.cornerRadius} style={style} />;
     }

     return (
        <g key={layer.id} onMouseDown={onMouseDown}>
           {hasShadow && (
              <defs>
                 <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
                 </filter>
              </defs>
           )}
           {content}
           {/* Layer Label if Frame */}
           {layer.type === 'FRAME' && (
              <text x={layer.x} y={layer.y - 8} fontSize="10" fill="#888" fontFamily="Inter">{layer.name}</text>
           )}
        </g>
     );
  };

  // Render Selection Controls
  const renderSelection = () => {
     if (!selectedId) return null;
     const layer = layers.find(l => l.id === selectedId);
     if (!layer) return null;

     const margin = 0;
     const x = layer.x - margin;
     const y = layer.y - margin;
     const w = layer.width + margin*2;
     const h = layer.height + margin*2;
     
     const handleSize = 8 / viewPort.zoom; 
     const strokeWidth = 1.5 / viewPort.zoom;

     // Handles: nw, ne, se, sw
     const handles = [
        { id: 'nw', cx: x, cy: y },
        { id: 'ne', cx: x + w, cy: y },
        { id: 'se', cx: x + w, cy: y + h },
        { id: 'sw', cx: x, cy: y + h },
     ];

     const onHandleDown = (id: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        setDragState({
           mode: 'RESIZE',
           resizeHandle: id,
           startPoint: { x: e.clientX, y: e.clientY },
           startLayerState: { x: layer.x, y: layer.y, w: layer.width, h: layer.height }
        });
     };

     return (
        <g pointerEvents="none">
           {/* Bounding Box */}
           <rect 
              x={x} y={y} width={w} height={h} 
              fill="none" stroke="#0D99FF" strokeWidth={strokeWidth} 
           />
           
           {/* Resize Handles (Design Mode Only) */}
           {appMode === AppMode.DESIGN && handles.map(h => (
              <rect
                 key={h.id}
                 x={h.cx - handleSize/2}
                 y={h.cy - handleSize/2}
                 width={handleSize}
                 height={handleSize}
                 fill="white"
                 stroke="#0D99FF"
                 strokeWidth={strokeWidth}
                 pointerEvents="all"
                 onMouseDown={onHandleDown(h.id)}
                 style={{ cursor: `${h.id}-resize` }}
              />
           ))}

           {/* Prototype Connector (Prototype Mode Only) */}
           {appMode === AppMode.PROTOTYPE && (
              <circle
                 cx={x + w}
                 cy={y + h/2}
                 r={6 / viewPort.zoom}
                 fill="white"
                 stroke="#0D99FF"
                 strokeWidth={2 / viewPort.zoom}
                 pointerEvents="all"
                 cursor="crosshair"
                 onMouseDown={(e) => {
                    e.stopPropagation();
                    setDragState({
                       mode: 'CONNECTION',
                       startPoint: { x: e.clientX, y: e.clientY } // Not used for logic, just flag
                    });
                 }}
              />
           )}
        </g>
     );
  };

  // Render Connections
  const renderConnections = () => {
     if (appMode !== AppMode.PROTOTYPE) return null;
     
     return layers.filter(l => l.prototype).map(l => {
        const target = layers.find(t => t.id === l.prototype!.targetId);
        if (!target) return null;

        const startX = l.x + l.width;
        const startY = l.y + l.height / 2;
        const endX = target.x;
        const endY = target.y + target.height / 2;

        return (
           <path 
              key={`conn-${l.id}`}
              d={`M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`}
              fill="none"
              stroke="#0D99FF"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
           />
        );
     });
  };

  return (
    <div className="flex-1 bg-[#1E1E1E] relative overflow-hidden cursor-default">
      <svg
        ref={svgRef}
        className="w-full h-full block touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
         <defs>
            <pattern id="grid" width={100 * viewPort.zoom} height={100 * viewPort.zoom} patternUnits="userSpaceOnUse">
               <path d={`M ${100 * viewPort.zoom} 0 L 0 0 0 ${100 * viewPort.zoom}`} fill="none" stroke="#333" strokeWidth="1"/>
            </pattern>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#0D99FF" />
            </marker>
         </defs>
         
         {/* Background */}
         <rect width="100%" height="100%" fill="#1E1E1E" />
         <rect width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${viewPort.x}, ${viewPort.y}) scale(${viewPort.zoom})`}>
          {renderConnections()}
          {layers.map(renderLayer)}
          {renderSelection()}
        </g>
      </svg>
      
      {/* HUD */}
      <div className="absolute top-4 right-4 flex gap-2">
         <div className="bg-[#2C2C2C] text-gray-300 border border-black px-2 py-1 rounded text-xs font-mono shadow-lg">
            {Math.round(viewPort.zoom * 100)}%
         </div>
      </div>

       {/* Keyboard Hint */}
       <div className="absolute bottom-4 left-4 text-xs text-gray-500 font-sans pointer-events-none select-none">
          Hold Space to Pan • Scroll to Zoom • Ctrl+Z to Undo
       </div>
    </div>
  );
};