import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { MonacoEditor } from './MonacoEditor';
import { PreviewPane } from './PreviewPane';
import { useSplitPane } from '../hooks/useSplitPane';
import { useAppStore } from '../store/useAppStore';
import { useConversion } from '../hooks/useConversion';
import { useQuickCopy } from '../hooks/useQuickCopy';
import { useAutoCopyOnSelect } from '../hooks/useAutoCopyOnSelect';
import { useEditorCursor } from '../hooks/useEditorCursor';
import { useCompressionStats } from '../hooks/useCompressionStats';
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
  const enableCommonClasses = useAppStore(state => state.enableCommonClasses);
  const enablePugSizeVars = useAppStore(state => state.enablePugSizeVars);
  const enableQuickCopy = useAppStore(state => state.enableQuickCopy);
  const showPreview = useAppStore(state => state.showPreview);
  const previewSplitRatio = useAppStore(state => state.previewSplitRatio);
  const setPreviewSplitRatio = useAppStore(state => state.setPreviewSplitRatio);

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
    automaticLayout: true,
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
  const [previewLayout, setPreviewLayout] = React.useState<'vertical' | 'horizontal'>('vertical');
  const [highlightLines, setHighlightLines] = React.useState<number[]>([]);
  const [isCopied, setIsCopied] = React.useState(false);
  const [previewContent, setPreviewContent] = React.useState<string>('');
  const skipNextScrollRef = useRef<{ html: boolean; pug: boolean }>({
    html: false,
    pug: false,
  });
  const lastAutoSizedFileIdRef = useRef<string | null>(null);
  const lastAutoSizedDimensionsRef = useRef<{ width: number; height: number } | null>(null);

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
    
    // Track cursor position and selection changes for highlighting
    const updateHighlight = () => {
      const selections = editor.getSelections();
      if (selections && selections.length > 0) {
        // Map each selection to its start line number
        // This works for both single cursor (start=end) and block selection (start=top of block)
        const lines = selections.map(s => s.startLineNumber);
        setHighlightLines(lines);
        setIsCopied(false); // Reset copied state when selection changes
      } else {
        setHighlightLines([]);
        setIsCopied(false);
      }
    };

    editor.onDidChangeCursorPosition(updateHighlight);
    editor.onDidChangeCursorSelection(updateHighlight);

    // Force layout after mount to ensure content is visible
    setTimeout(() => editor.layout(), 0);
  }, [handlePugScroll]);

  const handleCopy = useCallback(() => {
    setIsCopied(true);
  }, []);

  // Enable Quick Copy feature for Pug editor (using state to ensure it updates when editor mounts)
  useQuickCopy(pugEditorInstance, enableQuickCopy, handleCopy);

  // Enable auto-copy on selection for Pug editor when Quick Copy is disabled
  useAutoCopyOnSelect(pugEditorInstance, enableQuickCopy, handleCopy);

  // Enable cursor tracking for both editors
  useEditorCursor(htmlEditorRef.current, pugEditorRef.current);

  // Enable compression stats tracking
  useCompressionStats(displayHTMLCode, displayJADECode);

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
  }, [pugWidthRatio, previewSplitRatio, showPreview]);

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
        enableCommonClasses,
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
  }, [isSvgoEnabled, svgoSettings, enableSvgIdToClass, enableCommonClasses, enablePugSizeVars, useSoftTabs, tabSize]);

  const handleContentSizeChange = useCallback((width: number, height: number) => {
    const currentFileId = activeFileId || 'global';
    
    // Determine layout based on aspect ratio and size
    const isWide = width > 320 && height < width;
    const newLayout = isWide ? 'horizontal' : 'vertical';
    
    // Check if we should update
    const fileChanged = lastAutoSizedFileIdRef.current !== currentFileId;
    const dimensionsChanged = !lastAutoSizedDimensionsRef.current || 
        Math.abs(lastAutoSizedDimensionsRef.current.width - width) > 1 || 
        Math.abs(lastAutoSizedDimensionsRef.current.height - height) > 1;

    if (!fileChanged && !dimensionsChanged) {
      return;
    }

    setPreviewLayout(newLayout);

    if (width <= 0) return;
    if (!sectionRef.current) return;

    const sectionRect = sectionRef.current.getBoundingClientRect();
    const leftSectionWidth = sectionRect.width * (1 - pugWidthRatio);
    const leftSectionHeight = sectionRect.height;
    
    let targetRatio;

    if (newLayout === 'vertical') {
        // Target width + padding (e.g. 40px for scrollbars/padding)
        const targetWidth = width + 40;
        targetRatio = targetWidth / leftSectionWidth;
    } else {
        // Target height + padding
        const targetHeight = height + 40;
        targetRatio = targetHeight / leftSectionHeight;
    }
    
    // Clamp ratio
    targetRatio = Math.max(0.2, Math.min(0.8, targetRatio));
    
    setPreviewSplitRatio(targetRatio);
    lastAutoSizedFileIdRef.current = currentFileId;
    lastAutoSizedDimensionsRef.current = { width, height };
  }, [activeFileId, pugWidthRatio, setPreviewSplitRatio]);

  // Handle resizing of the preview pane
  const isPreviewResizingRef = useRef(false);

  const handlePreviewResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isPreviewResizingRef.current = true;
    document.body.style.cursor = previewLayout === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [previewLayout]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPreviewResizingRef.current || !sectionRef.current) return;

      // Get the left section element (it's the first child of sectionRef)
      const leftSection = sectionRef.current.querySelector('.flex.border-r') as HTMLElement;
      if (!leftSection) return;

      const leftSectionRect = leftSection.getBoundingClientRect();
      let newRatio;

      if (previewLayout === 'vertical') {
          // Calculate new ratio based on mouse position relative to the left section
          const mouseX = e.clientX - leftSectionRect.left;
          // Ratio within the left section - this becomes the preview's width percentage
          // Since preview is on the right, its width is (1 - splitPosition)
          newRatio = 1 - (mouseX / leftSectionRect.width);
      } else {
          // Calculate new ratio based on mouse position relative to the left section height
          const mouseY = e.clientY - leftSectionRect.top;
          // Preview is at the bottom
          newRatio = 1 - (mouseY / leftSectionRect.height);
      }

      // Clamp ratio between 0.2 and 0.8
      newRatio = Math.max(0.2, Math.min(0.8, newRatio));

      setPreviewSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      if (isPreviewResizingRef.current) {
        isPreviewResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setPreviewSplitRatio, previewLayout]);

  // Sync preview content on file switch or initial load
  useEffect(() => {
    let content = displayHTMLCode || '';
    
    if (displayJADECode) {
      const debugHtml = convertPugToHtml(displayJADECode, {
        useSoftTabs,
        tabSize,
        injectDebugInfo: true
      });
      if (debugHtml) {
        content = debugHtml;
      }
    }
    
    setPreviewContent(content);
  }, [activeFileId, displayJADECode, displayHTMLCode, convertPugToHtml, useSoftTabs, tabSize]);

  return (
    <div ref={sectionRef as any} className="flex flex-1 relative overflow-hidden">
      {/* Left Section: HTML Editor + Preview */}
      <div
        className={`flex ${previewLayout === 'horizontal' ? 'flex-col' : 'flex-row'} border-r border-border relative`}
        style={getHtmlEditorStyle()}
      >
        {/* HTML Editor */}
        <div
          className={`flex flex-col overflow-hidden`}
          style={{
            width: previewLayout === 'horizontal' ? '100%' : (showPreview ? `${(1 - previewSplitRatio) * 100}%` : '100%'),
            height: previewLayout === 'horizontal' ? (showPreview ? `${(1 - previewSplitRatio) * 100}%` : '100%') : '100%',
          }}
        >
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              key={`html-${activeFileId || 'default'}`}
              value={displayHTMLCode || ''}
              onChange={(value) => {
                if (activeFileId) {
                  updateFileContent(activeFileId, value || '', activeFile?.pugContent || '');
                } else {
                  setHTMLCode(value || '');
                }
              }}
              language="html"
              options={editorOptions}
              onMount={handleHTMLMount}
            />
          </div>
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <>
            {/* Resizer Handle */}
            <div
              className={`absolute z-10 flex items-center justify-center hover:bg-primary/20 transition-colors ${
                previewLayout === 'vertical' 
                  ? 'w-1 h-full cursor-col-resize top-0' 
                  : 'h-1 w-full cursor-row-resize left-0'
              }`}
              style={{
                [previewLayout === 'vertical' ? 'left' : 'top']: `${(1 - previewSplitRatio) * 100}%`,
                transform: previewLayout === 'vertical' ? 'translateX(-50%)' : 'translateY(-50%)'
              }}
              onMouseDown={handlePreviewResizeMouseDown}
            >
               <div className={`bg-border ${previewLayout === 'vertical' ? 'w-px h-8' : 'h-px w-8'}`} />
            </div>

            <div
              className="flex flex-col overflow-hidden bg-background"
              style={{
                width: previewLayout === 'horizontal' ? '100%' : `${previewSplitRatio * 100}%`,
                height: previewLayout === 'horizontal' ? `${previewSplitRatio * 100}%` : '100%',
              }}
            >
              <PreviewPane 
                htmlContent={previewContent} 
                originalHtml={displayHTMLCode || ''}
                highlightLines={highlightLines}
                isCopied={isCopied}
                onContentSizeChange={handleContentSizeChange}
                fileName={activeFile?.name}
                fileId={activeFileId || undefined}
              />
            </div>
          </>
        )}
      </div>

      {/* Splitter */}
      <div
        className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors z-10 flex items-center justify-center"
        onMouseDown={handleSplitMouseDown}
      >
        <div className="w-px h-8 bg-muted-foreground/20" />
      </div>

      {/* Right Section: Pug Editor */}
      <div
        className="flex flex-col overflow-hidden"
        style={getPugEditorStyle()}
      >
        <div className="flex-1 overflow-hidden relative">
          <MonacoEditor
            key={`pug-${activeFileId || 'default'}`}
            value={displayJADECode || ''}
            onChange={(value) => {
              if (activeFileId) {
                updateFileContent(activeFileId, activeFile?.htmlContent || '', value || '');
              } else {
                useAppStore.getState().setJADECode(value || '');
              }
            }}
            language="pug"
            options={pugEditorOptions}
            onMount={handlePugMount}
          />
        </div>
      </div>
    </div>
  );
};
