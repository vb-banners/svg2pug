import { SvgoSettings } from './SvgoSettings';
import { FileTab, ControlsPosition } from './FileTab';

export interface AppState {
  // Code content
  HTMLCode: string;
  JADECode: string;
  
  // Editor settings
  tabSize: number;
  useSoftTabs: boolean;
  
  // Feature toggles
  enableSvgIdToClass: boolean;
  enablePugSizeVars: boolean;
  enableQuickCopy: boolean;
  
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
}
