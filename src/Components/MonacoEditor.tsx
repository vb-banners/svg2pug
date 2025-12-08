import React, { useRef } from 'react';
import Editor, { OnMount, Monaco, loader } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { ayuMirageTheme } from '../themes/ayu-mirage-monaco';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language: 'html' | 'jade' | 'pug' | 'xml';
  height?: string;
  readOnly?: boolean;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => void;
}

const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/g;

// Register the theme globally before Monaco loads
loader.init().then((monacoInstance) => {
  monacoInstance.editor.defineTheme('ayu-mirage', ayuMirageTheme);
});

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language,
  height = '100%',
  readOnly = false,
  options = {},
  onMount,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const safeValue = value ?? '';
  const previousValueRef = useRef<string>(safeValue);

  const updateHexColorDecorations = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: Monaco
  ) => {
    const model = editor.getModel();
    if (!model) return;

    const text = model.getValue();
    const matches: monaco.editor.IModelDeltaDecoration[] = [];
    let match;

    // Clean up old color styles
    const oldStyles = document.querySelectorAll('style[data-hex-color]');
    oldStyles.forEach(style => style.remove());

    HEX_COLOR_REGEX.lastIndex = 0;
    while ((match = HEX_COLOR_REGEX.exec(text)) !== null) {
      const startPos = model.getPositionAt(match.index);
      const endPos = model.getPositionAt(match.index + match[0].length);
      const colorValue = match[0];
      const colorId = colorValue.replace('#', 'hex-').replace(/[^a-zA-Z0-9-]/g, '');

      matches.push({
        range: new monacoInstance.Range(
          startPos.lineNumber,
          startPos.column,
          endPos.lineNumber,
          endPos.column
        ),
        options: {
          inlineClassName: `hex-color-inline ${colorId}`,
        },
      });

      // Inject CSS to color the hex value text itself only
      const style = document.createElement('style');
      style.setAttribute('data-hex-color', colorValue);
      style.textContent = `
        .${colorId} { 
          color: ${colorValue} !important; 
          font-weight: 600; 
        }
        .${colorId}::before { 
          content: none !important; 
          display: none !important; 
        }
      `;
      document.head.appendChild(style);
    }

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, matches);
  };

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;

    // Ensure theme is set
    monacoInstance.editor.setTheme('ayu-mirage');

    // Sublime-flavored keymap for frequently used shortcuts
    const { KeyMod, KeyCode } = monacoInstance;
    const bind = (
      keybinding: number,
      commandId: string,
      args?: any,
    ) => {
      editor.addCommand(keybinding, () => {
        editor.trigger('', commandId, args ?? null);
      });
    };

    // Multi-cursor / selection
    bind(KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.UpArrow, 'editor.action.insertCursorAbove');
    bind(KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.DownArrow, 'editor.action.insertCursorBelow');
    bind(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyL, 'editor.action.insertCursorAtEndOfEachLineSelected'); // split selection into lines
    bind(KeyMod.CtrlCmd | KeyCode.KeyD, 'editor.action.addSelectionToNextFindMatch');
    bind(KeyMod.CtrlCmd | KeyMod.WinCtrl | KeyCode.KeyG, 'editor.action.selectHighlights'); // select all occurrences

    // Line actions
    bind(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyD, 'editor.action.copyLinesDownAction');
    bind(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyK, 'editor.action.deleteLines');
    bind(KeyMod.CtrlCmd | KeyCode.Enter, 'editor.action.insertLineAfter');
    bind(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Enter, 'editor.action.insertLineBefore');
    bind(KeyMod.CtrlCmd | KeyCode.KeyL, 'expandLineSelection');
    bind(KeyMod.CtrlCmd | KeyCode.KeyA, 'editor.action.selectAll');
    bind(KeyMod.CtrlCmd | KeyCode.KeyJ, 'editor.action.joinLines');
    bind(KeyMod.CtrlCmd | KeyMod.WinCtrl | KeyCode.UpArrow, 'editor.action.moveLinesUpAction');
    bind(KeyMod.CtrlCmd | KeyMod.WinCtrl | KeyCode.DownArrow, 'editor.action.moveLinesDownAction');
    bind(KeyMod.CtrlCmd | KeyCode.KeyZ, 'undo');
    bind(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ, 'redo');
    bind(KeyMod.CtrlCmd | KeyCode.KeyY, 'redo');

    // Delete to boundaries
    bind(KeyMod.CtrlCmd | KeyCode.Backspace, 'deleteAllLeft');
    bind(KeyMod.CtrlCmd | KeyCode.Delete, 'deleteAllRight');

    // Find / navigation
    bind(KeyMod.CtrlCmd | KeyCode.KeyG, 'editor.action.nextMatchFindAction');
    bind(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyG, 'editor.action.previousMatchFindAction');
    bind(KeyMod.CtrlCmd | KeyCode.KeyM, 'editor.action.jumpToBracket');

    // Fold / unfold
    bind(KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.BracketLeft, 'editor.fold');
    bind(KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.BracketRight, 'editor.unfold');

    // Comments
    bind(KeyMod.CtrlCmd | KeyCode.Slash, 'editor.action.commentLine');
    bind(KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.Slash, 'editor.action.blockComment');

    // Case transforms (chords)
    bind(KeyMod.chord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyMod.CtrlCmd | KeyCode.KeyU), 'editor.action.transformToUppercase');
    bind(KeyMod.chord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyMod.CtrlCmd | KeyCode.KeyL), 'editor.action.transformToLowercase');

    // Prevent browser tab shortcuts from hijacking when editor is focused
    editor.onKeyDown((e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      const stop = () => {
        e.preventDefault();
        e.stopPropagation();
      };

      // Undo / Redo
      if (!e.shiftKey && e.keyCode === KeyCode.KeyZ) {
        stop();
        editor.trigger('', 'undo', null);
        return;
      }
      if (e.shiftKey && e.keyCode === KeyCode.KeyZ) {
        stop();
        editor.trigger('', 'redo', null);
        return;
      }
      if (!e.shiftKey && e.keyCode === KeyCode.KeyY) {
        stop();
        editor.trigger('', 'redo', null);
        return;
      }

      // Multi-cursor
      if (e.altKey && e.keyCode === KeyCode.UpArrow) {
        stop();
        editor.trigger('', 'editor.action.insertCursorAbove', null);
      } else if (e.altKey && e.keyCode === KeyCode.DownArrow) {
        stop();
        editor.trigger('', 'editor.action.insertCursorBelow', null);
      } else if (e.shiftKey && e.keyCode === KeyCode.KeyL) {
        stop();
        editor.trigger('', 'editor.action.insertCursorAtEndOfEachLineSelected', null);
      } else if (!e.shiftKey && e.keyCode === KeyCode.KeyD) {
        stop();
        editor.trigger('', 'editor.action.addSelectionToNextFindMatch', null);
      } else if (e.ctrlKey && e.keyCode === KeyCode.KeyG) {
        stop();
        editor.trigger('', 'editor.action.selectHighlights', null);
      }

      // Line ops
      else if (e.shiftKey && e.keyCode === KeyCode.KeyD) {
        stop();
        editor.trigger('', 'editor.action.copyLinesDownAction', null);
      } else if (e.shiftKey && e.keyCode === KeyCode.KeyK) {
        stop();
        editor.trigger('', 'editor.action.deleteLines', null);
      } else if (!e.shiftKey && e.keyCode === KeyCode.Enter) {
        stop();
        editor.trigger('', 'editor.action.insertLineAfter', null);
      } else if (e.shiftKey && e.keyCode === KeyCode.Enter) {
        stop();
        editor.trigger('', 'editor.action.insertLineBefore', null);
      } else if (!e.shiftKey && e.keyCode === KeyCode.KeyL) {
        stop();
        editor.trigger('', 'expandLineSelection', null);
      } else if (!e.shiftKey && e.keyCode === KeyCode.KeyA) {
        stop();
        editor.trigger('', 'editor.action.selectAll', null);
      } else if (e.ctrlKey && e.keyCode === KeyCode.UpArrow) {
        stop();
        editor.trigger('', 'editor.action.moveLinesUpAction', null);
      } else if (e.ctrlKey && e.keyCode === KeyCode.DownArrow) {
        stop();
        editor.trigger('', 'editor.action.moveLinesDownAction', null);
      } else if (!e.shiftKey && e.keyCode === KeyCode.KeyJ) {
        stop();
        editor.trigger('', 'editor.action.joinLines', null);
      }

      // Delete to edges
      else if (e.keyCode === KeyCode.Backspace && !e.shiftKey) {
        stop();
        editor.trigger('', 'deleteAllLeft', null);
      } else if (e.keyCode === KeyCode.Delete && !e.shiftKey) {
        stop();
        editor.trigger('', 'deleteAllRight', null);
      }

      // Find
      else if (!e.shiftKey && e.keyCode === KeyCode.KeyG) {
        stop();
        editor.trigger('', 'editor.action.nextMatchFindAction', null);
      } else if (e.shiftKey && e.keyCode === KeyCode.KeyG) {
        stop();
        editor.trigger('', 'editor.action.previousMatchFindAction', null);
      } else if (e.keyCode === KeyCode.KeyM) {
        stop();
        editor.trigger('', 'editor.action.jumpToBracket', null);
      }

      // Copy whole line when no selection (Cmd/Ctrl+C)
      else if (!e.shiftKey && e.keyCode === KeyCode.KeyC) {
        const selection = editor.getSelection();
        const model = editor.getModel();
        if (!model || !selection) return;

        const hasSelection = !selection.isEmpty();
        if (hasSelection) {
          stop();
          editor.trigger('', 'editor.action.clipboardCopyAction', null);
          return;
        }

        const lineNumber = selection.startLineNumber;
        const lineText = model.getLineContent(lineNumber) + model.getEOL();
        stop();

        // Try modern clipboard first
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(lineText).catch(() => {
            const fullLineRange = new monacoInstance.Range(
              lineNumber,
              1,
              lineNumber,
              model.getLineMaxColumn(lineNumber)
            );
            editor.setSelection(fullLineRange);
            editor.trigger('', 'editor.action.clipboardCopyAction', null);
            editor.setSelection(selection);
          });
        } else {
          const fullLineRange = new monacoInstance.Range(
            lineNumber,
            1,
            lineNumber,
            model.getLineMaxColumn(lineNumber)
          );
          editor.setSelection(fullLineRange);
          editor.trigger('', 'editor.action.clipboardCopyAction', null);
          editor.setSelection(selection);
        }
      }

      // Fold
      else if (e.altKey && e.keyCode === KeyCode.BracketLeft) {
        stop();
        editor.trigger('', 'editor.fold', null);
      } else if (e.altKey && e.keyCode === KeyCode.BracketRight) {
        stop();
        editor.trigger('', 'editor.unfold', null);
      }

      // Comments
      else if (!e.shiftKey && e.keyCode === KeyCode.Slash) {
        stop();
        editor.trigger('', 'editor.action.commentLine', null);
      } else if (e.altKey && e.keyCode === KeyCode.Slash) {
        stop();
        editor.trigger('', 'editor.action.blockComment', null);
      }
    });

    // Add hex color decorations
    updateHexColorDecorations(editor, monacoInstance);

    // Update decorations on content change
    editor.onDidChangeModelContent(() => {
      updateHexColorDecorations(editor, monacoInstance);
    });

    // Call custom onMount if provided
    if (onMount) {
      onMount(editor, monacoInstance);
    }
  };

  // Update editor value when prop changes (for tab switching)
  React.useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      const newValue = safeValue;
      if (currentValue !== newValue) {
        const model = editorRef.current.getModel();
        if (model) {
          // Use pushEditOperations to preserve undo/redo history
          const fullRange = model.getFullModelRange();
          model.pushEditOperations(
            [],
            [{ range: fullRange, text: newValue }],
            () => null
          );
        }
      }
    }
    previousValueRef.current = safeValue;
  }, [safeValue]);

  const handleBeforeMount = (monacoInstance: Monaco) => {
    // Define the theme before the editor mounts
    monacoInstance.editor.defineTheme('ayu-mirage', ayuMirageTheme);
    
    // Register a lightweight Pug language so Monaco can colorize indentation-based syntax
    const languages = monacoInstance.languages.getLanguages();
    const hasPug = languages.some(lang => lang.id === 'pug');

    // Always register/override to ensure our tokenizer is used
    if (!hasPug) {
      monacoInstance.languages.register({
        id: 'pug',
        aliases: ['Pug', 'pug', 'Jade', 'jade'],
        extensions: ['.pug', '.jade'],
      });
    }

    // Always set language configuration and tokenizer (even if language exists)
    monacoInstance.languages.setLanguageConfiguration('pug', {
        comments: {
          lineComment: '//',
          blockComment: ['//- ', ''],
        },
        brackets: [
          ['(', ')'],
          ['[', ']'],
        ],
        autoClosingPairs: [
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: '(', close: ')' },
          { open: '[', close: ']' },
        ],
        surroundingPairs: [
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: '(', close: ')' },
          { open: '[', close: ']' },
        ],
      });

      monacoInstance.languages.setMonarchTokensProvider('pug', {
        defaultToken: '',
        tokenPostfix: '.pug',
        
        brackets: [
          { open: '(', close: ')', token: 'delimiter.parenthesis' },
          { open: '[', close: ']', token: 'delimiter.square' },
        ],
        
        keywords: [
          'if', 'else', 'unless', 'case', 'when', 'default',
          'each', 'while', 'mixin', 'block', 'extends', 'include',
          'append', 'prepend', 'for', 'in'
        ],
        
        tokenizer: {
          root: [
            // Comments
            [/\/\/.*$/, 'comment'],
            [/\/\/-.*$/, 'comment'],
            
            // Doctype
            [/^\s*doctype\s+.*$/, 'keyword'],
            
            // Control flow keywords
            [/^\s*(?:if|else|unless|case|when|default|each|while|for|mixin|block|extends|include|append|prepend)\b/, 'keyword'],
            
            // Tags at start of line
            [/^\s*[a-zA-Z][\w-]*/, 'entity.name.tag.pug'],
            
            // ID selectors
            [/#[\w-]+/, 'entity.other.attribute-name.id.pug'],
            
            // Class selectors  
            [/\.[\w-]+/, 'entity.other.attribute-name.class.pug'],
            
            // Attributes in parentheses
            [/\(/, { token: 'punctuation.definition.tag.pug', next: '@attributes' }],
            
            // Quoted strings
            [/"(?:[^"\\]|\\.)*"/, 'string.quoted.double'],
            [/'(?:[^'\\]|\\.)*'/, 'string.quoted.single'],
            
            // Numbers
            [/\b\d+(?:\.\d+)?\b/, 'number'],
            
            // Hex colors
            [/#[0-9a-fA-F]{3,8}\b/, 'string'],
            
            // Any other content
            [/./, ''],
          ],
          
          attributes: [
            // Close parenthesis
            [/\)/, { token: 'punctuation.definition.tag.pug', next: '@pop' }],
            
            // Attribute name followed by equals
            [/[\w-]+\s*=\s*/, 'entity.other.attribute-name.pug'],
            
            // Quoted attribute values
            [/"(?:[^"\\]|\\.)*"/, 'string.quoted.double'],
            [/'(?:[^'\\]|\\.)*'/, 'string.quoted.single'],
            
            // Standalone attribute names (boolean attributes)
            [/[\w-]+(?=\s*[,\)])/, 'entity.other.attribute-name.pug'],
            
            // Hex colors in attributes
            [/#[0-9a-fA-F]{3,8}\b/, 'string'],
            
            // Unquoted values (numbers, identifiers, etc.)
            [/[^\s,\)'"=]+/, 'string'],
            
            // Separators
            [/,/, 'punctuation'],
            [/\s+/, ''],
          ],
        },
      });
  };

  const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    fontSize: 17,
    fontFamily: 'Fira Code, Menlo, Monaco, Courier New, monospace',
    fontWeight: '500',
    lineHeight: 22,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: false,
    colorDecorators: false,
    wordWrap: 'off',
    readOnly,
    theme: 'ayu-mirage',
    renderWhitespace: 'all',
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: false,
    },
    // Multi-cursor support
    multiCursorModifier: 'alt',
    multiCursorMergeOverlapping: true,
    multiCursorPaste: 'spread',
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never',
      seedSearchStringFromSelection: 'always',
    },
    // Ensure undo/redo is enabled
    ...options,
  };

  return (
    <Editor
      height={height}
      language={language === 'jade' ? 'pug' : language}
      value={safeValue}
      onChange={onChange}
      beforeMount={handleBeforeMount}
      onMount={handleEditorDidMount}
      options={defaultOptions}
      theme="ayu-mirage"
    />
  );
};

export default MonacoEditor;
