import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useConversion } from '../hooks/useConversion';

interface UsePasteHandlerOptions {
  enabled: boolean;
}

/**
 * Custom hook to handle paste events for SVG/HTML files
 * Supports two scenarios:
 * 1. When no tabs are open (placeholder visible) - creates new tabs
 * 2. When pasting into a blank tab - replaces the tab content
 */
export const usePasteHandler = ({ enabled }: UsePasteHandlerOptions) => {
  const { convertHtmlToPug } = useConversion();

  useEffect(() => {
    if (!enabled) return;

    const handlePaste = async (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      const store = useAppStore.getState();
      
      // Get clipboard items
      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;

      // Check for files in clipboard
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && (file.type === 'image/svg+xml' || file.name.endsWith('.svg') || file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
            files.push(file);
          }
        }
      }

      if (files.length === 0) return;

      // Prevent default paste behavior and stop propagation to prevent Monaco from handling it
      clipboardEvent.preventDefault();
      clipboardEvent.stopPropagation();

      const openFiles = store.openFiles;
      const activeFileId = store.activeFileId;
      const activeFile = openFiles.find(f => f.id === activeFileId);

      // Check if we're in a blank tab scenario
      const isBlankTab = activeFile && 
                         activeFile.htmlContent.trim() === '' && 
                         activeFile.pugContent.trim() === '';

      // Process files
      const processFile = (file: File): Promise<{ name: string; content: string }> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
              resolve({ name: file.name, content });
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
          reader.readAsText(file);
        });
      };

      try {
        const fileContents = await Promise.all(files.map(processFile));

        if (isBlankTab && fileContents.length === 1) {
          // Scenario 2: Pasting into a blank tab - replace its content
          const { name, content } = fileContents[0];
          const pugContent = convertHtmlToPug(content, {
            isSvgoEnabled: store.isSvgoEnabled,
            svgoSettings: store.svgoSettings,
            enableSvgIdToClass: store.enableSvgIdToClass,
            enablePugSizeVars: store.enablePugSizeVars,
            useSoftTabs: store.useSoftTabs,
            tabSize: store.tabSize,
            fileName: name
          });

          // Update the tab name and content
          store.updateFileContent(activeFile.id, content, pugContent);
          store.updateFileName(activeFile.id, name);
        } else {
          // Scenario 1: No tabs open or multiple files - create new tabs
          const newFiles = fileContents.map((fileContent, index) => {
            const pugContent = convertHtmlToPug(fileContent.content, {
              isSvgoEnabled: store.isSvgoEnabled,
              svgoSettings: store.svgoSettings,
              enableSvgIdToClass: store.enableSvgIdToClass,
              enablePugSizeVars: store.enablePugSizeVars,
              useSoftTabs: store.useSoftTabs,
              tabSize: store.tabSize,
              fileName: fileContent.name
            });

            return {
              id: `paste-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
              name: fileContent.name,
              htmlContent: fileContent.content,
              pugContent: pugContent
            };
          });

          store.addFiles(newFiles);
        }
      } catch (error) {
        console.error('Failed to process pasted files:', error);
      }
    };

    // Use capture phase to intercept before Monaco editor handles the event
    window.addEventListener('paste', handlePaste, true);

    return () => {
      window.removeEventListener('paste', handlePaste, true);
    };
  }, [enabled, convertHtmlToPug]);
};
