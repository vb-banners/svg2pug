import {
  getDefaultSvgoSettings,
  mergeSvgoSettings,
  SVGO_PLUGIN_OPTIONS,
  PRECISION_LIMITS,
} from '../svgo-config';

describe('svgo-config', () => {
  describe('SVGO_PLUGIN_OPTIONS', () => {
    it('has plugin definitions with required fields', () => {
      SVGO_PLUGIN_OPTIONS.forEach((plugin) => {
        expect(plugin.id).toBeDefined();
        expect(typeof plugin.id).toBe('string');
        expect(plugin.name).toBeDefined();
        expect(typeof plugin.name).toBe('string');
        expect(typeof plugin.enabledByDefault).toBe('boolean');
        expect(plugin.category).toBeDefined();
      });
    });

    it('has unique plugin IDs', () => {
      const ids = SVGO_PLUGIN_OPTIONS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('PRECISION_LIMITS', () => {
    it('has valid min and max values', () => {
      expect(PRECISION_LIMITS.min).toBeLessThan(PRECISION_LIMITS.max);
      expect(PRECISION_LIMITS.min).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDefaultSvgoSettings', () => {
    it('returns settings with all standard plugins', () => {
      const settings = getDefaultSvgoSettings();

      SVGO_PLUGIN_OPTIONS.forEach((plugin) => {
        expect(settings.plugins[plugin.id]).toBe(plugin.enabledByDefault);
      });
    });

    it('returns settings with custom plugins', () => {
      const settings = getDefaultSvgoSettings();

      expect(settings.plugins.removeSvgElement).toBe(true);
      expect(settings.plugins.figmaCleanup).toBe(false);
      expect(settings.plugins.removeBlackFill).toBe(true);
    });

    it('returns settings with default precision values', () => {
      const settings = getDefaultSvgoSettings();

      expect(settings.floatPrecision).toBeDefined();
      expect(settings.transformPrecision).toBeDefined();
      expect(typeof settings.multipass).toBe('boolean');
    });
  });

  describe('mergeSvgoSettings', () => {
    it('returns defaults when raw is null', () => {
      const defaults = getDefaultSvgoSettings();
      const result = mergeSvgoSettings(null);

      expect(result.floatPrecision).toBe(defaults.floatPrecision);
      expect(result.transformPrecision).toBe(defaults.transformPrecision);
    });

    it('returns defaults when raw is not an object', () => {
      const defaults = getDefaultSvgoSettings();

      expect(mergeSvgoSettings('string')).toEqual(defaults);
      expect(mergeSvgoSettings(123)).toEqual(defaults);
    });

    it('merges multipass setting correctly', () => {
      const result = mergeSvgoSettings({ multipass: true });
      expect(result.multipass).toBe(true);

      const result2 = mergeSvgoSettings({ multipass: false });
      expect(result2.multipass).toBe(false);
    });

    it('clamps precision values within limits', () => {
      const result = mergeSvgoSettings({
        floatPrecision: -5,
        transformPrecision: 100,
      });

      expect(result.floatPrecision).toBe(PRECISION_LIMITS.min);
      expect(result.transformPrecision).toBe(PRECISION_LIMITS.max);
    });

    it('preserves valid precision values', () => {
      const result = mergeSvgoSettings({
        floatPrecision: 5,
        transformPrecision: 3,
      });

      expect(result.floatPrecision).toBe(5);
      expect(result.transformPrecision).toBe(3);
    });

    it('merges plugin settings correctly', () => {
      const result = mergeSvgoSettings({
        plugins: {
          removeComments: false,
          removeDoctype: true,
        },
      });

      expect(result.plugins.removeComments).toBe(false);
      expect(result.plugins.removeDoctype).toBe(true);
    });

    it('preserves custom plugin settings', () => {
      const result = mergeSvgoSettings({
        plugins: {
          removeSvgElement: false,
          figmaCleanup: true,
          removeBlackFill: false,
        },
      });

      expect(result.plugins.removeSvgElement).toBe(false);
      expect(result.plugins.figmaCleanup).toBe(true);
      expect(result.plugins.removeBlackFill).toBe(false);
    });

    it('handles legacy cleanupIDs migration', () => {
      const result = mergeSvgoSettings({
        plugins: {
          cleanupIDs: true,
        },
      });

      expect(result.plugins.cleanupIds).toBe(true);
    });

    it('falls back to defaults for invalid precision', () => {
      const defaults = getDefaultSvgoSettings();
      const result = mergeSvgoSettings({
        floatPrecision: 'invalid',
        transformPrecision: NaN,
      });

      expect(result.floatPrecision).toBe(defaults.floatPrecision);
      expect(result.transformPrecision).toBe(defaults.transformPrecision);
    });
  });
});
