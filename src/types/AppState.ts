import { SvgoSettings } from './SvgoSettings';
import { FileTab, ControlsPosition } from './FileTab';

export interface CursorPosition {
  line: number;
  column: number;
}

export interface SelectionInfo {
  lineCount: number;
  charCount: number;
}

export interface CompressionStats {
  htmlGzipSize: number;
  pugGzipSize: number;
}

export interface AppState {
  // Code content
  HTMLCode: string;
  JADECode: string;
  
  // Editor settings
  tabSize: number;
  useSoftTabs: boolean;
  
  // Feature toggles
  enableSvgIdToClass: boolean;
  enableCommonClasses: boolean;
  enablePugSizeVars: boolean;
  enableQuickCopy: boolean;
  showPreview: boolean;
  previewSplitRatio: number;
  previewScale: number;
  
  // UI state
  controlsPosition: ControlsPosition | null;
  isControlsDragging: boolean;
  pugWidthRatio: number;
  isResizingSplit: boolean;
  
  // SVGO settings
  svgoSettings: SvgoSettings;
  isSvgoEnabled: boolean;
  isSvgoMenuOpen: boolean;
  
  // Help menu
  isHelpMenuOpen: boolean;
  
  // File management
  openFiles: FileTab[];
  activeFileId: string | null;
  draggedTabId: string | null;
  dragOverTabId: string | null;
  tabBarScrollPosition: number;
  
  // Status bar (transient - not persisted)
  activeEditor?: 'html' | 'pug' | null;
  htmlCursorPosition?: CursorPosition | null;
  pugCursorPosition?: CursorPosition | null;
  htmlSelectionInfo?: SelectionInfo | null;
  pugSelectionInfo?: SelectionInfo | null;
  compressionStats?: CompressionStats;
  statusMessage?: string | null;
}
