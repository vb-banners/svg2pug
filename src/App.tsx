import React, { useEffect } from 'react';
import { TabBar } from './Components/TabBar';
import { EditorPane } from './Components/EditorPane';
import { FloatingControls } from './Components/FloatingControls';
import { SvgoSettingsDialog } from './Components/SvgoSettingsDialog';
import { HelpDialog } from './Components/HelpDialog';
import { StatusBar } from './Components/StatusBar';
import { useAppStore } from './store/useAppStore';
import { useConversion } from './hooks/useConversion';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePasteHandler } from './hooks/usePasteHandler';
import './styles/globals.css';

const App: React.FC = () => {
  const [scriptsLoaded, setScriptsLoaded] = React.useState(false);
  const _hasHydrated = useAppStore(state => state._hasHydrated);
  const HTMLCode = useAppStore(state => state.HTMLCode);
  const openFiles = useAppStore(state => state.openFiles);
  const isSvgoMenuOpen = useAppStore(state => state.isSvgoMenuOpen);
  const isHelpMenuOpen = useAppStore(state => state.isHelpMenuOpen);
  const isSvgoEnabled = useAppStore(state => state.isSvgoEnabled);
  const svgoSettings = useAppStore(state => state.svgoSettings);
  const enableSvgIdToClass = useAppStore(state => state.enableSvgIdToClass);
  const enableCommonClasses = useAppStore(state => state.enableCommonClasses);
  const enablePugSizeVars = useAppStore(state => state.enablePugSizeVars);
  const enableQuickCopy = useAppStore(state => state.enableQuickCopy);
  const useSoftTabs = useAppStore(state => state.useSoftTabs);
  const tabSize = useAppStore(state => state.tabSize);
  const setJADECode = useAppStore(state => state.setJADECode);
  const setIsSvgoMenuOpen = useAppStore(state => state.setIsSvgoMenuOpen);
  const setIsHelpMenuOpen = useAppStore(state => state.setIsHelpMenuOpen);
  const setEnableQuickCopy = useAppStore(state => state.setEnableQuickCopy);
  
  const { convertHtmlToPug } = useConversion();

  // Wait for external scripts to load (pug.js, html-to-jade.js, he.js)
  useEffect(() => {
    const checkScripts = () => {
      if (window.Html2Jade && window.pug && window.he) {
        setScriptsLoaded(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkScripts()) return;

    // Poll every 50ms for up to 5 seconds
    const interval = setInterval(() => {
      if (checkScripts()) {
        clearInterval(interval);
      }
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      // Load anyway after timeout to show error state
      setScriptsLoaded(true);
      console.error('External scripts failed to load within timeout');
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const isLoading = !_hasHydrated || !scriptsLoaded;

  // Handle conversion for global HTML code (when no tabs are open)
  useEffect(() => {
    if (openFiles.length === 0) {
      const result = convertHtmlToPug(HTMLCode, {
        isSvgoEnabled,
        svgoSettings,
        enableSvgIdToClass,
        enableCommonClasses,
        enablePugSizeVars,
        useSoftTabs,
        tabSize,
        fileName: null
      });
      setJADECode(result);
    }
  }, [HTMLCode, openFiles.length, isSvgoEnabled, svgoSettings, enableSvgIdToClass, enableCommonClasses, enablePugSizeVars, useSoftTabs, tabSize, convertHtmlToPug, setJADECode]);
  
  // Set up paste handler for SVG/HTML files
  usePasteHandler({ enabled: true });
  
  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onNewTab: () => {
      const newFile = {
        id: Date.now().toString(),
        name: 'Untitled',
        htmlContent: '',
        pugContent: ''
      };
      useAppStore.getState().addFile(newFile);
    },
    onOpenFiles: () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.html,.htm,.svg';
      fileInput.multiple = true;
      fileInput.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        const store = useAppStore.getState();
        if (files && files.length > 0) {
          const fileArray = Array.from(files);
          let processedCount = 0;
          const newFiles: Array<{
            id: string;
            name: string;
            htmlContent: string;
            pugContent: string;
          }> = [];

          fileArray.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const content = event.target?.result as string;
              if (!content) return;
              
              const pugContent = convertHtmlToPug(content, {
                isSvgoEnabled: store.isSvgoEnabled,
                svgoSettings: store.svgoSettings,
                enableSvgIdToClass: store.enableSvgIdToClass,
                enableCommonClasses: store.enableCommonClasses,
                enablePugSizeVars: store.enablePugSizeVars,
                useSoftTabs: store.useSoftTabs,
                tabSize: store.tabSize,
                fileName: file.name
              });
              
              newFiles.push({
                id: `file-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                htmlContent: content,
                pugContent
              });
              
              processedCount++;
              
              // Add all files at once when all are processed
              if (processedCount === fileArray.length) {
                useAppStore.getState().addFiles(newFiles);
              }
            };
            reader.onerror = () => {
              console.error(`Failed to read file: ${file.name}`);
              processedCount++;
            };
            reader.readAsText(file);
          });
        }
      };
      fileInput.click();
    },
    onToggleSvgoMenu: () => {
      setIsSvgoMenuOpen(!isSvgoMenuOpen);
    },
    onToggleHelp: () => {
      setIsHelpMenuOpen(!isHelpMenuOpen);
    },
    onToggleQuickCopy: () => {
      setEnableQuickCopy(!enableQuickCopy);
    },
  });

  // Add keyboard event listener for dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSvgoMenuOpen) {
          setIsSvgoMenuOpen(false);
        }
        if (isHelpMenuOpen) {
          setIsHelpMenuOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSvgoMenuOpen, isHelpMenuOpen, setIsSvgoMenuOpen, setIsHelpMenuOpen]);

  // Wait for store to hydrate from localStorage AND scripts to load
  if (isLoading) {
    // If we've been loading for more than 3 seconds and scripts are loaded but hydration is stuck,
    // force hydration to complete so the user isn't stuck on a loading screen.
    // This is a safety fallback.
    if (scriptsLoaded && !_hasHydrated) {
      setTimeout(() => {
        useAppStore.getState().setHasHydrated(true);
      }, 3000);
    }

    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#1E2431', color: '#CBCCC6' }}>
        <div className="text-center">
          <div className="text-lg mb-2">Loading HTML2PUG...</div>
          {!scriptsLoaded && <div className="text-sm opacity-70">Loading conversion engines...</div>}
          {scriptsLoaded && !_hasHydrated && <div className="text-sm opacity-70">Restoring session...</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen text-foreground" style={{ backgroundColor: '#1E2431' }}>
      {/* Floating toolbar */}
      <FloatingControls />
      
      {/* Tab bar */}
      <TabBar />
      
      {/* Editor panes */}
      <EditorPane />
      
      {/* Status Bar */}
      <StatusBar />
      
      {/* SVGO Settings Dialog */}
      <SvgoSettingsDialog 
        isOpen={isSvgoMenuOpen}
        onClose={() => setIsSvgoMenuOpen(false)}
      />
      
      {/* Help Dialog */}
      <HelpDialog 
        isOpen={isHelpMenuOpen}
        onClose={() => setIsHelpMenuOpen(false)}
      />
    </div>
  );
};

export default App;
