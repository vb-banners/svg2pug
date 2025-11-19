import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useAppStore } from '../store/useAppStore';

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
  enableQuickCopy: boolean,
  onCopy?: () => void
) => {
  const hoverDisposableRef = useRef<monaco.IDisposable | null>(null);
  const clickDisposableRef = useRef<monaco.IDisposable | null>(null);
  const selectionChangeDisposableRef = useRef<monaco.IDisposable | null>(null);
  const currentSelectionRef = useRef<monaco.Selection | null>(null);
  const lastHoverLineRef = useRef<number>(-1);
  const editorRef = useRef(editor);
  const multiSelectionsRef = useRef<Array<{ selection: monaco.Selection; text: string }>>([]);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);
  const preventHoverRef = useRef(false);
  const lockSelectionRef = useRef(false);
  const lockedSelectionRef = useRef<monaco.Selection | null>(null);
  
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
      useAppStore.getState().setStatusMessage(null);
      return;
    }

    const model = currentEditor.getModel();
    if (!model) return;

    // Show initial Quick Copy active message
    useAppStore.getState().setStatusMessage('Quick Copy is active');

    // Add a listener to prevent selection changes when locked
    selectionChangeDisposableRef.current = currentEditor.onDidChangeCursorSelection(() => {
      if (lockSelectionRef.current) {
        // Restore multi-selections if they exist
        if (multiSelectionsRef.current.length > 0) {
          const allSelections = multiSelectionsRef.current.map((item) => item.selection);
          const currentSelections = currentEditor.getSelections();
          
          // Check if current selections differ from what we want
          if (currentSelections && !areSelectionsEqual(currentSelections, allSelections)) {
            currentEditor.setSelections(allSelections);
          }
        } else if (lockedSelectionRef.current) {
          // Restore single locked selection
          const currentSel = currentEditor.getSelection();
          if (currentSel && !currentSel.equalsSelection(lockedSelectionRef.current)) {
            currentEditor.setSelection(lockedSelectionRef.current);
          }
        }
      }
    });

    // Helper to compare selection arrays
    const areSelectionsEqual = (sel1: monaco.Selection[], sel2: monaco.Selection[]): boolean => {
      if (sel1.length !== sel2.length) return false;
      return sel1.every((s1, i) => {
        const s2 = sel2[i];
        return s1.startLineNumber === s2.startLineNumber &&
               s1.endLineNumber === s2.endLineNumber &&
               s1.startColumn === s2.startColumn &&
               s1.endColumn === s2.endColumn;
      });
    };

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
     * Extract block name from first line (element name or class)
     */
    const getBlockName = (lineNumber: number): string => {
      const lineContent = model.getLineContent(lineNumber).trim();
      // Match element name (e.g., "div", "rect.bg", "svg#icon")
      const match = lineContent.match(/^([a-zA-Z0-9._#-]+)/);
      return match ? match[1] : 'block';
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
      // Don't update selection if we just clicked
      if (preventHoverRef.current) {
        return;
      }
      
      const position = e.target.position;
      
      if (!position) {
        isHoveringRef.current = false;
        if (messageTimeoutRef.current) {
          clearTimeout(messageTimeoutRef.current);
        }
        messageTimeoutRef.current = setTimeout(() => {
          if (!isHoveringRef.current) {
            // When not hovering, restore only the multi-selections if any exist
            if (multiSelectionsRef.current.length > 0) {
              const allSelections = multiSelectionsRef.current.map((item) => item.selection);
              currentEditor.setSelections(allSelections);
            }
            useAppStore.setState({ statusMessage: 'Quick Copy is active' });
          }
        }, 200);
        return;
      }

      isHoveringRef.current = true;
      const lineNumber = position.lineNumber;
      
      // Clear any pending timeout
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
      
      // Only update selection if we're hovering over a different line
      if (lineNumber !== lastHoverLineRef.current) {
        lastHoverLineRef.current = lineNumber;
        const newSelection = selectLineWithChildren(lineNumber);
        
        // Show hover message (stays while hovering)
        const blockName = getBlockName(lineNumber);
        const { start, end } = getChildLines(lineNumber);
        const lineCount = end - start + 1;
        
        if (multiSelectionsRef.current.length > 0) {
          useAppStore.setState({ statusMessage: `Click to add ${blockName} (${lineCount} line${lineCount !== 1 ? 's' : ''})` });
          // Always show all previous selections plus the current hover
          const allSelections = [
            ...multiSelectionsRef.current.map((item) => item.selection),
            newSelection
          ];
          currentEditor.setSelections(allSelections);
        } else {
          useAppStore.setState({ statusMessage: `Click to copy ${blockName} (${lineCount} line${lineCount !== 1 ? 's' : ''})` });
          // For single selection mode, just set the current selection
          currentEditor.setSelection(newSelection);
        }
      }
    });

    // Mouse down listener for copying to clipboard
    clickDisposableRef.current = currentEditor.onMouseDown((e) => {
      const position = e.target.position;
      if (!position) {
        return;
      }

      // Store the selection before click
      const selection = currentSelectionRef.current;
      if (!selection) {
        return;
      }

      // Prevent Monaco from handling this click (prevents selection flash)
      e.event.preventDefault();
      e.event.stopPropagation();

      // Lock the selection
      lockSelectionRef.current = true;
      lockedSelectionRef.current = selection;

      // Prevent hover from updating selection for a longer time after click
      preventHoverRef.current = true;
      setTimeout(() => {
        preventHoverRef.current = false;
        lockSelectionRef.current = false;
        lockedSelectionRef.current = null;
      }, 1000);


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

        // Visual feedback: set multiple selections in editor and keep them visible
        const allSelections = multiSelectionsRef.current.map((item) => item.selection);
        if (allSelections.length > 0) {
          currentEditor.setSelections(allSelections);
          // Lock these selections temporarily
          lockSelectionRef.current = true;
          lockedSelectionRef.current = allSelections[0]; // Store primary selection
          setTimeout(() => {
            lockSelectionRef.current = false;
            lockedSelectionRef.current = null;
          }, 500);
        }
        
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
            navigator.clipboard.writeText(normalizedText)
              .then(() => {
                const selectionCount = multiSelectionsRef.current.length;
                const totalLines = normalizedLines.length;
                useAppStore.getState().setStatusMessage(`Copied ${selectionCount} selection${selectionCount !== 1 ? 's' : ''} (${totalLines} line${totalLines !== 1 ? 's' : ''})`);
                onCopy?.();
              })
              .catch((err) => {
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
            navigator.clipboard.writeText(normalizedText)
              .then(() => {
                const blockName = getBlockName(selection.startLineNumber);
                const lineCount = normalizedLines.length;
                useAppStore.getState().setStatusMessage(`Copied ${blockName} (${lineCount} line${lineCount !== 1 ? 's' : ''})`);
                
                // Restore selection after copy
                currentEditor.setSelection(selection);
                onCopy?.();
              })
              .catch((err) => {
                console.error('Failed to copy to clipboard:', err);
              });
          }
        }
      }
      
      // Restore selection after all processing
      currentEditor.setSelection(selection);
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
      if (selectionChangeDisposableRef.current) {
        selectionChangeDisposableRef.current.dispose();
        selectionChangeDisposableRef.current = null;
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
      currentSelectionRef.current = null;
      lastHoverLineRef.current = -1;
      multiSelectionsRef.current = [];
      isHoveringRef.current = false;
      lockSelectionRef.current = false;
      lockedSelectionRef.current = null;
    };
  }, [editor, enableQuickCopy]);
};
