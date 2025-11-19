import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

const MIN_PUG_RATIO = 0.1;
const MAX_PUG_RATIO = 0.9;
const SPLIT_RESIZE_TOLERANCE = 14;

export const useSplitPane = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const isResizingRef = useRef(false);

  const { pugWidthRatio, setPugWidthRatio, setIsResizingSplit, showPreview } = useAppStore();

  const handleSplitMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    isResizingRef.current = true;
    setIsResizingSplit(true);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [setIsResizingSplit]);

  const rafIdRef = useRef<number | null>(null);

  const handleDocumentMouseMove = useCallback((event: MouseEvent) => {
    if (!isResizingRef.current || !sectionRef.current) {
      return;
    }

    // Cancel previous frame to prevent too many updates
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Use requestAnimationFrame to throttle resize updates
    rafIdRef.current = requestAnimationFrame(() => {
      if (!sectionRef.current) return;

      const sectionRect = sectionRef.current.getBoundingClientRect();
      const sectionWidth = sectionRect.width;
      const mouseX = event.clientX - sectionRect.left;

      let newHtmlRatio = mouseX / sectionWidth;
      newHtmlRatio = Math.max(1 - MAX_PUG_RATIO, Math.min(1 - MIN_PUG_RATIO, newHtmlRatio));

      const newPugRatio = 1 - newHtmlRatio;
      setPugWidthRatio(newPugRatio);
      rafIdRef.current = null;
    });
  }, [setPugWidthRatio]);

  const handleDocumentMouseUp = useCallback(() => {
    if (isResizingRef.current) {
      isResizingRef.current = false;
      setIsResizingSplit(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [setIsResizingSplit]);

  const handleSplitDoubleClick = useCallback(() => {
    setPugWidthRatio(0.5);
  }, [setPugWidthRatio]);

  useEffect(() => {
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [handleDocumentMouseMove, handleDocumentMouseUp]);

  const getSplitHandleStyle = useCallback(() => {
    const htmlWidthRatio = 1 - pugWidthRatio;
    return {
      left: `${htmlWidthRatio * 100}%`
    };
  }, [pugWidthRatio]);

  const getHtmlEditorStyle = useCallback(() => {
    // When preview is hidden, the left section should take full width
    if (!showPreview) {
      return {
        width: '100%'
      };
    }
    const htmlWidthRatio = 1 - pugWidthRatio;
    return {
      width: `${htmlWidthRatio * 100}%`
    };
  }, [pugWidthRatio, showPreview]);

  const getPugEditorStyle = useCallback(() => {
    return {
      width: `${pugWidthRatio * 100}%`
    };
  }, [pugWidthRatio]);

  return {
    sectionRef,
    handleSplitMouseDown,
    handleSplitDoubleClick,
    getSplitHandleStyle,
    getHtmlEditorStyle,
    getPugEditorStyle,
    splitResizeTolerance: SPLIT_RESIZE_TOLERANCE,
  };
};
