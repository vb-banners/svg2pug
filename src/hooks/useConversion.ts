import { useCallback } from 'react';
import beautify from 'js-beautify';
import pugBeautify from 'pug-beautify';
import { SvgoSettings } from '../types/SvgoSettings';
import { SVGO_PLUGIN_OPTIONS } from '../svgo-config';

export const useConversion = () => {
  const buildSvgoConfig = useCallback((settings: SvgoSettings) => {
    const floatPrecision = Number(settings.floatPrecision);
    const transformPrecision = Number(settings.transformPrecision);
    const plugins: Array<any> = [];

    for (const option of SVGO_PLUGIN_OPTIONS) {
      const enabled = Boolean(settings.plugins[option.id]);

      if (enabled) {
        const plugin: { name: string; params?: any } = {
          name: option.id,
        };

        const params: any = {};

        if (option.id === 'cleanupNumericValues' && Number.isFinite(floatPrecision)) {
          params.floatPrecision = floatPrecision === 0 ? 1 : floatPrecision;
        }

        if (
          (option.id === 'convertPathData' || option.id === 'convertTransform') &&
          Number.isFinite(transformPrecision)
        ) {
          params.transformPrecision = transformPrecision;
        }

        if (Object.keys(params).length > 0) {
          plugin.params = params;
        }

        plugins.push(plugin);
      }
    }

    // Custom plugins
    if (settings.plugins.figmaCleanup) {
      plugins.push({
        name: 'figmaCleanup',
        type: 'visitor',
        fn: () => {
          return {
            element: {
              enter: (node: any) => {
                if (node.attributes.id) {
                  if (
                    node.attributes.id.includes('Exclude') ||
                    node.attributes.id.includes('Vector')
                  ) {
                    delete node.attributes.id;
                  }
                }
              },
            },
          };
        },
      });
    }

    if (settings.plugins.removeBlackFill) {
      plugins.push({
        name: 'removeBlackFill',
        type: 'visitor',
        fn: () => {
          return {
            element: {
              enter: (node: any) => {
                if (node.attributes.fill === '#000' || node.attributes.fill === '#000000') {
                  delete node.attributes.fill;
                }
              },
            },
          };
        },
      });
    }

    const config = {
      multipass: Boolean(settings.multipass),
      plugins,
      js2svg: {
        pretty: false,
        indent: 2,
      },
    };

    return config;
  }, []);

  const applySvgoOptimizations = useCallback(
    async (source: string, settings: SvgoSettings): Promise<string> => {
      const html = typeof source === 'string' ? source : '';
      if (!html.trim()) {
        return html;
      }

      const fragmentPattern = /<svg[\s\S]*?<\/svg>/gi;
      if (!fragmentPattern.test(html)) {
        return html;
      }
      fragmentPattern.lastIndex = 0;

      const config = buildSvgoConfig(settings);

      // Dynamic import
      const { optimize } = await import('../vendor/svgo-browser.esm');

      let optimized = '';
      let lastIndex = 0;
      let match;

      while ((match = fragmentPattern.exec(html)) !== null) {
        optimized += html.slice(lastIndex, match.index);
        let fragment = match[0];
        try {
          const result: any = optimize(fragment, config);
          if (result && typeof result.data === 'string') {
            fragment = result.data;
          }
        } catch (error) {
          // Log SVGO optimization failure but continue with original fragment
          console.warn('SVGO optimization failed:', error);
        }
        optimized += fragment;
        lastIndex = match.index + match[0].length;
      }

      optimized += html.slice(lastIndex);
      return optimized;
    },
    [buildSvgoConfig]
  );

  const removeMatchingRects = useCallback((html: string, fileNameWithoutExt: string): string => {
    if (!fileNameWithoutExt || typeof html !== 'string' || !html.trim()) {
      return html;
    }

    // Check if this is SVG content
    const isSvg = html.trim().startsWith('<svg');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, isSvg ? 'image/svg+xml' : 'text/html');

    // Get all rect elements
    const rects = doc.querySelectorAll('rect');

    // Check each rect for matching id or class
    rects.forEach((rect) => {
      const id = rect.getAttribute('id');
      const classAttr = rect.getAttribute('class');

      // Check if id matches filename
      if (id === fileNameWithoutExt) {
        rect.parentNode?.removeChild(rect);
        return;
      }

      // Check if any class matches filename
      if (classAttr) {
        const classes = classAttr.split(/\s+/);
        if (classes.includes(fileNameWithoutExt)) {
          rect.parentNode?.removeChild(rect);
        }
      }
    });

    // Serialize back to string
    const serializer = new XMLSerializer();

    if (isSvg) {
      const svgElement = doc.documentElement;
      if (svgElement && svgElement.nodeName.toLowerCase() === 'svg') {
        return serializer.serializeToString(svgElement);
      }
    } else {
      const svgElements = doc.querySelectorAll('svg');
      if (svgElements.length > 0) {
        return Array.from(svgElements)
          .map((svg) => serializer.serializeToString(svg))
          .join('\n');
      }
    }

    return html;
  }, []);

  const applySvgIdToClassTransform = useCallback((jade: string): string => {
    if (typeof jade !== 'string') {
      return jade;
    }

    let transformed = jade;

    // Replace SVG tag#id patterns with tag.class
    const tagReplacements = [
      { pattern: /\bg#/g, replacement: 'g.' },
      { pattern: /\bpath#/g, replacement: 'path.' },
      { pattern: /\brect#/g, replacement: 'rect.' },
      { pattern: /\bcircle#/g, replacement: 'circle.' },
    ];

    tagReplacements.forEach(({ pattern, replacement }) => {
      transformed = transformed.replace(pattern, replacement);
    });

    // Remove x="0" and y="0" attributes
    transformed = transformed.replace(/\b(x|y)=['"]-?0['"]\s*,\s*/g, '');
    transformed = transformed.replace(/,\s*\b(x|y)=['"]-?0['"]/g, '');
    transformed = transformed.replace(/\b(x|y)=['"]-?0['"]\s+/g, '');
    transformed = transformed.replace(/\b(x|y)=['"]-?0['"](?=\s*\))/g, '');

    // Clean up empty parens and trailing commas
    transformed = transformed.replace(/,\s*(?=\))/g, '');
    transformed = transformed.replace(/\(\s*,/g, '(');
    transformed = transformed.replace(/[ \t]+\)/g, ')');
    transformed = transformed.replace(/\(\s*\)/g, '');

    return transformed;
  }, []);

  const applyCommonClassesTransform = useCallback((jade: string): string => {
    if (typeof jade !== 'string') {
      return jade;
    }

    // Match class names like .class1, .class2, .class-1, .class-2, etc.
    const classPattern = /\.([a-zA-Z_][\w-]*?)(-?\d+)(?=\s|\.|\(|$)/g;
    const classesMap = new Map<string, Set<string>>();

    // First pass: collect all class names and their bases
    let match;
    while ((match = classPattern.exec(jade)) !== null) {
      const fullClass = match[0]; // e.g., '.rating-popup1'
      const base = match[1]; // e.g., 'rating-popup'

      if (!classesMap.has(base)) {
        classesMap.set(base, new Set());
      }
      classesMap.get(base)!.add(fullClass);
    }

    // Second pass: replace classes that have common prefixes
    let transformed = jade;
    classesMap.forEach((classes, base) => {
      // Only apply if there are at least 2 classes with the same base
      if (classes.size >= 2) {
        classes.forEach((fullClass) => {
          // Replace .class1 with .class.class1
          // Use word boundary to avoid partial matches
          const escapedClass = fullClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const pattern = new RegExp(`(${escapedClass})(?=\\s|\\.|\\(|$)`, 'g');
          transformed = transformed.replace(pattern, `.${base}${fullClass}`);
        });
      }
    });

    return transformed;
  }, []);

  const applyPugSizeVarsTransform = useCallback((jade: string, html: string): string => {
    if (typeof jade !== 'string' || typeof html !== 'string') {
      return jade;
    }

    const viewBoxMatch = html.match(/viewBox=['"]([^'"]+)['"]/i);
    if (!viewBoxMatch) {
      return jade;
    }

    const viewBoxValues = viewBoxMatch[1].split(/\s+/);
    if (viewBoxValues.length !== 4) {
      return jade;
    }

    const viewBoxWidth = viewBoxValues[2];
    const viewBoxHeight = viewBoxValues[3];

    if (!viewBoxWidth || !viewBoxHeight) {
      return jade;
    }

    let transformed = jade;

    const widthPatterns = [
      new RegExp(`width=['"](${viewBoxWidth}(?:\\.0*)?)['"](\\s*)`, 'g'),
      new RegExp(`width=['"](${viewBoxWidth}(?:\\.0*)?)['"](\\s*),`, 'g'),
    ];

    const heightPatterns = [
      new RegExp(`height=['"](${viewBoxHeight}(?:\\.0*)?)['"](\\s*)`, 'g'),
      new RegExp(`height=['"](${viewBoxHeight}(?:\\.0*)?)['"](\\s*),`, 'g'),
    ];

    widthPatterns.forEach((pattern) => {
      transformed = transformed.replace(pattern, 'width=width$2');
    });

    heightPatterns.forEach((pattern) => {
      transformed = transformed.replace(pattern, 'height=height$2');
    });

    return transformed;
  }, []);

  const removeSvgParentFromPug = useCallback(
    (jade: string, useSoftTabs: boolean, tabSize: number): string => {
      if (typeof jade !== 'string') {
        return jade;
      }

      const lines = jade.split('\n');
      const svgLineIndex = lines.findIndex((line) => line.trim() !== '');
      if (svgLineIndex === -1) {
        return jade;
      }

      const firstContent = lines[svgLineIndex];
      const trimmedFirst = firstContent.trimStart();

      if (!/^svg(\b|#|\.|\(|$)/.test(trimmedFirst)) {
        return jade;
      }

      const indentSize = useSoftTabs ? Math.max(tabSize, 1) : 1;
      const indentUnit = useSoftTabs ? ' '.repeat(indentSize) : '\t';
      const indentPattern = new RegExp(`^${indentUnit}`);

      const dedentLine = (line: string) => {
        if (indentPattern.test(line)) {
          return line.replace(indentPattern, '');
        }
        const leadingWhitespace = line.match(/^\s+/)?.[0] ?? '';
        if (leadingWhitespace.length > 0) {
          return line.slice(Math.min(leadingWhitespace.length, indentUnit.length));
        }
        return line;
      };

      const resultLines: string[] = [];

      for (let i = 0; i < svgLineIndex; i++) {
        resultLines.push(lines[i]);
      }

      for (let i = svgLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        resultLines.push(line.trim() === '' ? '' : dedentLine(line));
      }

      while (resultLines.length > 0 && resultLines[0].trim() === '') {
        resultLines.shift();
      }

      return resultLines.join('\n');
    },
    []
  );

  const reorderFillOpacity = useCallback((html: string): string => {
    if (!html || typeof html !== 'string') return html;

    return html.replace(/<([^>]+)>/g, (match) => {
      const fillMatch = match.match(/\s+fill=(["'][^"']*["'])/);
      const fillOpacityMatch = match.match(/\s+fill-opacity=(["'][^"']*["'])/);

      if (fillMatch && fillOpacityMatch) {
        const fillAttr = fillMatch[0];
        const fillOpacityAttr = fillOpacityMatch[0];

        // Remove fill-opacity from its current place
        let newMatch = match.replace(fillOpacityAttr, '');

        // Insert fill-opacity after fill
        newMatch = newMatch.replace(fillAttr, fillAttr + fillOpacityAttr);
        return newMatch;
      }
      return match;
    });
  }, []);

  const moveDAttributeToEnd = useCallback((html: string): string => {
    if (!html || typeof html !== 'string') return html;

    return html.replace(
      /<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)\s*(\/?)\s*>/g,
      (match, tagName, attrs, selfClose) => {
        const dMatch = attrs.match(/\bd=(["'][^"']*["'])/);
        if (!dMatch) return match;

        // Remove d attribute from its current position
        const attrsWithoutD = attrs.replace(/\s*\bd=(["'][^"']*["'])/, '').trim();

        // Reconstruct tag with d at the end
        const dAttr = `d=${dMatch[1]}`;
        const closingSlash = selfClose ? '/' : '';
        return `<${tagName} ${attrsWithoutD} ${dAttr}${closingSlash}>`
          .replace(/\s+>/g, '>')
          .replace(/\s+\/>/g, '/>');
      }
    );
  }, []);

  const findHTMLOrBodyTag = useCallback((html: string): boolean => {
    return html.search(/<\/html>|<\/body>/) > -1;
  }, []);

  const convertHtmlToPug = useCallback(
    async (
      sourceHtml: string,
      options: {
        isSvgoEnabled: boolean;
        svgoSettings: SvgoSettings;
        enableSvgIdToClass: boolean;
        enableCommonClasses: boolean;
        enablePugSizeVars: boolean;
        useSoftTabs: boolean;
        tabSize: number;
        fileName?: string | null;
      }
    ): Promise<string> => {
      if (!sourceHtml || typeof sourceHtml !== 'string' || !sourceHtml.trim()) {
        return '';
      }

      let processedHtml = sourceHtml;

      if (options.fileName) {
        const fileNameWithoutExt = options.fileName.replace(/\.(svg|html|htm)$/i, '');
        processedHtml = removeMatchingRects(processedHtml, fileNameWithoutExt);
      }

      const optimizedHtml = options.isSvgoEnabled
        ? await applySvgoOptimizations(processedHtml, options.svgoSettings)
        : processedHtml;

      let reorderedHtml = reorderFillOpacity(optimizedHtml);
      reorderedHtml = moveDAttributeToEnd(reorderedHtml);

      const isBodyless = !findHTMLOrBodyTag(reorderedHtml);
      const convertOptions = {
        bodyless: isBodyless,
        donotencode: true,
      };

      const html = reorderedHtml.replace(/template/g, 'template_');

      return new Promise((resolve) => {
        if (window.Html2Jade) {
          (window.Html2Jade as any).convertHtml(html, convertOptions, (err: any, jade: string) => {
            if (err) {
              resolve('');
              return;
            }
            let sanitizeJade = jade
              .replace(/\|\s+$/gm, '')
              .replace(/^(?:[\t ]*(?:\r?\n|\r))+/gm, '');
            if (isBodyless) {
              sanitizeJade = sanitizeJade.replace('head\n', '');
            }
            sanitizeJade = sanitizeJade.replace(/template_/g, 'template');
            sanitizeJade = pugBeautify(sanitizeJade, {
              fill_tab: !options.useSoftTabs,
              tab_size: options.tabSize,
            });
            if (options.enableSvgIdToClass) {
              sanitizeJade = applySvgIdToClassTransform(sanitizeJade);
            }
            if (options.enableCommonClasses) {
              sanitizeJade = applyCommonClassesTransform(sanitizeJade);
            }
            if (options.enablePugSizeVars) {
              sanitizeJade = applyPugSizeVarsTransform(sanitizeJade, optimizedHtml);
            }
            if (options.svgoSettings?.plugins?.removeSvgElement) {
              sanitizeJade = removeSvgParentFromPug(
                sanitizeJade,
                options.useSoftTabs,
                options.tabSize
              );
            }
            resolve(sanitizeJade);
          });
        } else {
          resolve('');
        }
      });
    },
    [
      applySvgoOptimizations,
      removeMatchingRects,
      reorderFillOpacity,
      moveDAttributeToEnd,
      applySvgIdToClassTransform,
      applyCommonClassesTransform,
      applyPugSizeVarsTransform,
      removeSvgParentFromPug,
      findHTMLOrBodyTag,
    ]
  );

  const convertPugToHtml = useCallback(
    (
      pugCode: string,
      options: {
        tabSize: number;
        useSoftTabs: boolean;
        injectDebugInfo?: boolean;
        locals?: Record<string, any>;
      }
    ): string => {
      try {
        if (!window.pug) {
          return '';
        }

        const renderOptions: any = {
          pretty: true,
          ...options.locals,
        };

        if (options.injectDebugInfo) {
          const addLineNumbersPlugin = {
            postParse: function (ast: any) {
              function walk(node: any) {
                if (node.type === 'Tag') {
                  node.attrs.push({
                    name: 'data-pug-line',
                    val: '"' + node.line + '"',
                    mustEscape: false,
                  });
                }
                if (node.block) walk(node.block);
                if (node.nodes) node.nodes.forEach(walk);
              }
              walk(ast);
              return ast;
            },
          };
          renderOptions.plugins = [addLineNumbersPlugin];
        }

        const htmlCode = window.pug.render(pugCode, renderOptions);

        let sanitizeHTMLCode = htmlCode.replace(/^\n/, '');
        sanitizeHTMLCode = beautify.html(sanitizeHTMLCode, {
          indent_size: options.tabSize,
          indent_with_tabs: !options.useSoftTabs,
        });
        // Ensure fill-opacity comes after fill attribute and d attribute is last
        sanitizeHTMLCode = reorderFillOpacity(sanitizeHTMLCode);
        sanitizeHTMLCode = moveDAttributeToEnd(sanitizeHTMLCode);
        return sanitizeHTMLCode;
      } catch (error) {
        return '';
      }
    },
    [reorderFillOpacity, moveDAttributeToEnd]
  );

  return {
    buildSvgoConfig,
    applySvgoOptimizations,
    removeMatchingRects,
    applySvgIdToClassTransform,
    applyCommonClassesTransform,
    applyPugSizeVarsTransform,
    removeSvgParentFromPug,
    findHTMLOrBodyTag,
    convertHtmlToPug,
    convertPugToHtml,
  };
};
