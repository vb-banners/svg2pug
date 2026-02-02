import { renderHook } from '@testing-library/react';
import { useConversion } from '../../hooks/useConversion';
import { getDefaultSvgoSettings } from '../../svgo-config';

describe('useConversion', () => {
  describe('buildSvgoConfig', () => {
    it('returns config with plugins array', () => {
      const { result } = renderHook(() => useConversion());
      const settings = getDefaultSvgoSettings();

      const config = result.current.buildSvgoConfig(settings);

      expect(config.plugins).toBeDefined();
      expect(Array.isArray(config.plugins)).toBe(true);
    });

    it('includes enabled plugins in config', () => {
      const { result } = renderHook(() => useConversion());
      const settings = getDefaultSvgoSettings();
      settings.plugins.removeComments = true;

      const config = result.current.buildSvgoConfig(settings);

      const pluginNames = config.plugins.map((p: any) => (typeof p === 'string' ? p : p.name));
      expect(pluginNames).toContain('removeComments');
    });

    it('excludes disabled plugins from config', () => {
      const { result } = renderHook(() => useConversion());
      const settings = getDefaultSvgoSettings();
      settings.plugins.removeComments = false;

      const config = result.current.buildSvgoConfig(settings);

      const pluginNames = config.plugins.map((p: any) => (typeof p === 'string' ? p : p.name));
      expect(pluginNames).not.toContain('removeComments');
    });

    it('sets multipass correctly', () => {
      const { result } = renderHook(() => useConversion());
      const settings = getDefaultSvgoSettings();
      settings.multipass = true;

      const config = result.current.buildSvgoConfig(settings);

      expect(config.multipass).toBe(true);
    });

    it('adds precision params to relevant plugins', () => {
      const { result } = renderHook(() => useConversion());
      const settings = getDefaultSvgoSettings();
      settings.floatPrecision = 4;
      settings.plugins.cleanupNumericValues = true;

      const config = result.current.buildSvgoConfig(settings);

      const cleanupPlugin = config.plugins.find((p: any) => p.name === 'cleanupNumericValues');
      expect(cleanupPlugin?.params?.floatPrecision).toBe(4);
    });
  });

  describe('applySvgIdToClassTransform', () => {
    it('replaces g# with g.', () => {
      const { result } = renderHook(() => useConversion());

      const input = 'g#myGroup';
      const output = result.current.applySvgIdToClassTransform(input);

      expect(output).toBe('g.myGroup');
    });

    it('replaces path# with path.', () => {
      const { result } = renderHook(() => useConversion());

      const input = 'path#myPath';
      const output = result.current.applySvgIdToClassTransform(input);

      expect(output).toBe('path.myPath');
    });

    it('replaces rect# with rect.', () => {
      const { result } = renderHook(() => useConversion());

      const input = 'rect#myRect';
      const output = result.current.applySvgIdToClassTransform(input);

      expect(output).toBe('rect.myRect');
    });

    it('removes x="0" and y="0" attributes', () => {
      const { result } = renderHook(() => useConversion());

      const input = 'rect(x="0", y="0", width="100")';
      const output = result.current.applySvgIdToClassTransform(input);

      expect(output).not.toContain('x="0"');
      expect(output).not.toContain('y="0"');
    });

    it('handles non-string input gracefully', () => {
      const { result } = renderHook(() => useConversion());

      // @ts-expect-error Testing non-string input
      const output = result.current.applySvgIdToClassTransform(null);
      expect(output).toBeNull();
    });
  });

  describe('applyCommonClassesTransform', () => {
    it('adds common class prefix when multiple numbered classes exist', () => {
      const { result } = renderHook(() => useConversion());

      // When there are classes like .button1, .button2, it should add .button prefix
      const input = 'g.item1\ng.item2';
      const output = result.current.applyCommonClassesTransform(input);

      // Should have .item.item1 and .item.item2
      expect(output).toContain('.item.item1');
      expect(output).toContain('.item.item2');
    });

    it('does not modify classes without numbered suffixes', () => {
      const { result } = renderHook(() => useConversion());

      const input = 'g.header\ng.footer';
      const output = result.current.applyCommonClassesTransform(input);

      expect(output).toBe(input);
    });

    it('handles non-string input gracefully', () => {
      const { result } = renderHook(() => useConversion());

      // @ts-expect-error Testing non-string input
      const output = result.current.applyCommonClassesTransform(undefined);
      expect(output).toBeUndefined();
    });
  });

  describe('applyPugSizeVarsTransform', () => {
    it('replaces viewBox width/height with variables', () => {
      const { result } = renderHook(() => useConversion());

      const html = '<svg viewBox="0 0 100 200"></svg>';
      const jade = 'svg(width="100", height="200")';

      const output = result.current.applyPugSizeVarsTransform(jade, html);

      expect(output).toContain('width=width');
      expect(output).toContain('height=height');
    });

    it('does not modify when no viewBox present', () => {
      const { result } = renderHook(() => useConversion());

      const html = '<svg></svg>';
      const jade = 'svg(width="100", height="200")';

      const output = result.current.applyPugSizeVarsTransform(jade, html);

      expect(output).toBe(jade);
    });

    it('handles non-string input gracefully', () => {
      const { result } = renderHook(() => useConversion());

      // @ts-expect-error Testing non-string input
      const output = result.current.applyPugSizeVarsTransform(null, '<svg></svg>');
      expect(output).toBeNull();
    });
  });

  describe('removeSvgParentFromPug', () => {
    it('removes svg parent and dedents children', () => {
      const { result } = renderHook(() => useConversion());

      const input = 'svg\n  g\n    rect';
      const output = result.current.removeSvgParentFromPug(input, true, 2);

      expect(output).not.toMatch(/^svg/);
      expect(output).toContain('g');
      expect(output).toContain('rect');
    });

    it('does not modify when first element is not svg', () => {
      const { result } = renderHook(() => useConversion());

      const input = 'div\n  span';
      const output = result.current.removeSvgParentFromPug(input, true, 2);

      expect(output).toBe(input);
    });

    it('handles non-string input gracefully', () => {
      const { result } = renderHook(() => useConversion());

      // @ts-expect-error Testing non-string input
      const output = result.current.removeSvgParentFromPug(123, true, 2);
      expect(output).toBe(123);
    });
  });

  describe('findHTMLOrBodyTag', () => {
    it('returns true when html closing tag is present', () => {
      const { result } = renderHook(() => useConversion());

      const html = '<html><body><svg></svg></body></html>';
      expect(result.current.findHTMLOrBodyTag(html)).toBe(true);
    });

    it('returns true when body closing tag is present', () => {
      const { result } = renderHook(() => useConversion());

      const html = '<body><svg></svg></body>';
      expect(result.current.findHTMLOrBodyTag(html)).toBe(true);
    });

    it('returns false when neither is present', () => {
      const { result } = renderHook(() => useConversion());

      const html = '<svg></svg>';
      expect(result.current.findHTMLOrBodyTag(html)).toBe(false);
    });
  });
});
