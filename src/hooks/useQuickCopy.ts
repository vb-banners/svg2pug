import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

/**
 * Hook to enable Quick Copy feature in Monaco Editor
 * 
 * When enabled:
 * - Hovering over a line in the Pug editor detects the indentation level
 * - Selects the current line and all child lines (lines with greater indentation)
 * - For one-liners (no children), selects just that line
 * - Clicking copies the selected text to clipboard
 * - Shows visual feedback with Monaco's built-in selection
 */
export const useQuickCopy = (
  editor: monaco.editor.IStandaloneCodeEditor | null,
  enableQuickCopy: boolean
) => {
  const hoverDisposableRef = useRef<monaco.IDisposable | null>(null);
  const clickDisposableRef = useRef<monaco.IDisposable | null>(null);
  const currentSelectionRef = useRef<monaco.Selection | null>(null);
  const lastHoverLineRef = useRef<number>(-1);
  const editorRef = useRef(editor);
  const multiSelectionsRef = useRef<Array<{ selection: monaco.Selection; text: string }>>([]);
  
  // Update editor ref when it changes
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    const currentEditor = editorRef.current;
    
    if (!currentEditor || !enableQuickCopy) {
      // Clean up listeners if Quick Copy is disabled
      if (hoverDisposableRef.current) {
        hoverDisposableRef.current.dispose();
        hoverDisposableRef.current = null;
      }
      if (clickDisposableRef.current) {
        clickDisposableRef.current.dispose();
        clickDisposableRef.current = null;
      }
      currentSelectionRef.current = null;
      lastHoverLineRef.current = -1;
      multiSelectionsRef.current = [];
      return;
    }

    const model = currentEditor.getModel();
    if (!model) return;

    /**
     * Get the indentation level of a line
     */
    const getIndentLevel = (lineNumber: number): number => {
      const lineContent = model.getLineContent(lineNumber);
      const match = lineContent.match(/^(\s*)/);
      return match ? match[1].length : 0;
    };

    /**
     * Find all child lines with greater indentation
     */
    const getChildLines = (startLine: number): { start: number; end: number } => {
      const lineCount = model.getLineCount();
      const startIndent = getIndentLevel(startLine);
      
      // Check if the line is empty or just whitespace
      const lineContent = model.getLineContent(startLine).trim();
      if (!lineContent) {
        return { start: startLine, end: startLine };
      }

      let endLine = startLine;

      // Look for child lines with greater indentation (including empty lines between children)
      for (let i = startLine + 1; i <= lineCount; i++) {
        const lineContent = model.getLineContent(i).trim();
        const lineIndent = getIndentLevel(i);
        
        // If we hit a non-empty line with equal or less indentation, we've found the end
        if (lineContent && lineIndent <= startIndent) {
          break;
        }

        // If it's empty or has greater indentation, include it
        if (!lineContent || lineIndent > startIndent) {
          endLine = i;
        }
      }

      return { start: startLine, end: endLine };
    };

    /**
     * Create a selection for the line and its children
     */
    const selectLineWithChildren = (lineNumber: number) => {
      const { start, end } = getChildLines(lineNumber);
      
      const startColumn = 1;
      const endLineContent = model.getLineContent(end);
      const endColumn = endLineContent.length + 1;

      const selection = new monaco.Selection(start, startColumn, end, endColumn);
      currentEditor.setSelection(selection);
      currentSelectionRef.current = selection;
      
      return selection;
    };

    // Mouse move listener for hover selection
    hoverDisposableRef.current = currentEditor.onMouseMove((e) => {
      const position = e.target.position;
      if (!position) {
        return;
      }

      const lineNumber = position.lineNumber;
      
      // Only update selection if we're hovering over a different line
      if (lineNumber !== lastHoverLineRef.current) {
        lastHoverLineRef.current = lineNumber;
        const newSelection = selectLineWithChildren(lineNumber);
        
        // If we have multi-selections, add the hover selection to them for visual feedback
        if (multiSelectionsRef.current.length > 0) {
          const allSelections = [
            ...multiSelectionsRef.current.map((item) => item.selection),
            newSelection
          ];
          currentEditor.setSelections(allSelections);
        }
      }
    });

    // Mouse down listener for copying to clipboard
    clickDisposableRef.current = currentEditor.onMouseDown((e) => {
      const position = e.target.position;
      if (!position) {
        return;
      }

      // Use the stored selection from hover (more reliable than getting current selection)
      const selection = currentSelectionRef.current;
      
      if (!selection) {
        return;
      }

      // Get the selected text from the stored selection
      const selectedText = model.getValueInRange(selection);

      // Check if Shift key is pressed for multi-selection
      const isShiftPressed = e.event.shiftKey;

      if (isShiftPressed) {
        // Multi-selection mode: add to collection
        // Check if this selection is already in the list
        const existingIndex = multiSelectionsRef.current.findIndex(
          (item) =>
            item.selection.startLineNumber === selection.startLineNumber &&
            item.selection.endLineNumber === selection.endLineNumber
        );

        if (existingIndex >= 0) {
          // Remove if already selected (toggle)
          multiSelectionsRef.current.splice(existingIndex, 1);
        } else {
          // Add new selection
          multiSelectionsRef.current.push({ selection, text: selectedText });
        }

        // Visual feedback: set multiple selections in editor
        const allSelections = multiSelectionsRef.current.map((item) => item.selection);
        currentEditor.setSelections(allSelections);
        
        // Immediately copy all selections
        if (multiSelectionsRef.current.length > 0) {
          // Sort selections by line number to maintain document order
          const sortedSelections = [...multiSelectionsRef.current].sort(
            (a, b) => a.selection.startLineNumber - b.selection.startLineNumber
          );

          // Combine all selected texts
          const combinedTexts = sortedSelections.map((item) => item.text);
          const textToCopy = combinedTexts.join('\n');
          
          // Normalize indentation
          const lines = textToCopy.split('\n');
          if (lines.length > 0) {
            // Get the indentation of the first line (parent)
            const firstLineIndent = lines[0].match(/^(\s*)/)?.[1] || '';
            const indentLength = firstLineIndent.length;
            
            // Remove that amount of indentation from all lines
            const normalizedLines = lines.map(line => {
              if (line.startsWith(firstLineIndent)) {
                return line.substring(indentLength);
              }
              return line;
            });
            
            const normalizedText = normalizedLines.join('\n');
            
            // Copy to clipboard
            navigator.clipboard.writeText(normalizedText).catch((err) => {
              console.error('Failed to copy to clipboard:', err);
            });
          }
        }
        
        return;
      } else {
        // Normal click without Shift: copy current selection and clear multi-selections
        const textToCopy = selectedText;

        // Clear multi-selections
        multiSelectionsRef.current = [];

        // Normalize indentation by removing the parent line's indentation from all lines
        if (textToCopy) {
          const lines = textToCopy.split('\n');
          if (lines.length > 0) {
            // Get the indentation of the first line (parent)
            const firstLineIndent = lines[0].match(/^(\s*)/)?.[1] || '';
            const indentLength = firstLineIndent.length;
            
            // Remove that amount of indentation from all lines
            const normalizedLines = lines.map(line => {
              // Only remove indentation if the line has at least that much
              if (line.startsWith(firstLineIndent)) {
                return line.substring(indentLength);
              }
              return line;
            });
            
            const normalizedText = normalizedLines.join('\n');
            
            // Copy to clipboard
            navigator.clipboard.writeText(normalizedText).catch((err) => {
              console.error('Failed to copy to clipboard:', err);
            });
          }
        }
      }
    });

    // Cleanup function
    return () => {
      if (hoverDisposableRef.current) {
        hoverDisposableRef.current.dispose();
        hoverDisposableRef.current = null;
      }
      if (clickDisposableRef.current) {
        clickDisposableRef.current.dispose();
        clickDisposableRef.current = null;
      }
      currentSelectionRef.current = null;
      lastHoverLineRef.current = -1;
      multiSelectionsRef.current = [];
    };
  }, [editor, enableQuickCopy]);
};
