export enum ToolType {
  SELECT = 'SELECT',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  TEXT = 'TEXT',
  STICKY = 'STICKY',
  HAND = 'HAND',
  FRAME = 'FRAME',
  CONNECTION = 'CONNECTION',
  MAGIC = 'MAGIC'
}

export enum AppMode {
  DESIGN = 'DESIGN',
  PROTOTYPE = 'PROTOTYPE'
}

export interface Point {
  x: number;
  y: number;
}

export interface Effect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR';
  visible: boolean;
  color?: string;
  offset?: { x: number; y: number };
  blur?: number;
  spread?: number;
}

export interface LayerStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  cornerRadius: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  effects?: Effect[];
}

export interface LayoutProps {
  isAutoLayout: boolean;
  direction: 'row' | 'column';
  gap: number;
  padding: number;
  alignItems: 'flex-start' | 'center' | 'flex-end';
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between';
}

export interface PrototypeLink {
  targetId: string;
  trigger: 'ON_CLICK' | 'ON_HOVER';
  animation: 'INSTANT' | 'DISSOLVE' | 'SLIDE';
}

export interface Layer {
  id: string;
  name: string;
  type: 'RECTANGLE' | 'CIRCLE' | 'TEXT' | 'STICKY' | 'FRAME';
  x: number;
  y: number;
  width: number;
  height: number;
  style: LayerStyle;
  content?: string;
  layout?: LayoutProps;
  children?: string[]; // IDs of children
  parentId?: string;
  prototype?: PrototypeLink;
  isComponent?: boolean; // Master component
  instanceOf?: string; // ID of master component
}

export interface ViewPort {
  x: number;
  y: number;
  zoom: number;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  selection?: string[];
}

export interface HistoryStep {
  layers: Layer[];
  selectedId: string | null;
}