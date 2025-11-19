import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useAppStore } from '../store/useAppStore';

/**
 * Hook to automatically copy selected text to clipboard when Quick Copy is disabled
 * 
 * When Quick Copy is disabled:
 * - Selecting text and releasing mouse button copies the selection to clipboard
 * - Shows feedback message indicating what was copied
 */
export const useAutoCopyOnSelect = (
  editor: monaco.editor.IStandaloneCodeEditor | null,
  enableQuickCopy: boolean,
  onCopy?: () => void
) => {
  const mouseUpDisposableRef = useRef<monaco.IDisposable | null>(null);
  const editorRef = useRef(editor);

  // Update editor ref when it changes
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    const currentEditor = editorRef.current;

    // Clean up previous listeners
    if (mouseUpDisposableRef.current) {
      mouseUpDisposableRef.current.dispose();
      mouseUpDisposableRef.current = null;
    }

    // Only enable auto-copy when Quick Copy is DISABLED
    if (!currentEditor || enableQuickCopy) {
      return;
    }

    const model = currentEditor.getModel();
    if (!model) return;

    // Listen for mouse up events to detect end of selection
    mouseUpDisposableRef.current = currentEditor.onMouseUp(() => {
      // Small delay to ensure selection is finalized
      setTimeout(() => {
        if (!editorRef.current) return;

        const selection = editorRef.current.getSelection();
        if (!selection || selection.isEmpty()) {
          return;
        }

        const selectedText = editorRef.current.getModel()?.getValueInRange(selection);
        if (!selectedText || selectedText.trim().length === 0) {
          return;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(selectedText)
          .then(() => {
            const lineCount = selectedText.split('\n').length;
            const charCount = selectedText.length;
            useAppStore.getState().setStatusMessage(
              `Copied ${lineCount} line${lineCount !== 1 ? 's' : ''} (${charCount} char${charCount !== 1 ? 's' : ''})`
            );
            onCopy?.();
          })
          .catch((err) => {
            console.error('Failed to copy to clipboard:', err);
          });
      }, 50);
    });

    // Cleanup function
    return () => {
      if (mouseUpDisposableRef.current) {
        mouseUpDisposableRef.current.dispose();
        mouseUpDisposableRef.current = null;
      }
    };
  }, [editor, enableQuickCopy]);
};
