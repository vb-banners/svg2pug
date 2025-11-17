import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { MonacoEditor } from './MonacoEditor';
import { useSplitPane } from '../hooks/useSplitPane';
import { useAppStore } from '../store/useAppStore';
import { useConversion } from '../hooks/useConversion';
import { useQuickCopy } from '../hooks/useQuickCopy';
import { cn } from '../lib/utils';
import type * as monaco from 'monaco-editor';

export const EditorPane: React.FC = () => {
  const openFiles = useAppStore(state => state.openFiles);
  const activeFileId = useAppStore(state => state.activeFileId);
  const HTMLCode = useAppStore(state => state.HTMLCode);
  const JADECode = useAppStore(state => state.JADECode);
  const setHTMLCode = useAppStore(state => state.setHTMLCode);
  const updateFileContent = useAppStore(state => state.updateFileContent);
  const pugWidthRatio = useAppStore(state => state.pugWidthRatio);
  const tabSize = useAppStore(state => state.tabSize);
  const useSoftTabs = useAppStore(state => state.useSoftTabs);
  const isSvgoEnabled = useAppStore(state => state.isSvgoEnabled);
  const svgoSettings = useAppStore(state => state.svgoSettings);
  const enableSvgIdToClass = useAppStore(state => state.enableSvgIdToClass);
  const enablePugSizeVars = useAppStore(state => state.enablePugSizeVars);
  const enableQuickCopy = useAppStore(state => state.enableQuickCopy);
  
  const { convertHtmlToPug, convertPugToHtml } = useConversion();
  
  // Memoize editor options to ensure they trigger updates when changed
  const editorOptions = useMemo(() => ({
    tabSize,
    insertSpaces: useSoftTabs,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'off' as const,
    lineNumbers: 'on' as const,
    folding: true,
  }), [tabSize, useSoftTabs]);

  const pugEditorOptions = useMemo(() => ({
    ...editorOptions,
  }), [editorOptions]);
  
  // Get active file content or fall back to global state
  const activeFile = openFiles.find(f => f.id === activeFileId);
  const displayHTMLCode = activeFile ? activeFile.htmlContent : HTMLCode;
  const displayJADECode = activeFile ? activeFile.pugContent : JADECode;
  
  const htmlEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const pugEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [pugEditorInstance, setPugEditorInstance] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const skipNextScrollRef = useRef<{ html: boolean; pug: boolean }>({
    html: false,
    pug: false,
  });

  // Expose editor refs globally for keyboard shortcuts
  useEffect(() => {
    (window as any).__monacoEditors = {
      html: htmlEditorRef.current,
      pug: pugEditorRef.current
    };
    return () => {
      delete (window as any).__monacoEditors;
    };
  }, [htmlEditorRef.current, pugEditorRef.current]);
  
  const {
    sectionRef,
    handleSplitMouseDown,
    getHtmlEditorStyle,
    getPugEditorStyle,
  } = useSplitPane();

  // Keep both editors aligned to the same relative scroll position
  const syncScrollPositions = useCallback((source: 'html' | 'pug') => {
    const htmlEditor = htmlEditorRef.current;
    const pugEditor = pugEditorRef.current;
    if (!htmlEditor || !pugEditor) return;

    const sourceEditor = source === 'html' ? htmlEditor : pugEditor;
    const targetEditor = source === 'html' ? pugEditor : htmlEditor;

    const sourceLayout = sourceEditor.getLayoutInfo();
    const targetLayout = targetEditor.getLayoutInfo();
    if (!sourceLayout || !targetLayout) return;

    const sourceScrollTop = sourceEditor.getScrollTop();
    const sourceMaxScroll = Math.max(0, sourceEditor.getScrollHeight() - sourceLayout.height);
    const targetMaxScroll = Math.max(0, targetEditor.getScrollHeight() - targetLayout.height);

    const scrollPercentage = sourceMaxScroll > 0 ? sourceScrollTop / sourceMaxScroll : 0;
    const newScrollTop = scrollPercentage * targetMaxScroll;

    if (source === 'html') {
      skipNextScrollRef.current.pug = true;
    } else {
      skipNextScrollRef.current.html = true;
    }

    targetEditor.setScrollTop(newScrollTop);
  }, []);

  const handleHTMLScroll = useCallback(() => {
    if (skipNextScrollRef.current.html) {
      skipNextScrollRef.current.html = false;
      return;
    }
    syncScrollPositions('html');
  }, [syncScrollPositions]);

  const handlePugScroll = useCallback(() => {
    if (skipNextScrollRef.current.pug) {
      skipNextScrollRef.current.pug = false;
      return;
    }
    syncScrollPositions('pug');
  }, [syncScrollPositions]);

  const handleHTMLMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    htmlEditorRef.current = editor;
    editor.onDidScrollChange(handleHTMLScroll);
    // Force layout after mount to ensure content is visible
    setTimeout(() => editor.layout(), 0);
  }, [handleHTMLScroll]);

  const handlePugMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    pugEditorRef.current = editor;
    setPugEditorInstance(editor); // Update state to trigger useQuickCopy
    editor.onDidScrollChange(handlePugScroll);
    // Force layout after mount to ensure content is visible
    setTimeout(() => editor.layout(), 0);
  }, [handlePugScroll]);

  // Enable Quick Copy feature for Pug editor (using state to ensure it updates when editor mounts)
  useQuickCopy(pugEditorInstance, enableQuickCopy);

  useEffect(() => {
    const handleWindowResize = () => {
      if (htmlEditorRef.current) {
        htmlEditorRef.current.layout();
      }
      if (pugEditorRef.current) {
        pugEditorRef.current.layout();
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // Update editor layouts when pugWidthRatio changes
  useEffect(() => {
    let rafId: number | null = null;

    const layoutEditors = () => {
      if (htmlEditorRef.current) {
        htmlEditorRef.current.layout();
      }
      if (pugEditorRef.current) {
        pugEditorRef.current.layout();
      }
    };

    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      rafId = window.requestAnimationFrame(layoutEditors);
    } else {
      layoutEditors();
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [pugWidthRatio]);

  // Re-apply the sync whenever the generated Pug content changes
  useEffect(() => {
    syncScrollPositions('html');
  }, [displayJADECode, syncScrollPositions]);

  // Force layout when content changes (after hydration or file upload)
  useEffect(() => {
    const layoutEditors = () => {
      if (htmlEditorRef.current) {
        htmlEditorRef.current.layout();
      }
      if (pugEditorRef.current) {
        pugEditorRef.current.layout();
      }
    };

    // Small delay to ensure editors are mounted
    const timer = setTimeout(layoutEditors, 100);
    return () => clearTimeout(timer);
  }, [displayHTMLCode, displayJADECode, openFiles.length, activeFileId]);

  // Reconvert HTML to Pug when settings change
  useEffect(() => {
    if (displayHTMLCode && displayHTMLCode.trim().length > 0) {
      const pugContent = convertHtmlToPug(displayHTMLCode, {
        isSvgoEnabled,
        svgoSettings,
        enableSvgIdToClass,
        enablePugSizeVars,
        useSoftTabs,
        tabSize,
        fileName: activeFile?.name || null
      });
      
      if (activeFile) {
        updateFileContent(activeFile.id, displayHTMLCode, pugContent);
      } else {
        useAppStore.getState().setJADECode(pugContent);
      }
    }
  }, [isSvgoEnabled, svgoSettings, enableSvgIdToClass, enablePugSizeVars, useSoftTabs, tabSize]);

  return (
    <div ref={sectionRef as any} className="flex flex-1 relative overflow-hidden">
      {/* HTML Editor */}
      <div 
        className="flex flex-col border-r border-border"
        style={getHtmlEditorStyle()}
      >
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            key={`html-${activeFileId || 'default'}`}
            value={displayHTMLCode || ''}
            onChange={(value) => {
              if (value === undefined) return;
              
              // Convert HTML to Pug
              const pugContent = convertHtmlToPug(value, {
                isSvgoEnabled,
                svgoSettings,
                enableSvgIdToClass,
                enablePugSizeVars,
                useSoftTabs,
                tabSize,
                fileName: activeFile?.name || null
              });
              
              if (activeFile) {
                updateFileContent(activeFile.id, value, pugContent);
              } else {
                setHTMLCode(value);
              }
            }}
            language="html"
            onMount={handleHTMLMount}
            options={editorOptions}
          />
        </div>
      </div>

      {/* Resizer */}
      <div
        className={cn(
          'w-1 bg-border hover:bg-primary cursor-col-resize transition-colors',
          'active:bg-primary'
        )}
        onMouseDown={handleSplitMouseDown}
        role="separator"
        aria-label="Resize editor panes"
        aria-orientation="vertical"
        tabIndex={0}
        onKeyDown={(e) => {
          // Allow keyboard resizing with arrow keys
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const adjustment = e.key === 'ArrowLeft' ? -0.05 : 0.05;
            const newRatio = Math.max(0.2, Math.min(0.8, pugWidthRatio + adjustment));
            useAppStore.getState().setPugWidthRatio(newRatio);
          }
        }}
      />

      {/* Pug Editor */}
      <div 
        className="flex flex-col"
        style={getPugEditorStyle()}
      >
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            key={`pug-${activeFileId || 'default'}`}
            value={displayJADECode || ''}
            onChange={(value) => {
              if (value === undefined) return;
              
              // Convert Pug to HTML
              const htmlContent = convertPugToHtml(value, {
                useSoftTabs,
                tabSize,
              });
              
              if (activeFile) {
                updateFileContent(activeFile.id, htmlContent, value);
              } else {
                setHTMLCode(htmlContent);
                useAppStore.getState().setJADECode(value);
              }
            }}
            language="pug"
            onMount={handlePugMount}
            options={pugEditorOptions}
          />
        </div>
      </div>
    </div>
  );
};
