import {
  needsMigration,
  migrateLocalStorageData,
  STORAGE_KEYS,
} from '../../utils/localStorage-migration';

describe('localStorage-migration', () => {
  describe('needsMigration', () => {
    it('returns false when no old keys exist', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      expect(needsMigration()).toBe(false);
    });

    it('returns true when any old key exists', () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.HTML_CODE) return '<svg></svg>';
        return null;
      });

      expect(needsMigration()).toBe(true);
    });

    it('returns true when SVGO settings exist', () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.SVGO_SETTINGS) return '{}';
        return null;
      });

      expect(needsMigration()).toBe(true);
    });
  });

  describe('migrateLocalStorageData', () => {
    it('returns empty object when no data exists', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = migrateLocalStorageData();

      expect(result).toEqual({});
    });

    it('migrates HTML code correctly', () => {
      const htmlCode = '<svg><rect /></svg>';
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.HTML_CODE) return htmlCode;
        return null;
      });

      const result = migrateLocalStorageData();

      expect(result.HTMLCode).toBe(htmlCode);
    });

    it('migrates boolean toggles correctly', () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.ID_TO_CLASS) return 'true';
        if (key === STORAGE_KEYS.SVGO_ENABLED) return 'false';
        if (key === STORAGE_KEYS.PUG_SIZE_VARS) return 'true';
        return null;
      });

      const result = migrateLocalStorageData();

      expect(result.enableSvgIdToClass).toBe(true);
      expect(result.isSvgoEnabled).toBe(false);
      expect(result.enablePugSizeVars).toBe(true);
    });

    it('migrates pug width ratio correctly', () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.PUG_WIDTH) return '0.6';
        return null;
      });

      const result = migrateLocalStorageData();

      expect(result.pugWidthRatio).toBe(0.6);
    });

    it('migrates controls position correctly', () => {
      const position = { x: 100, y: 200 };
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.CONTROLS_POSITION) return JSON.stringify(position);
        return null;
      });

      const result = migrateLocalStorageData();

      expect(result.controlsPosition).toEqual(position);
    });

    it('migrates SVGO settings correctly', () => {
      const svgoSettings = { multipass: true, plugins: {} };
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.SVGO_SETTINGS) return JSON.stringify(svgoSettings);
        return null;
      });

      const result = migrateLocalStorageData();

      expect(result.svgoSettings).toEqual(svgoSettings);
    });

    it('migrates open files correctly', () => {
      const openFiles = [{ id: '1', name: 'test.svg' }];
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.OPEN_FILES) return JSON.stringify(openFiles);
        return null;
      });

      const result = migrateLocalStorageData();

      expect(result.openFiles).toEqual(openFiles);
    });

    it('handles JSON parse errors gracefully', () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.SVGO_SETTINGS) return 'invalid json';
        return null;
      });

      // Should not throw
      expect(() => migrateLocalStorageData()).not.toThrow();
    });
  });
});
