import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsOptions {
  onNewTab: () => void;
  onOpenFiles: () => void;
  onToggleSvgoMenu: () => void;
  onToggleHelp: () => void;
  onToggleQuickCopy?: () => void;
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for Mac Command key or Windows/Linux Ctrl key
    const modifierKey = event.metaKey || event.ctrlKey;
    const altKey = event.altKey;

    // Check if we're in Monaco editor by looking for the textarea Monaco uses
    const target = event.target as HTMLElement;
    const isInEditor = target?.tagName === 'TEXTAREA' && 
                       target?.classList?.contains('inputarea');
    
    if (isInEditor) {
      // ONLY handle our custom Quick Copy toggle, nothing else
      if (modifierKey && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        event.stopPropagation();
        if (options.onToggleQuickCopy) {
          options.onToggleQuickCopy();
        }
        return;
      }
      
      // Let Monaco handle absolutely everything else without any interference
      return;
    }

    // App-level shortcuts (outside editor)
    
    // ⌥⌘T or Alt+Ctrl+T - New Tab
    if (modifierKey && altKey && event.key.toLowerCase() === 't') {
      event.preventDefault();
      options.onNewTab();
      return;
    }

    // ⌥⌘O or Alt+Ctrl+O - Open Files
    if (modifierKey && altKey && event.key.toLowerCase() === 'o') {
      event.preventDefault();
      options.onOpenFiles();
      return;
    }

    // ⌥⌘S or Alt+Ctrl+S - Toggle SVGO Menu
    if (modifierKey && altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      options.onToggleSvgoMenu();
      return;
    }

    // ⌥⌘H or Alt+Ctrl+H - Toggle Help
    if (modifierKey && altKey && event.key.toLowerCase() === 'h') {
      event.preventDefault();
      options.onToggleHelp();
      return;
    }

    // ⌘⇧C or Ctrl+Shift+C - Toggle Quick Copy (global, when outside editor)
    if (modifierKey && event.shiftKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      if (options.onToggleQuickCopy) {
        options.onToggleQuickCopy();
      }
      return;
    }
  }, [options]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return null;
};
