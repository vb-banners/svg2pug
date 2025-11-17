import React, { useRef } from 'react';
import Editor, { OnMount, Monaco, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
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
        editorRef.current.setValue(newValue);
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
