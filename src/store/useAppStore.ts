import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, CursorPosition, SelectionInfo, CompressionStats } from '../types/AppState';
import { SvgoSettings } from '../types/SvgoSettings';
import { FileTab, ControlsPosition } from '../types/FileTab';
import { getDefaultSvgoSettings } from '../svgo-config';
import { HTMLCode as defaultHTMLCode, JADECode as defaultJADECode } from '../template';
import { migrateLocalStorageData, needsMigration } from '../utils/localStorage-migration';

interface AppStore extends AppState {
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Actions for code content
  setHTMLCode: (code: string) => void;
  setJADECode: (code: string) => void;
  
  // Actions for editor settings
  setTabSize: (size: number) => void;
  setUseSoftTabs: (useSoft: boolean) => void;
  
  // Actions for feature toggles
  setEnableSvgIdToClass: (enabled: boolean) => void;
  setEnableCommonClasses: (enabled: boolean) => void;
  setEnablePugSizeVars: (enabled: boolean) => void;
  setEnableQuickCopy: (enabled: boolean) => void;
  
  // Actions for UI state
  setControlsPosition: (position: ControlsPosition | null) => void;
  setIsControlsDragging: (isDragging: boolean) => void;
  setPugWidthRatio: (ratio: number) => void;
  setIsResizingSplit: (isResizing: boolean) => void;
  
  // Actions for SVGO
  setSvgoSettings: (settings: SvgoSettings) => void;
  setIsSvgoEnabled: (enabled: boolean) => void;
  setIsSvgoMenuOpen: (isOpen: boolean) => void;
  toggleSvgoPlugin: (pluginId: string, enabled: boolean) => void;
  updateSvgoPrecision: (key: 'floatPrecision' | 'transformPrecision', value: number) => void;
  toggleSvgoMultipass: (enabled: boolean) => void;
  
  // Actions for help menu
  setIsHelpMenuOpen: (isOpen: boolean) => void;
  
  // Actions for file management
  addFile: (file: FileTab) => void;
  addFiles: (files: FileTab[]) => void;
  removeFile: (fileId: string) => void;
  setActiveFile: (fileId: string | null) => void;
  updateFileContent: (fileId: string, htmlContent: string, pugContent: string) => void;
  updateFileName: (fileId: string, name: string) => void;
  reorderFiles: (fileIds: string[]) => void;
  setDraggedTabId: (tabId: string | null) => void;
  setDragOverTabId: (tabId: string | null) => void;
  setTabBarScrollPosition: (position: number) => void;
  duplicateFile: (fileId: string) => void;
  closeOtherFiles: (fileId: string) => void;
  closeAllFiles: () => void;
  
  // Status bar actions
  setActiveEditor: (editor: 'html' | 'pug' | null) => void;
  setHtmlCursorPosition: (position: CursorPosition | null) => void;
  setPugCursorPosition: (position: CursorPosition | null) => void;
  setHtmlSelectionInfo: (info: SelectionInfo | null) => void;
  setPugSelectionInfo: (info: SelectionInfo | null) => void;
  setCompressionStats: (stats: CompressionStats) => void;
  setStatusMessage: (message: string | null) => void;
  
  // Computed selectors
  getActiveFile: () => FileTab | null;
}

// Check if we need to migrate old data
const migratedData = needsMigration() ? migrateLocalStorageData() : {};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state with migration
      HTMLCode: migratedData.HTMLCode || defaultHTMLCode,
      JADECode: migratedData.JADECode || defaultJADECode,
      tabSize: 4,
      useSoftTabs: true,
      enableSvgIdToClass: migratedData.enableSvgIdToClass || false,
      enableCommonClasses: migratedData.enableCommonClasses || false,
      enablePugSizeVars: migratedData.enablePugSizeVars || false,
      enableQuickCopy: migratedData.enableQuickCopy || false,
      controlsPosition: migratedData.controlsPosition || null,
      isControlsDragging: false,
      pugWidthRatio: migratedData.pugWidthRatio || 0.5,
      isResizingSplit: false,
      svgoSettings: migratedData.svgoSettings || getDefaultSvgoSettings(),
      isSvgoEnabled: migratedData.isSvgoEnabled !== undefined ? migratedData.isSvgoEnabled : true,
      isSvgoMenuOpen: false,
      isHelpMenuOpen: false,
      openFiles: migratedData.openFiles || [],
      activeFileId: migratedData.activeFileId || null,
      draggedTabId: null,
      dragOverTabId: null,
      tabBarScrollPosition: migratedData.tabBarScrollPosition || 0,
      _hasHydrated: false,
      
      // Status bar state (transient - not persisted)
      activeEditor: null,
      htmlCursorPosition: null,
      pugCursorPosition: null,
      htmlSelectionInfo: null,
      pugSelectionInfo: null,
      compressionStats: { htmlGzipSize: 0, pugGzipSize: 0 },
      statusMessage: null,

      // Hydration actions
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      // Code content actions
      setHTMLCode: (code: string) => set({ HTMLCode: code }),
      setJADECode: (code: string) => set({ JADECode: code }),

      // Editor settings actions
      setTabSize: (size: number) => set({ tabSize: size }),
      setUseSoftTabs: (useSoft: boolean) => set({ useSoftTabs: useSoft }),

      // Feature toggles actions
      setEnableSvgIdToClass: (enabled: boolean) => set({ enableSvgIdToClass: enabled }),
      setEnableCommonClasses: (enabled: boolean) => set({ enableCommonClasses: enabled }),
      setEnablePugSizeVars: (enabled: boolean) => set({ enablePugSizeVars: enabled }),
      setEnableQuickCopy: (enabled: boolean) => set({ enableQuickCopy: enabled }),

      // UI state actions
      setControlsPosition: (position: ControlsPosition | null) => set({ controlsPosition: position }),
      setIsControlsDragging: (isDragging: boolean) => set({ isControlsDragging: isDragging }),
      setPugWidthRatio: (ratio: number) => set({ pugWidthRatio: ratio }),
      setIsResizingSplit: (isResizing: boolean) => set({ isResizingSplit: isResizing }),

      // SVGO actions
      setSvgoSettings: (settings: SvgoSettings) => set({ svgoSettings: settings }),
      setIsSvgoEnabled: (enabled: boolean) => set({ isSvgoEnabled: enabled }),
      setIsSvgoMenuOpen: (isOpen: boolean) => set({ isSvgoMenuOpen: isOpen }),
      
      toggleSvgoPlugin: (pluginId: string, enabled: boolean) =>
        set((state) => ({
          svgoSettings: {
            ...state.svgoSettings,
            plugins: {
              ...state.svgoSettings.plugins,
              [pluginId]: enabled,
            },
          },
        })),
      
      updateSvgoPrecision: (key: 'floatPrecision' | 'transformPrecision', value: number) =>
        set((state) => ({
          svgoSettings: {
            ...state.svgoSettings,
            [key]: value,
          },
        })),
      
      toggleSvgoMultipass: (enabled: boolean) =>
        set((state) => ({
          svgoSettings: {
            ...state.svgoSettings,
            multipass: enabled,
          },
        })),

      // Help menu actions
      setIsHelpMenuOpen: (isOpen: boolean) => set({ isHelpMenuOpen: isOpen }),

      // File management actions
      addFile: (file: FileTab) =>
        set((state) => ({
          openFiles: [...state.openFiles, file],
          activeFileId: file.id,
          HTMLCode: file.htmlContent,
          JADECode: file.pugContent,
        })),
      
      addFiles: (files: FileTab[]) =>
        set((state) => {
          const firstFile = files.length > 0 ? files[0] : null;
          return {
            openFiles: [...state.openFiles, ...files],
            activeFileId: firstFile ? firstFile.id : state.activeFileId,
            HTMLCode: firstFile ? firstFile.htmlContent : state.HTMLCode,
            JADECode: firstFile ? firstFile.pugContent : state.JADECode,
          };
        }),
      
      removeFile: (fileId: string) =>
        set((state) => {
          const newFiles = state.openFiles.filter((f) => f.id !== fileId);
          let newActiveId = state.activeFileId;
          let newHTMLCode = state.HTMLCode;
          let newJADECode = state.JADECode;
          
          if (state.activeFileId === fileId) {
            if (newFiles.length > 0) {
              const removedIndex = state.openFiles.findIndex((f) => f.id === fileId);
              const newIndex = Math.min(removedIndex, newFiles.length - 1);
              const newActiveFile = newFiles[newIndex];
              newActiveId = newActiveFile.id;
              newHTMLCode = newActiveFile.htmlContent;
              newJADECode = newActiveFile.pugContent;
            } else {
              newActiveId = null;
              newHTMLCode = defaultHTMLCode || '';
              newJADECode = defaultJADECode || '';
            }
          }
          
          return {
            openFiles: newFiles,
            activeFileId: newActiveId,
            HTMLCode: newHTMLCode || '',
            JADECode: newJADECode || '',
          };
        }),
      
      setActiveFile: (fileId: string | null) =>
        set((state) => {
          const file = state.openFiles.find((f) => f.id === fileId);
          if (file) {
            return {
              activeFileId: fileId,
              HTMLCode: file.htmlContent,
              JADECode: file.pugContent,
            };
          }
          return { activeFileId: fileId };
        }),
      
      updateFileContent: (fileId: string, htmlContent: string, pugContent: string) =>
        set((state) => {
          const updatedFiles = state.openFiles.map((file) =>
            file.id === fileId
              ? { ...file, htmlContent, pugContent }
              : file
          );
          
          // If updating the active file, also update global state
          if (state.activeFileId === fileId) {
            return {
              openFiles: updatedFiles,
              HTMLCode: htmlContent,
              JADECode: pugContent,
            };
          }
          
          return { openFiles: updatedFiles };
        }),
      
      updateFileName: (fileId: string, name: string) =>
        set((state) => {
          const updatedFiles = state.openFiles.map((file) =>
            file.id === fileId
              ? { ...file, name }
              : file
          );
          return { openFiles: updatedFiles };
        }),
      
      reorderFiles: (fileIds: string[]) =>
        set((state) => {
          const fileMap = new Map(state.openFiles.map((f) => [f.id, f]));
          const reordered = fileIds.map((id) => fileMap.get(id)).filter(Boolean) as FileTab[];
          return { openFiles: reordered };
        }),
      
      setDraggedTabId: (tabId: string | null) => set({ draggedTabId: tabId }),
      setDragOverTabId: (tabId: string | null) => set({ dragOverTabId: tabId }),
      setTabBarScrollPosition: (position: number) => set({ tabBarScrollPosition: position }),
      
      duplicateFile: (fileId: string) =>
        set((state) => {
          const fileToDuplicate = state.openFiles.find((f) => f.id === fileId);
          if (!fileToDuplicate) return state;
          
          const newFile: FileTab = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${fileToDuplicate.name} (copy)`,
            htmlContent: fileToDuplicate.htmlContent,
            pugContent: fileToDuplicate.pugContent,
          };
          
          const fileIndex = state.openFiles.findIndex((f) => f.id === fileId);
          const newFiles = [...state.openFiles];
          newFiles.splice(fileIndex + 1, 0, newFile);
          
          return {
            openFiles: newFiles,
            activeFileId: newFile.id,
            HTMLCode: newFile.htmlContent,
            JADECode: newFile.pugContent,
          };
        }),
      
      closeOtherFiles: (fileId: string) =>
        set((state) => {
          const fileToKeep = state.openFiles.find((f) => f.id === fileId);
          if (!fileToKeep) return state;
          
          return {
            openFiles: [fileToKeep],
            activeFileId: fileId,
            HTMLCode: fileToKeep.htmlContent,
            JADECode: fileToKeep.pugContent,
          };
        }),
      
      closeAllFiles: () =>
        set({
          openFiles: [],
          activeFileId: null,
          HTMLCode: defaultHTMLCode || '',
          JADECode: defaultJADECode || '',
        }),
      
      // Status bar actions
      setActiveEditor: (editor: 'html' | 'pug' | null) => set({ activeEditor: editor }),
      setHtmlCursorPosition: (position: CursorPosition | null) => set({ htmlCursorPosition: position }),
      setPugCursorPosition: (position: CursorPosition | null) => set({ pugCursorPosition: position }),
      setHtmlSelectionInfo: (info: SelectionInfo | null) => set({ htmlSelectionInfo: info }),
      setPugSelectionInfo: (info: SelectionInfo | null) => set({ pugSelectionInfo: info }),
      setCompressionStats: (stats: CompressionStats) => set({ compressionStats: stats }),
      setStatusMessage: (message: string | null) => {
        set({ statusMessage: message });
        if (message) {
          setTimeout(() => set({ statusMessage: null }), 5000);
        }
      },

      // Computed selectors
      getActiveFile: () => {
        const state = get();
        return state.openFiles.find((f) => f.id === state.activeFileId) || null;
      },
    }),
    {
      name: 'html2pug-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
      partialize: (state) => ({
        // Only persist these fields
        HTMLCode: state.HTMLCode,
        JADECode: state.JADECode,
        tabSize: state.tabSize,
        useSoftTabs: state.useSoftTabs,
        enableSvgIdToClass: state.enableSvgIdToClass,
        enableCommonClasses: state.enableCommonClasses,
        enablePugSizeVars: state.enablePugSizeVars,
        enableQuickCopy: state.enableQuickCopy,
        controlsPosition: state.controlsPosition,
        pugWidthRatio: state.pugWidthRatio,
        svgoSettings: state.svgoSettings,
        isSvgoEnabled: state.isSvgoEnabled,
        openFiles: state.openFiles,
        activeFileId: state.activeFileId,
        tabBarScrollPosition: state.tabBarScrollPosition,
      }),
    }
  )
);

// Ensure hydration flag flips even when there was no stored state
const markHydrated = () => {
  const state = useAppStore.getState();
  if (!state._hasHydrated) {
    state.setHasHydrated(true);
  }
};

if (useAppStore.persist?.hasHydrated?.()) {
  markHydrated();
} else {
  useAppStore.persist?.onFinishHydration?.(() => {
    markHydrated();
  });
}
