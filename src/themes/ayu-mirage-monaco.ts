import * as monaco from 'monaco-editor';

// Ayu Mirage theme for Monaco Editor matching the custom Ace theme
export const ayuMirageTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Comments
    { token: 'comment', foreground: '5C6773', fontStyle: 'italic' },
    { token: 'comment.content', foreground: '5C6773', fontStyle: 'italic' },
    { token: 'comment.html', foreground: '5C6773', fontStyle: 'italic' },
    { token: 'comment.xml', foreground: '5C6773', fontStyle: 'italic' },

    // Tags & delimiters
    { token: 'metatag', foreground: '5CCFE6' },
    { token: 'metatag.content', foreground: '5CCFE6' },
    { token: 'tag', foreground: '5CCFE6' },
    { token: 'tag.html', foreground: '5CCFE6' },
    { token: 'tag.xml', foreground: '5CCFE6' },
    { token: 'tag.pug', foreground: '5CCFE6' },
    { token: 'entity.name.tag', foreground: '5CCFE6' },
    { token: 'meta.tag', foreground: '5CCFE6' },
    { token: 'tag.id', foreground: 'FFD173' },
    { token: 'tag.class', foreground: 'FFD173' },
    { token: 'delimiter', foreground: 'D9D7CE' },
    { token: 'delimiter.html', foreground: 'D9D7CE' },
    { token: 'delimiter.xml', foreground: 'D9D7CE' },
    { token: 'punctuation', foreground: 'D9D7CE' },
    { token: 'meta.brace', foreground: 'D9D7CE' },

    // Attributes
    { token: 'attribute.name', foreground: 'FFD173' },
    { token: 'attribute.name.html', foreground: 'FFD173' },
    { token: 'attribute.name.xml', foreground: 'FFD173' },
    { token: 'entity.other.attribute-name', foreground: 'FFD173' },
    { token: 'support.type.attribute', foreground: 'FFD173' },
    { token: 'attribute.delimiter', foreground: 'D9D7CE' },
    { token: 'attribute.value', foreground: 'D5FF80' },
    { token: 'attribute.value.html', foreground: 'D5FF80' },
    { token: 'attribute.value.xml', foreground: 'D5FF80' },

    // Strings
    { token: 'string', foreground: 'D5FF80' },
    { token: 'string.quoted', foreground: 'D5FF80' },
    { token: 'string.quoted.double', foreground: 'D5FF80' },
    { token: 'string.quoted.single', foreground: 'D5FF80' },
    { token: 'interpolation', foreground: '73D0FF' },
    { token: 'interpolation.delimiter', foreground: 'D9D7CE' },

    // Numbers & constants
    { token: 'number', foreground: 'BAE67E' },
    { token: 'constant.numeric', foreground: 'BAE67E' },
    { token: 'number.float', foreground: 'BAE67E' },
    { token: 'constant', foreground: '73D0FF' },
    { token: 'constant.language', foreground: '73D0FF' },
    { token: 'support.constant', foreground: '73D0FF' },

    // Keywords and storage
    { token: 'keyword', foreground: 'FFD173' },
    { token: 'keyword.flow', foreground: 'FFD173' },
    { token: 'keyword.control', foreground: 'FFD173' },
    { token: 'storage', foreground: 'FFD173' },
    { token: 'storage.type', foreground: 'FFD173' },
    { token: 'keyword.operator', foreground: 'D9D7CE' },

    // Functions & variables
    { token: 'entity.name.function', foreground: 'D9D7CE' },
    { token: 'support.function', foreground: '5CCFE6' },
    { token: 'variable', foreground: 'D9D7CE' },
    { token: 'variable.parameter', foreground: 'D9D7CE' },
    { token: 'entity.name.type', foreground: 'FFD173' },
    { token: 'entity.name.class', foreground: 'FFD173' },
    { token: 'support.class', foreground: 'FFD173' },
    { token: 'support.type', foreground: 'FFD173' },

    // Regex
    { token: 'string.regexp', foreground: 'F28779' },

    // Pug/Jade specific
    { token: 'entity.name.tag.pug', foreground: '5CCFE6' },
    { token: 'entity.name.tag.jade', foreground: '5CCFE6' },
    { token: 'meta.tag.other.pug', foreground: '5CCFE6' },
    { token: 'meta.tag.other.jade', foreground: '5CCFE6' },
    { token: 'entity.other.attribute-name.pug', foreground: 'FFD173' },
    { token: 'entity.other.attribute-name.jade', foreground: 'FFD173' },
    { token: 'entity.other.attribute-name.id.pug', foreground: 'FFD173' },
    { token: 'entity.other.attribute-name.id.jade', foreground: 'FFD173' },
    { token: 'entity.other.attribute-name.class.pug', foreground: 'FFD173' },
    { token: 'entity.other.attribute-name.class.jade', foreground: 'FFD173' },
    { token: 'string.interpolated.pug', foreground: 'D5FF80' },
    { token: 'string.interpolated.jade', foreground: 'D5FF80' },
    { token: 'punctuation.definition.tag.pug', foreground: 'D9D7CE' },
    { token: 'punctuation.definition.tag.jade', foreground: 'D9D7CE' },
    { token: 'meta.control.flow.pug', foreground: 'FFD173' },
    { token: 'meta.control.flow.jade', foreground: 'FFD173' },

    // Invalid
    { token: 'invalid', foreground: 'FF3333', background: 'F51818' },
  ],
  colors: {
    'editor.background': '#1F242E',
    'editor.foreground': '#d9d7ce',
    'editorLineNumber.foreground': '#8f9bb8',
    'editorLineNumber.activeForeground': '#d9d7ce',
    'editorCursor.foreground': '#FFD173',
    'editor.selectionBackground': '#33415e',
    'editor.inactiveSelectionBackground': '#273747',
    'editor.lineHighlightBackground': '#232834',
    'editorWhitespace.foreground': '#33415e',
    'editorIndentGuide.background': '#33415e',
    'editorIndentGuide.activeBackground': '#5c6773',
    'editor.findMatchBackground': '#33415e',
    'editor.findMatchHighlightBackground': '#273747',
    'editorGutter.background': '#1d2330',
    'editorGutter.border': '#2c3750',
    'editorWidget.background': '#1d2330',
    'editorWidget.border': '#2c3750',
    'editorSuggestWidget.background': '#1d2330',
    'editorSuggestWidget.border': '#2c3750',
    'editorHoverWidget.background': '#1d2330',
    'editorHoverWidget.border': '#2c3750',
    'scrollbarSlider.background': '#33415e88',
    'scrollbarSlider.hoverBackground': '#33415eaa',
    'scrollbarSlider.activeBackground': '#33415ecc',
  },
};

export const registerAyuMirageTheme = () => {
  monaco.editor.defineTheme('ayu-mirage', ayuMirageTheme);
};
