import { act, renderHook } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';

// Reset store state before each test using direct store manipulation
beforeEach(() => {
  const state = useAppStore.getState();
  state.closeAllFiles();
  state.clearToasts();
  state.setIsScriptsLoading(true);
  state.setIsFileProcessing(false);
});

describe('useAppStore', () => {
  describe('file management', () => {
    it('adds a file correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFile({
          id: 'test-1',
          name: 'test.svg',
          htmlContent: '<svg></svg>',
          pugContent: 'svg',
        });
      });

      expect(result.current.openFiles).toHaveLength(1);
      expect(result.current.openFiles[0].id).toBe('test-1');
      expect(result.current.activeFileId).toBe('test-1');
    });

    it('adds multiple files correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFiles([
          { id: 'test-1', name: 'test1.svg', htmlContent: '<svg></svg>', pugContent: 'svg' },
          { id: 'test-2', name: 'test2.svg', htmlContent: '<svg></svg>', pugContent: 'svg' },
        ]);
      });

      expect(result.current.openFiles).toHaveLength(2);
      expect(result.current.activeFileId).toBe('test-1');
    });

    it('removes a file correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFiles([
          { id: 'test-1', name: 'test1.svg', htmlContent: '<svg></svg>', pugContent: 'svg' },
          { id: 'test-2', name: 'test2.svg', htmlContent: '<svg></svg>', pugContent: 'svg' },
        ]);
      });

      act(() => {
        result.current.removeFile('test-1');
      });

      expect(result.current.openFiles).toHaveLength(1);
      expect(result.current.openFiles[0].id).toBe('test-2');
    });

    it('switches active file when current is removed', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFiles([
          { id: 'test-1', name: 'test1.svg', htmlContent: 'html1', pugContent: 'pug1' },
          { id: 'test-2', name: 'test2.svg', htmlContent: 'html2', pugContent: 'pug2' },
        ]);
      });

      act(() => {
        result.current.removeFile('test-1');
      });

      expect(result.current.activeFileId).toBe('test-2');
      expect(result.current.HTMLCode).toBe('html2');
    });

    it('updates file content correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFile({
          id: 'test-1',
          name: 'test.svg',
          htmlContent: '<svg></svg>',
          pugContent: 'svg',
        });
      });

      act(() => {
        result.current.updateFileContent('test-1', '<svg><rect/></svg>', 'svg\n  rect');
      });

      expect(result.current.openFiles[0].htmlContent).toBe('<svg><rect/></svg>');
      expect(result.current.HTMLCode).toBe('<svg><rect/></svg>');
    });

    it('reorders files correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFiles([
          { id: 'a', name: 'a.svg', htmlContent: '', pugContent: '' },
          { id: 'b', name: 'b.svg', htmlContent: '', pugContent: '' },
          { id: 'c', name: 'c.svg', htmlContent: '', pugContent: '' },
        ]);
      });

      act(() => {
        result.current.reorderFiles(['c', 'a', 'b']);
      });

      expect(result.current.openFiles.map((f) => f.id)).toEqual(['c', 'a', 'b']);
    });

    it('duplicates a file correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFile({
          id: 'test-1',
          name: 'test.svg',
          htmlContent: '<svg></svg>',
          pugContent: 'svg',
        });
      });

      act(() => {
        result.current.duplicateFile('test-1');
      });

      expect(result.current.openFiles).toHaveLength(2);
      expect(result.current.openFiles[1].name).toBe('test.svg (copy)');
      expect(result.current.openFiles[1].htmlContent).toBe('<svg></svg>');
    });

    it('closes all files correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFiles([
          { id: 'test-1', name: 'test1.svg', htmlContent: '', pugContent: '' },
          { id: 'test-2', name: 'test2.svg', htmlContent: '', pugContent: '' },
        ]);
      });

      act(() => {
        result.current.closeAllFiles();
      });

      expect(result.current.openFiles).toHaveLength(0);
      expect(result.current.activeFileId).toBeNull();
    });
  });

  describe('toast management', () => {
    it('adds a toast correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addToast({
          type: 'success',
          title: 'Test Toast',
          description: 'Test description',
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Toast');
      expect(result.current.toasts[0].type).toBe('success');
    });

    it('removes a toast correctly', () => {
      const { result } = renderHook(() => useAppStore());

      let toastId: string = '';
      act(() => {
        toastId = result.current.addToast({
          type: 'error',
          title: 'Error Toast',
          duration: 0, // Don't auto-dismiss
        });
      });

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('clears all toasts correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addToast({ type: 'info', title: 'Toast 1', duration: 0 });
        result.current.addToast({ type: 'info', title: 'Toast 2', duration: 0 });
        result.current.addToast({ type: 'info', title: 'Toast 3', duration: 0 });
      });

      act(() => {
        result.current.clearToasts();
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('limits toasts to max 5', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        for (let i = 0; i < 7; i++) {
          result.current.addToast({
            type: 'info',
            title: `Toast ${i}`,
            duration: 0,
          });
        }
      });

      expect(result.current.toasts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('loading state', () => {
    it('sets scripts loading state correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setIsScriptsLoading(false);
      });

      expect(result.current.isScriptsLoading).toBe(false);
    });

    it('sets file processing state correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setIsFileProcessing(true);
        result.current.setProcessingFileCount(5);
      });

      expect(result.current.isFileProcessing).toBe(true);
      expect(result.current.processingFileCount).toBe(5);
    });
  });

  describe('settings toggles', () => {
    it('toggles SVGO enabled correctly', () => {
      const { result } = renderHook(() => useAppStore());

      const initial = result.current.isSvgoEnabled;
      act(() => {
        result.current.setIsSvgoEnabled(!initial);
      });

      expect(result.current.isSvgoEnabled).toBe(!initial);
    });

    it('toggles enableSvgIdToClass correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setEnableSvgIdToClass(false);
      });

      expect(result.current.enableSvgIdToClass).toBe(false);
    });

    it('toggles SVGO plugin correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleSvgoPlugin('removeComments', false);
      });

      expect(result.current.svgoSettings.plugins.removeComments).toBe(false);
    });

    it('updates SVGO precision correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateSvgoPrecision('floatPrecision', 5);
      });

      expect(result.current.svgoSettings.floatPrecision).toBe(5);
    });
  });

  describe('getActiveFile', () => {
    it('returns null when no files are open', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.getActiveFile()).toBeNull();
    });

    it('returns the active file when one is open', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFile({
          id: 'test-1',
          name: 'test.svg',
          htmlContent: '<svg></svg>',
          pugContent: 'svg',
        });
      });

      const activeFile = result.current.getActiveFile();
      expect(activeFile).not.toBeNull();
      expect(activeFile?.id).toBe('test-1');
    });
  });
});
