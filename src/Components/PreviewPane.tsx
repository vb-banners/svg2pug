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

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  htmlContent,
  fileName,
  fileId,
  onContentSizeChange,
  highlightLines,
  isCopied,
  originalHtml,
}) => {
  const previewScale = useAppStore((state) => state.previewScale);
  const setPreviewScale = useAppStore((state) => state.setPreviewScale);
  const effectiveContent = useMemo(() => {
    if (htmlContent && htmlContent.trim().length > 0) return htmlContent;
    if (originalHtml && originalHtml.trim().length > 0) return originalHtml;
    return '';
  }, [htmlContent, originalHtml]);

  // Detect SVG content and extract dimensions synchronously during render
  // This prevents the brief resize flash on page load
  // Always use originalHtml for SVG detection since effectiveContent might be Pug code
  const {
    isSvgContent: detectedIsSvg,
    svgWidth,
    svgHeight,
  } = useMemo(() => {
    // First try originalHtml (the actual SVG source), then fall back to effectiveContent
    const contentToCheck = originalHtml || effectiveContent;
    if (!contentToCheck) return { isSvgContent: false, svgWidth: 0, svgHeight: 0 };

    const extractDimensionsFromSvg = (svg: Element) => {
      let w = 0;
      let h = 0;

      const widthAttr = svg.getAttribute('width');
      const heightAttr = svg.getAttribute('height');
      const viewBox = svg.getAttribute('viewBox');

      // Priority 1: ViewBox (most reliable for intrinsic dimensions)
      if (viewBox) {
        const parts = viewBox
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(parseFloat);
        if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
          w = parts[2];
          h = parts[3];
        }
      }

      // Priority 2: Width/Height attributes (only if not percentage-based)
      if (!w && widthAttr && !widthAttr.endsWith('%')) {
        w = parseFloat(widthAttr);
      }
      if (!h && heightAttr && !heightAttr.endsWith('%')) {
        h = parseFloat(heightAttr);
      }

      return { width: w, height: h };
    };

    const parser = new DOMParser();
    const doc = parser.parseFromString(contentToCheck, 'text/html');
    let svg = doc.querySelector('svg');

    // Also try parsing effectiveContent if originalHtml didn't have SVG
    if (!svg && effectiveContent && effectiveContent !== contentToCheck) {
      const effectiveDoc = parser.parseFromString(effectiveContent, 'text/html');
      svg = effectiveDoc.querySelector('svg');
    }

    if (svg) {
      const dims = extractDimensionsFromSvg(svg);
      if (dims.width > 0 && dims.height > 0) {
        return { isSvgContent: true, svgWidth: dims.width, svgHeight: dims.height };
      }
      // SVG exists but no extractable dimensions - still mark as SVG
      // This handles cases like width="100%" height="100%" without viewBox
      return { isSvgContent: true, svgWidth: 0, svgHeight: 0 };
    }

    return { isSvgContent: false, svgWidth: 0, svgHeight: 0 };
  }, [effectiveContent, originalHtml]);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const gestureStartScaleRef = useRef<number>(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isFitMode, setIsFitMode] = useState(true);

  // Use detectedIsSvg directly instead of state to avoid race conditions
  // isSvgContent is true only if we detected SVG AND extracted valid dimensions
  const isSvgContent = detectedIsSvg && svgWidth > 0 && svgHeight > 0;

  // Send highlight message to iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'highlight-lines',
          lines: highlightLines,
          isCopied: isCopied,
        },
        '*'
      );
    }
  }, [highlightLines, isCopied]);

  // Reset zoom and enable auto-fit when switching files
  useEffect(() => {
    setPreviewScale(1);
    setIsFitMode(true);
  }, [fileId, setPreviewScale]);

  // Calculate scale synchronously for Fit Mode to avoid render lag
  // Only apply fit mode for SVG content - HTML should always be 100%
  let effectiveScale = previewScale;
  if (
    isSvgContent &&
    isFitMode &&
    svgWidth > 0 &&
    svgHeight > 0 &&
    containerSize.width > 0 &&
    containerSize.height > 0
  ) {
    const padding = 32;
    const availableWidth = Math.max(0, containerSize.width - padding);
    const availableHeight = Math.max(0, containerSize.height - padding);

    const scaleX = availableWidth / svgWidth;
    const scaleY = availableHeight / svgHeight;
    const fitScale = Math.min(scaleX, scaleY, 1);

    effectiveScale = Math.max(0.1, Math.floor(fitScale * 100) / 100);
  } else if (!isSvgContent) {
    // For non-SVG content, always use 100% scale
    effectiveScale = 1;
  }

  // Sync store with effective scale (only for SVG content)
  useEffect(() => {
    if (isSvgContent && isFitMode && effectiveScale !== previewScale) {
      setPreviewScale(effectiveScale);
    }
  }, [isSvgContent, isFitMode, effectiveScale, previewScale, setPreviewScale]);

  // Notify parent of content size changes (for SVG)
  useEffect(() => {
    if (detectedIsSvg && svgWidth > 0 && svgHeight > 0) {
      onContentSizeChange?.(svgWidth, svgHeight);
    }
  }, [detectedIsSvg, svgWidth, svgHeight, onContentSizeChange]);

  // Constants
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 10.0;
  const ZOOM_SENSITIVITY = 0.005;
  const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3];

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
    backgroundColor: '#1E2431',
  };

  // Strip document wrapper from content that includes full HTML structure
  // This prevents invalid nested HTML when content has <!DOCTYPE>, <html>, <head>, <body> tags
  // Also removes script tags to prevent JavaScript errors in preview
  const strippedContent = useMemo(() => {
    if (!effectiveContent) return '';

    let content = effectiveContent.trim();

    // Check if this is a full HTML document
    if (content.match(/^<!DOCTYPE\s+html/i) || content.match(/^<html[\s>]/i)) {
      // Try to extract body content
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        content = bodyMatch[1].trim();
      } else {
        // If no body tag but has html/head, try to extract content after </head>
        const afterHeadMatch = content.match(/<\/head>\s*([\s\S]*?)(?:<\/html>|$)/i);
        if (afterHeadMatch) {
          content = afterHeadMatch[1].trim();
        }
      }
    }

    // Remove script tags to prevent JavaScript errors in preview
    // Scripts in user content can cause syntax errors when executed in iframe context
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    return content;
  }, [effectiveContent]);

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
              font-family: "Inter", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #D9D7CE;
              background-color: transparent; /* Allow checkerboard to show through */
              min-height: 100vh;
              width: fit-content;
              min-width: 100%;
            }
            body.is-svg-only {
              display: flex;
              justify-content: center;
              align-items: center;
            }
            body.is-html-content {
              display: block;
              width: 100%;
              padding: 16px;
              box-sizing: border-box;
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
            (function() {
              var resizeObserverLoopErr = 'ResizeObserver loop completed with undelivered notifications';
              var resizeObserverLoopErr2 = 'ResizeObserver loop limit exceeded';
              
              window.addEventListener('error', function(e) {
                if (e.message && (
                  e.message.indexOf(resizeObserverLoopErr) >= 0 ||
                  e.message.indexOf(resizeObserverLoopErr2) >= 0
                )) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              }, { capture: true });
              
              window.onerror = function(message) {
                var msg = typeof message === 'string' ? message : '';
                if (
                  msg.indexOf(resizeObserverLoopErr) >= 0 ||
                  msg.indexOf(resizeObserverLoopErr2) >= 0
                ) {
                  return true;
                }
                return false;
              };
            })();

            window.addEventListener('DOMContentLoaded', function() {
              // 1. Clean up XML/DOCTYPE text nodes that might have rendered
              var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
              var nodesToRemove = [];
              while (walker.nextNode()) {
                var node = walker.currentNode;
                if (node.nodeValue && (
                  node.nodeValue.trim().startsWith('?xml') || 
                  node.nodeValue.trim().startsWith('<!DOCTYPE') ||
                  node.nodeValue.indexOf('xml version=') >= 0
                )) {
                  nodesToRemove.push(node);
                }
              }
              nodesToRemove.forEach(function(n) { n.remove(); });

              // Detect content type
              var isSvgOnly = document.body.children.length === 1 && document.body.children[0].tagName.toLowerCase() === 'svg';
              if (isSvgOnly) {
                document.body.classList.add('is-svg-only');
              } else {
                document.body.classList.add('is-html-content');
              }

              // 2. Fix SVG sizing and alignment
              var svg = document.querySelector('svg');
              if (svg) {
                // Remove explicit width/height attributes ONLY if they are percentage-based
                // This allows us to fall back to viewBox or preserve pixel values
                var hasWidth = svg.hasAttribute('width');
                var hasHeight = svg.hasAttribute('height');
                
                if (hasWidth && svg.getAttribute('width').indexOf('%') >= 0) {
                   svg.removeAttribute('width');
                   hasWidth = false;
                }
                if (hasHeight && svg.getAttribute('height').indexOf('%') >= 0) {
                   svg.removeAttribute('height');
                   hasHeight = false;
                }

                // Ensure style.width/height are set if attributes exist (for reportSize)
                if (hasWidth) {
                   var w = svg.getAttribute('width');
                   if (w) svg.style.width = w.match(/^\d+(\.\d+)?$/) ? w + 'px' : w;
                }
                if (hasHeight) {
                   var h = svg.getAttribute('height');
                   if (h) svg.style.height = h.match(/^\d+(\.\d+)?$/) ? h + 'px' : h;
                }
                
                // Force left alignment (default)
                svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');

                // Set intrinsic size based on viewBox if dimensions are missing
                if (svg.hasAttribute('viewBox')) {
                  var viewBox = svg.getAttribute('viewBox').split(/[\s,]+/).filter(Boolean);
                  if (viewBox.length === 4) {
                    var width = parseFloat(viewBox[2]);
                    var height = parseFloat(viewBox[3]);
                    
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
              var lastWidth = 0;
              var lastHeight = 0;
              var reportTimeout;
              
              var reportSize = function() {
                 var width = 0;
                 var height = 0;
                 
                 var svgEl = document.querySelector('svg');
                 if (svgEl) {
                    // Priority 1: ViewBox
                    if (svgEl.hasAttribute('viewBox')) {
                         var viewBox = svgEl.getAttribute('viewBox').split(/[\s,]+/).filter(Boolean);
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
                            var w = svgEl.getAttribute('width');
                            if (w) {
                                if (w.match(/^\d+(\.\d+)?$/)) width = parseFloat(w);
                                else if (w.endsWith('px')) width = parseFloat(w);
                            }
                        }
                    }
                    if (!height || height <= 0) {
                        if (svgEl.hasAttribute('height')) {
                            var h = svgEl.getAttribute('height');
                            if (h) {
                                if (h.match(/^\d+(\.\d+)?$/)) height = parseFloat(h);
                                else if (h.endsWith('px')) height = parseFloat(h);
                            }
                        }
                    }
                    
                    // Fallback: Measured dimensions
                    if (!width || width <= 0) {
                        var rect = svgEl.getBoundingClientRect();
                        if (rect.width > 0) width = rect.width;
                    }
                    if (!height || height <= 0) {
                         var rect = svgEl.getBoundingClientRect();
                         if (rect.height > 0) height = rect.height;
                         else height = document.body.scrollHeight;
                    }

                 } else {
                    // For non-SVG content (HTML)
                    var scrollWidth = document.body.scrollWidth;
                    var scrollHeight = document.body.scrollHeight;
                    
                    height = scrollHeight;
                    
                    // For HTML content, we generally want it to wrap and be responsive.
                    // Reporting a width > innerWidth causes the iframe to expand, preventing wrapping.
                    // So we force width to 0 (use container width) unless it's SVG.
                    width = 0;
                 }
                 
                 // Only report if changed significantly
                 if (Math.abs(width - lastWidth) > 1 || Math.abs(height - lastHeight) > 1) {
                    lastWidth = width;
                    lastHeight = height;
                    window.parent.postMessage({ type: 'preview-size', width: width, height: height }, '*');
                 }
              };

              var resizeObserver = new ResizeObserver(function() {
                if (reportTimeout) clearTimeout(reportTimeout);
                reportTimeout = setTimeout(reportSize, 100);
              });
              resizeObserver.observe(document.body);
              if (svg) resizeObserver.observe(svg);
              
              // Also call it immediately
              reportSize();
            });

            // Handle zoom via Ctrl/Cmd + Wheel (Pinch) inside iframe
            window.addEventListener('wheel', function(e) {
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
            window.addEventListener('message', function(e) {
              if (e.data.type === 'highlight-lines') {
                var lines = e.data.lines || [];
                var isCopied = e.data.isCopied || false;
                
                // Remove previous highlights
                document.querySelectorAll('.pug-highlight').forEach(function(el) {
                  el.classList.remove('pug-highlight');
                  el.style.outline = '';
                  el.style.outlineOffset = '';
                  el.style.backgroundColor = '';
                  el.style.transition = '';
                });
                
                if (Array.isArray(lines) && lines.length > 0) {
                  var outlineColor = isCopied ? '#CAFF6C' : '#FFC94F';
                  var bgColor = isCopied ? 'rgba(202, 255, 108, 0.2)' : 'rgba(255, 201, 79, 0.2)';
                  
                  lines.forEach(function(line) {
                    // Try to find exact match or closest parent
                    // Since Pug lines map to elements, we look for data-pug-line
                    var el = document.querySelector('[data-pug-line="' + line + '"]');
                    if (el) {
                      el.classList.add('pug-highlight');
                      el.style.transition = 'all 0.2s ease';
                      el.style.outline = '2px solid ' + outlineColor;
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
          ${strippedContent}
        </body>
      </html>
    `;
  }, [strippedContent]);

  // Measure container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
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

  const handleZoom = useCallback(
    (deltaY: number) => {
      setIsFitMode(false);
      const currentScale = previewScaleRef.current;
      const zoomFactor = Math.exp(-deltaY * ZOOM_SENSITIVITY);
      const newScale = currentScale * zoomFactor;
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      setPreviewScale(clampedScale);
    },
    [setPreviewScale]
  );

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
            behavior: 'auto', // Instant scroll for responsiveness
          });
        }
      } else if (event.data?.type === 'preview-size') {
        // We now use synchronous detection via useMemo, so we don't need iframe reports
        // Just notify parent for external use
        if (event.data.width > 0) {
          onContentSizeChange?.(event.data.width, event.data.height);
        }
      } else if (event.data?.type === 'preview-height') {
        // Legacy support - ignore for now since we use static detection
        // This would only fire for SVG without viewBox dimensions
      } else if (event.data?.type === 'preview-gesture-start') {
        gestureStartScaleRef.current = previewScaleRef.current;
        setIsFitMode(false);
      } else if (event.data?.type === 'preview-gesture-change') {
        const newScale = gestureStartScaleRef.current * event.data.scale;
        const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        setPreviewScale(clampedScale);
        setIsFitMode(false);
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
      setIsFitMode(false);
    };
    const handleGestureChange = (e: any) => {
      e.preventDefault();
      const newScale = gestureStartScaleRef.current * e.scale;
      setPreviewScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
      setIsFitMode(false);
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
      setIsFitMode(true);
    } else {
      setIsFitMode(false);
      setPreviewScale(parseFloat(value));
    }
  };

  const handleResetZoom = () => {
    setIsFitMode(false);
    setPreviewScale(1);
  };

  const handleZoomIn = () => {
    setIsFitMode(false);
    const current = effectiveScale;
    // Find next level that is significantly larger than current (to avoid floating point issues)
    const next = ZOOM_LEVELS.find((l) => l > current + 0.01) || ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
    setPreviewScale(next);
  };

  const handleZoomOut = () => {
    setIsFitMode(false);
    const current = effectiveScale;
    // Find prev level
    const prev = [...ZOOM_LEVELS].reverse().find((l) => l < current - 0.01) || ZOOM_LEVELS[0];
    setPreviewScale(prev);
  };

  const displayPercentage = Math.round(effectiveScale * 100);

  // Calculate dimensions
  // For SVG: use intrinsic dimensions from SVG
  // For HTML: use 100% of container via CSS (no JS measurements needed)
  // isSvgContent already checks for valid dimensions (svgWidth > 0 && svgHeight > 0)
  const isSvgWithDimensions = isSvgContent;

  let baseWidth: number;
  let baseHeight: number;

  if (isSvgWithDimensions) {
    // SVG content - use intrinsic dimensions from static detection
    baseWidth = svgWidth;
    baseHeight = svgHeight;
  } else {
    // HTML content - we'll use CSS 100% instead
    baseWidth = 0;
    baseHeight = 0;
  }

  const scaledWidth = isSvgWithDimensions ? baseWidth * effectiveScale : 0;
  const scaledHeight = isSvgWithDimensions ? baseHeight * effectiveScale : 0;

  return (
    <div className="flex flex-col h-full bg-[#1E2431] border-r border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1E2431] border-b border-border z-10">
        <span
          className="text-xs font-medium text-muted-foreground truncate max-w-[200px]"
          title={fileName || 'Untitled'}
        >
          {fileName || 'Untitled'}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleZoomOut}
            title="Zoom Out"
            disabled={!isSvgWithDimensions}
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Select
            value={isFitMode ? 'fit' : effectiveScale.toString()}
            onValueChange={handleScaleChange}
            disabled={!isSvgWithDimensions}
          >
            <SelectTrigger className="h-6 w-[80px] text-xs border-none bg-transparent hover:bg-primary/10 hover:text-primary focus:ring-0 transition-colors justify-center">
              <span>
                {isSvgWithDimensions ? (isFitMode ? 'Fit' : `${displayPercentage}%`) : '100%'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fit">Fit to View</SelectItem>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleZoomIn}
            title="Zoom In"
            disabled={!isSvgWithDimensions}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-1"
            onClick={handleResetZoom}
            title="Reset Zoom"
            disabled={!isSvgWithDimensions}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#151922]"
        style={{
          padding: 0,
          margin: 0,
          position: 'relative',
          display: isSvgWithDimensions ? 'flex' : 'block',
          justifyContent: isSvgWithDimensions ? 'center' : undefined,
          alignItems: isSvgWithDimensions ? 'center' : undefined,
        }}
        onScroll={(e) => {
          // Prevent scrolling into negative space (blank area on left/top)
          const target = e.currentTarget;
          if (target.scrollLeft < 0) target.scrollLeft = 0;
          if (target.scrollTop < 0) target.scrollTop = 0;
        }}
      >
        {isSvgWithDimensions ? (
          /* SVG Content - Use calculated dimensions with scaling */
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
            <iframe
              ref={iframeRef}
              title="Live Preview"
              sandbox="allow-scripts"
              scrolling="no"
              srcDoc={srcDoc}
              style={{
                width: baseWidth,
                height: baseHeight,
                transform: effectiveScale === 1 ? 'none' : `scale(${effectiveScale})`,
                transformOrigin: '0 0',
                border: 'none',
                display: 'block',
                backgroundColor: 'transparent',
                margin: 0,
                padding: 0,
                pointerEvents: 'auto',
              }}
            />
          </div>
        ) : (
          /* HTML Content - Fill container completely using absolute positioning */
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              ...checkerboardStyle,
            }}
          >
            <iframe
              ref={iframeRef}
              title="Live Preview"
              sandbox="allow-scripts"
              srcDoc={srcDoc}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                backgroundColor: 'transparent',
                margin: 0,
                padding: 0,
                pointerEvents: 'auto',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
