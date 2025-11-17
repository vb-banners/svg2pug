import { useEffect } from 'react';
import type * as Monaco from 'monaco-editor';
import { useAppStore } from '../store/useAppStore';

export const useEditorCursor = (
  htmlEditor: Monaco.editor.IStandaloneCodeEditor | null,
  pugEditor: Monaco.editor.IStandaloneCodeEditor | null
) => {
  const setActiveEditor = useAppStore(state => state.setActiveEditor);
  const setHtmlCursorPosition = useAppStore(state => state.setHtmlCursorPosition);
  const setPugCursorPosition = useAppStore(state => state.setPugCursorPosition);
  const setHtmlSelectionInfo = useAppStore(state => state.setHtmlSelectionInfo);
  const setPugSelectionInfo = useAppStore(state => state.setPugSelectionInfo);

  useEffect(() => {
    if (!htmlEditor) return;

    const updateCursor = () => {
      const position = htmlEditor.getPosition();
      if (position) {
        setHtmlCursorPosition({
          line: position.lineNumber,
          column: position.column
        });
      }
    };

    const updateSelection = () => {
      const selection = htmlEditor.getSelection();
      if (selection && !selection.isEmpty()) {
        const model = htmlEditor.getModel();
        if (model) {
          const selectedText = model.getValueInRange(selection);
          const lines = selectedText.split('\n');
          setHtmlSelectionInfo({
            lineCount: lines.length,
            charCount: selectedText.length
          });
        }
      } else {
        setHtmlSelectionInfo(null);
      }
    };

    const onFocus = () => {
      setActiveEditor('html');
      updateCursor();
      updateSelection();
    };

    const cursorDisposable = htmlEditor.onDidChangeCursorPosition(updateCursor);
    const selectionDisposable = htmlEditor.onDidChangeCursorSelection(updateSelection);
    const focusDisposable = htmlEditor.onDidFocusEditorText(onFocus);

    updateCursor();
    updateSelection();

    return () => {
      cursorDisposable.dispose();
      selectionDisposable.dispose();
      focusDisposable.dispose();
    };
  }, [htmlEditor, setActiveEditor, setHtmlCursorPosition, setHtmlSelectionInfo]);

  useEffect(() => {
    if (!pugEditor) return;

    const updateCursor = () => {
      const position = pugEditor.getPosition();
      if (position) {
        setPugCursorPosition({
          line: position.lineNumber,
          column: position.column
        });
      }
    };

    const updateSelection = () => {
      const selection = pugEditor.getSelection();
      if (selection && !selection.isEmpty()) {
        const model = pugEditor.getModel();
        if (model) {
          const selectedText = model.getValueInRange(selection);
          const lines = selectedText.split('\n');
          setPugSelectionInfo({
            lineCount: lines.length,
            charCount: selectedText.length
          });
        }
      } else {
        setPugSelectionInfo(null);
      }
    };

    const onFocus = () => {
      setActiveEditor('pug');
      updateCursor();
      updateSelection();
    };

    const cursorDisposable = pugEditor.onDidChangeCursorPosition(updateCursor);
    const selectionDisposable = pugEditor.onDidChangeCursorSelection(updateSelection);
    const focusDisposable = pugEditor.onDidFocusEditorText(onFocus);

    updateCursor();
    updateSelection();

    return () => {
      cursorDisposable.dispose();
      selectionDisposable.dispose();
      focusDisposable.dispose();
    };
  }, [pugEditor, setActiveEditor, setPugCursorPosition, setPugSelectionInfo]);
};
