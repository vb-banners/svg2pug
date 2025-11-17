import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ControlsPosition } from '../types/FileTab';

export const useFloatingControls = () => {
  const floatingControlsRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const { controlsPosition, setControlsPosition, setIsControlsDragging } = useAppStore();

  const handleControlsMouseDown = useCallback((event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button, input, select, label')) {
      return;
    }

    event.preventDefault();
    isDraggingRef.current = true;
    setIsControlsDragging(true);

    const controls = floatingControlsRef.current;
    if (controls) {
      const rect = controls.getBoundingClientRect();
      dragOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    document.body.style.userSelect = 'none';
  }, [setIsControlsDragging]);

  const handleDocumentMouseMove = useCallback((event: MouseEvent) => {
    if (!isDraggingRef.current || !floatingControlsRef.current) {
      return;
    }

    const newX = event.clientX - dragOffsetRef.current.x;
    const newY = event.clientY - dragOffsetRef.current.y;

    // Constrain to viewport
    const maxX = window.innerWidth - floatingControlsRef.current.offsetWidth;
    const maxY = window.innerHeight - floatingControlsRef.current.offsetHeight;

    const position: ControlsPosition = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };

    setControlsPosition(position);
  }, [setControlsPosition]);

  const handleDocumentMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsControlsDragging(false);
      document.body.style.userSelect = '';
    }
  }, [setIsControlsDragging]);

  useEffect(() => {
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [handleDocumentMouseMove, handleDocumentMouseUp]);

  const getControlsStyle = useCallback(() => {
    if (!controlsPosition) {
      return {};
    }

    return {
      position: 'fixed' as const,
      left: `${controlsPosition.x}px`,
      top: `${controlsPosition.y}px`,
      right: 'auto',
      bottom: 'auto'
    };
  }, [controlsPosition]);

  return {
    floatingControlsRef,
    handleControlsMouseDown,
    getControlsStyle,
  };
};
