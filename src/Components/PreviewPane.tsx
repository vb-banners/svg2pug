import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select';
import { Button } from './ui/button';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface PreviewPaneProps {
  htmlContent: string;
  fileName?: string;
  fileId?: string;
  onContentSizeChange?: (width: number, height: number) => void;
  highlightLines?: number[];
  isCopied?: boolean;
  originalHtml?: string;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ htmlContent, fileName, fileId, onContentSizeChange, highlightLines, isCopied, originalHtml }) => {
  const previewScale = useAppStore(state => state.previewScale);
  const setPreviewScale = useAppStore(state => state.setPreviewScale);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const gestureStartScaleRef = useRef<number>(1);
  const [contentHeight, setContentHeight] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Send highlight message to iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'highlight-lines',
        lines: highlightLines,
        isCopied: isCopied
      }, '*');
    }
  }, [highlightLines, isCopied]);

  // Reset zoom when switching files
  useEffect(() => {
    setPreviewScale(1);
  }, [fileId, setPreviewScale]);

  // Parse SVG dimensions directly from content
  useEffect(() => {
    if (!htmlContent) return;

    const extractDimensionsFromSvg = (svg: Element) => {
        let w = 0;
        let h = 0;
        
        const widthAttr = svg.getAttribute('width');
        const heightAttr = svg.getAttribute('height');
        const viewBox = svg.getAttribute('viewBox');

        // Priority 1: ViewBox
        if (viewBox) {
            const parts = viewBox.split(/[\s,]+/).filter(Boolean).map(parseFloat);
            if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
                w = parts[2];
                h = parts[3];
            }
        }
        
        // Priority 2: Width attribute (if not set by viewBox)
        if (!w && widthAttr) {
            if (!widthAttr.endsWith('%')) {
                w = parseFloat(widthAttr);
            }
        }
        
        // Priority 2: Height attribute (if not set by viewBox)
        if (!h && heightAttr) {
            if (!heightAttr.endsWith('%')) {
                h = parseFloat(heightAttr);
            }
        }
        
        if (w > 0 && h > 0) return { width: w, height: h };
        return null;
    };

    const extractSvgDimensions = (content: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const svg = doc.querySelector('svg');
        
        if (!svg) {
            // If no SVG found in content (e.g. stripped), try originalHtml
            if (originalHtml) {
                const originalDoc = parser.parseFromString(originalHtml, 'text/html');
                const originalSvg = originalDoc.querySelector('svg');
                if (originalSvg) {
                    return extractDimensionsFromSvg(originalSvg);
                }
            }
            return null;
        }
        
        return extractDimensionsFromSvg(svg);
    };

    const dims = extractSvgDimensions(htmlContent);
    if (dims) {
        setContentWidth(dims.width);
        setContentHeight(dims.height);
        onContentSizeChange?.(dims.width, dims.height);
    }
  }, [htmlContent, onContentSizeChange, originalHtml]);

  // Constants
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 10.0;
  const ZOOM_SENSITIVITY = 0.005;

  // Checkerboard pattern for transparency
  const checkerboardStyle = {
    backgroundImage: `
      linear-gradient(45deg, #2a2f3a 25%, transparent 25%),
      linear-gradient(-45deg, #2a2f3a 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #2a2f3a 75%),
      linear-gradient(-45deg, transparent 75%, #2a2f3a 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    backgroundColor: '#1E2431'
  };

  const srcDoc = useMemo(() => {
    // Cache buster to ensure iframe updates
    const timestamp = Date.now();
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="version" content="${timestamp}">
          <style>
            html {
              overflow: hidden; /* Let the parent iframe handle scrolling */
              height: auto;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: "Plus Jakarta Sans", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #D9D7CE;
              background-color: transparent; /* Allow checkerboard to show through */
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              width: fit-content;
              min-width: 100%;
            }
            /* Default SVG styles to prevent collapse/explosion */
            svg {
              display: block;
              max-width: 100%;
              height: auto;
              margin: 0;
            }
            
            /* Hide scrollbar */
            ::-webkit-scrollbar { display: none; }
            * { box-sizing: border-box; }
          </style>
          <script>
            // Suppress ResizeObserver errors inside iframe
            const resizeObserverLoopErr = 'ResizeObserver loop completed with undelivered notifications';
            const resizeObserverLoopErr2 = 'ResizeObserver loop limit exceeded';
            
            window.addEventListener('error', (e) => {
              if (
                e.message.includes(resizeObserverLoopErr) ||
                e.message.includes(resizeObserverLoopErr2)
              ) {
                e.stopImmediatePropagation();
                e.preventDefault();
              }
            }, { capture: true });
            
            window.onerror = (message) => {
              const msg = typeof message === 'string' ? message : '';
              if (
                msg.includes(resizeObserverLoopErr) ||
                msg.includes(resizeObserverLoopErr2)
              ) {
                return true;
              }
              return false;
            };

            window.addEventListener('DOMContentLoaded', () => {
              // 1. Clean up XML/DOCTYPE text nodes that might have rendered
              const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
              const nodesToRemove = [];
              while (walker.nextNode()) {
                const node = walker.currentNode;
                if (node.nodeValue && (
                  node.nodeValue.trim().startsWith('?xml') || 
                  node.nodeValue.trim().startsWith('<!DOCTYPE') ||
                  node.nodeValue.includes('xml version=')
                )) {
                  nodesToRemove.push(node);
                }
              }
              nodesToRemove.forEach(n => n.remove());

              // 2. Fix SVG sizing and alignment
              const svg = document.querySelector('svg');
              if (svg) {
                // Remove explicit width/height attributes ONLY if they are percentage-based
                // This allows us to fall back to viewBox or preserve pixel values
                let hasWidth = svg.hasAttribute('width');
                let hasHeight = svg.hasAttribute('height');
                
                if (hasWidth && svg.getAttribute('width').includes('%')) {
                   svg.removeAttribute('width');
                   hasWidth = false;
                }
                if (hasHeight && svg.getAttribute('height').includes('%')) {
                   svg.removeAttribute('height');
                   hasHeight = false;
                }

                // Ensure style.width/height are set if attributes exist (for reportSize)
                if (hasWidth) {
                   const w = svg.getAttribute('width');
                   if (w) svg.style.width = w.match(/^\d+(\.\d+)?$/) ? w + 'px' : w;
                }
                if (hasHeight) {
                   const h = svg.getAttribute('height');
                   if (h) svg.style.height = h.match(/^\d+(\.\d+)?$/) ? h + 'px' : h;
                }
                
                // Force left alignment (default)
                svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');

                // Set intrinsic size based on viewBox if dimensions are missing
                if (svg.hasAttribute('viewBox')) {
                  const viewBox = svg.getAttribute('viewBox').split(/[\s,]+/).filter(Boolean);
                  if (viewBox.length === 4) {
                    const width = parseFloat(viewBox[2]);
                    const height = parseFloat(viewBox[3]);
                    
                    if (!hasWidth && !isNaN(width)) {
                      svg.setAttribute('width', width);
                      svg.style.width = width + 'px';
                    }
                    if (!hasHeight && !isNaN(height)) {
                      svg.setAttribute('height', height);
                      svg.style.height = height + 'px';
                    }
                  }
                }
                
                // Ensure it has style for responsiveness
                svg.style.display = 'block';
                svg.style.margin = '0';
                svg.style.maxWidth = '100%';
                svg.style.height = 'auto';
              }

              // Report size changes
              const reportSize = () => {
                 let width = 0;
                 let height = 0;
                 
                 const svgEl = document.querySelector('svg');
                 if (svgEl) {
                    // Priority 1: ViewBox
                    if (svgEl.hasAttribute('viewBox')) {
                         const viewBox = svgEl.getAttribute('viewBox').split(/[\s,]+/).filter(Boolean);
                         if (viewBox.length === 4) {
                             width = parseFloat(viewBox[2]);
                             height = parseFloat(viewBox[3]);
                         }
                    }

                    // Priority 2: Explicit pixel style width/height (only if not set by viewBox)
                    if ((!width || width <= 0) && svgEl.style.width && svgEl.style.width.endsWith('px')) {
                        width = parseFloat(svgEl.style.width);
                    }
                    if ((!height || height <= 0) && svgEl.style.height && svgEl.style.height.endsWith('px')) {
                        height = parseFloat(svgEl.style.height);
                    }

                    // Priority 3: Width/Height attributes (only if not set)
                    if (!width || width <= 0) {
                        if (svgEl.hasAttribute('width')) {
                            const w = svgEl.getAttribute('width');
                            if (w) {
                                if (w.match(/^\d+(\.\d+)?$/)) width = parseFloat(w);
                                else if (w.endsWith('px')) width = parseFloat(w);
                            }
                        }
                    }
                    if (!height || height <= 0) {
                        if (svgEl.hasAttribute('height')) {
                            const h = svgEl.getAttribute('height');
                            if (h) {
                                if (h.match(/^\d+(\.\d+)?$/)) height = parseFloat(h);
                                else if (h.endsWith('px')) height = parseFloat(h);
                            }
                        }
                    }
                    
                    // Fallback: Measured dimensions
                    if (!width || width <= 0) {
                        const rect = svgEl.getBoundingClientRect();
                        if (rect.width > 0) width = rect.width;
                    }
                    if (!height || height <= 0) {
                         const rect = svgEl.getBoundingClientRect();
                         if (rect.height > 0) height = rect.height;
                         else height = document.body.scrollHeight;
                    }

                 } else {
                    // For non-SVG content (HTML)
                    const scrollWidth = document.body.scrollWidth;
                    const scrollHeight = document.body.scrollHeight;
                    
                    height = scrollHeight;
                    
                    // Only report width if it exceeds the viewport (meaning it needs more space)
                    // Otherwise report 0 to let the container dictate width (responsive behavior)
                    if (scrollWidth > window.innerWidth) {
                        width = scrollWidth;
                    }
                 }
                 
                 window.parent.postMessage({ type: 'preview-size', width, height }, '*');
              };

              const resizeObserver = new ResizeObserver(() => {
                setTimeout(reportSize, 0);
              });
              resizeObserver.observe(document.body);
              if (svg) resizeObserver.observe(svg);
              
              // Also call it immediately
              reportSize();
            });

            // Handle zoom via Ctrl/Cmd + Wheel (Pinch) inside iframe
            window.addEventListener('wheel', (e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                window.parent.postMessage({
                  type: 'preview-zoom',
                  deltaY: e.deltaY
                }, '*');
              } else {
                // Forward normal scroll events to parent for panning
                e.preventDefault();
                window.parent.postMessage({
                  type: 'preview-scroll',
                  deltaX: e.deltaX,
                  deltaY: e.deltaY
                }, '*');
              }
            }, { passive: false });

            // Handle Safari Gestures (Pinch)
            document.addEventListener('gesturestart', function(e) {
              e.preventDefault();
              window.parent.postMessage({ type: 'preview-gesture-start' }, '*');
            });
            document.addEventListener('gesturechange', function(e) {
              e.preventDefault();
              window.parent.postMessage({ 
                type: 'preview-gesture-change', 
                scale: e.scale 
              }, '*');
            });
            document.addEventListener('gestureend', function(e) {
              e.preventDefault();
            });

            // Handle highlight message
            window.addEventListener('message', (e) => {
              if (e.data.type === 'highlight-lines') {
                const lines = e.data.lines || [];
                const isCopied = e.data.isCopied || false;
                
                // Remove previous highlights
                document.querySelectorAll('.pug-highlight').forEach(el => {
                  el.classList.remove('pug-highlight');
                  el.style.outline = '';
                  el.style.outlineOffset = '';
                  el.style.backgroundColor = '';
                  el.style.transition = '';
                });
                
                if (Array.isArray(lines) && lines.length > 0) {
                  const outlineColor = isCopied ? '#CAFF6C' : '#FFC94F';
                  const bgColor = isCopied ? 'rgba(202, 255, 108, 0.2)' : 'rgba(255, 201, 79, 0.2)';
                  
                  lines.forEach(line => {
                    // Try to find exact match or closest parent
                    // Since Pug lines map to elements, we look for data-pug-line
                    const el = document.querySelector(\`[data-pug-line="\${line}"]\`);
                    if (el) {
                      el.classList.add('pug-highlight');
                      el.style.transition = 'all 0.2s ease';
                      el.style.outline = \`2px solid \${outlineColor}\`;
                      el.style.outlineOffset = '1px';
                      el.style.backgroundColor = bgColor;
                    }
                  });
                }
              }
            });
          </script>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;
  }, [htmlContent]);

  // Measure container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      // Wrap in requestAnimationFrame to avoid ResizeObserver loop errors
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) return;
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Keep a ref of previewScale to use in event handlers without triggering re-binds
  const previewScaleRef = useRef(previewScale);
  useEffect(() => {
    previewScaleRef.current = previewScale;
  }, [previewScale]);

  const handleZoom = useCallback((deltaY: number) => {
    const currentScale = previewScaleRef.current;
    const zoomFactor = Math.exp(-deltaY * ZOOM_SENSITIVITY);
    const newScale = currentScale * zoomFactor;
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setPreviewScale(clampedScale);
  }, [setPreviewScale]);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'preview-zoom') {
        handleZoom(event.data.deltaY);
      } else if (event.data?.type === 'preview-scroll') {
        if (containerRef.current) {
          containerRef.current.scrollBy({
            left: event.data.deltaX,
            top: event.data.deltaY,
            behavior: 'auto' // Instant scroll for responsiveness
          });
        }
      } else if (event.data?.type === 'preview-size') {
        setContentHeight(event.data.height);
        setContentWidth(event.data.width);
        onContentSizeChange?.(event.data.width, event.data.height);
      } else if (event.data?.type === 'preview-height') {
        // Legacy support or fallback
        setContentHeight(event.data.height);
      } else if (event.data?.type === 'preview-gesture-start') {
        gestureStartScaleRef.current = previewScaleRef.current;
      } else if (event.data?.type === 'preview-gesture-change') {
        const newScale = gestureStartScaleRef.current * event.data.scale;
        const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        setPreviewScale(clampedScale);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleZoom, setPreviewScale, onContentSizeChange]);

  // Handle zoom/gesture on container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleZoom(e.deltaY);
      }
    };

    // Safari Gesture Events
    const handleGestureStart = (e: any) => {
      e.preventDefault();
      gestureStartScaleRef.current = previewScaleRef.current;
    };
    const handleGestureChange = (e: any) => {
      e.preventDefault();
      const newScale = gestureStartScaleRef.current * e.scale;
      setPreviewScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
    };
    const handleGestureEnd = (e: any) => {
      e.preventDefault();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('gesturestart' as any, handleGestureStart);
    container.addEventListener('gesturechange' as any, handleGestureChange);
    container.addEventListener('gestureend' as any, handleGestureEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('gesturestart' as any, handleGestureStart);
      container.removeEventListener('gesturechange' as any, handleGestureChange);
      container.removeEventListener('gestureend' as any, handleGestureEnd);
    };
  }, [handleZoom, setPreviewScale]);

  const handleScaleChange = (value: string) => {
    if (value === 'fit') {
      setPreviewScale(1);
    } else {
      setPreviewScale(parseFloat(value));
    }
  };

  const handleResetZoom = () => setPreviewScale(1);
  const handleZoomIn = () => handleZoom(-100);
  const handleZoomOut = () => handleZoom(100);

  const displayPercentage = Math.round(previewScale * 100);

  // Calculate dimensions
  // Base width is the container width minus some padding (e.g. 64px)
  // But we want it to fill the container if possible.
  // If contentWidth is reported (e.g. from SVG intrinsic size), use it.
  // Otherwise fallback to container width (responsive behavior).
  const baseWidth = contentWidth > 0 ? contentWidth : Math.max(320, containerSize.width);
  const baseHeight = Math.max(100, contentHeight);

  const scaledWidth = baseWidth * previewScale;
  const scaledHeight = baseHeight * previewScale;

  return (
    <div className="flex flex-col h-full bg-[#1E2431] border-r border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1E2431] border-b border-border z-10">
        <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]" title={fileName || 'Untitled'}>
          {fileName || 'Untitled'}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Select value={previewScale.toString()} onValueChange={handleScaleChange}>
            <SelectTrigger className="h-6 w-[80px] text-xs border-none bg-transparent hover:bg-primary/10 hover:text-primary focus:ring-0 transition-colors justify-center">
              <span>{displayPercentage}%</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.1">10%</SelectItem>
              <SelectItem value="0.25">25%</SelectItem>
              <SelectItem value="0.5">50%</SelectItem>
              <SelectItem value="0.75">75%</SelectItem>
              <SelectItem value="1">100%</SelectItem>
              <SelectItem value="1.5">150%</SelectItem>
              <SelectItem value="2">200%</SelectItem>
              <SelectItem value="3">300%</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={handleResetZoom} title="Reset Zoom">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative bg-[#151922] flex"
        style={{
          padding: 0,
          margin: 0,
        }}
        onScroll={(e) => {
          // Prevent scrolling into negative space (blank area on left/top)
          const target = e.currentTarget;
          if (target.scrollLeft < 0) target.scrollLeft = 0;
          if (target.scrollTop < 0) target.scrollTop = 0;
        }}
      >
        {/* Content Wrapper (Checkerboard) */}
        <div
          style={{
            width: scaledWidth,
            height: scaledHeight,
            ...checkerboardStyle,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            transformOrigin: '0 0',
            margin: 'auto',
            padding: 0,
          }}
        >
          {/* Iframe (Scaled) */}
          <iframe
            ref={iframeRef}
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin"
            srcDoc={srcDoc}
            style={{
              width: baseWidth,
              height: baseHeight,
              transform: previewScale === 1 ? 'none' : `scale(${previewScale})`,
              transformOrigin: '0 0',
              border: 'none',
              display: 'block',
              backgroundColor: 'transparent',
              margin: 0,
              padding: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
};
