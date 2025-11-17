// localStorage keys from the original app
export const STORAGE_KEYS = {
  CONTROLS_POSITION: 'html2pug:floatingControls',
  PUG_WIDTH: 'html2pug:pugPaneWidth',
  HTML_CODE: 'html2pug:htmlCode',
  JADE_CODE: 'html2pug:jadeCode',
  ID_TO_CLASS: 'html2pug:idToClassToggle',
  SVGO_SETTINGS: 'html2pug:svgoSettings',
  SVGO_ENABLED: 'html2pug:svgoEnabled',
  PUG_SIZE_VARS: 'html2pug:pugSizeVars',
  OPEN_FILES: 'html2pug:openFiles',
  ACTIVE_FILE: 'html2pug:activeFileId',
} as const;

/**
 * Migration utility to read legacy localStorage data and convert to new format
 * Maintains backward compatibility with existing user data
 */
export const migrateLocalStorageData = () => {
  const migrated: Record<string, any> = {};

  try {
    // Migrate controls position
    const controlsPos = localStorage.getItem(STORAGE_KEYS.CONTROLS_POSITION);
    if (controlsPos) {
      migrated.controlsPosition = JSON.parse(controlsPos);
    }

    // Migrate pug width ratio
    const pugWidth = localStorage.getItem(STORAGE_KEYS.PUG_WIDTH);
    if (pugWidth) {
      migrated.pugWidthRatio = parseFloat(pugWidth);
    }

    // Migrate HTML code
    const htmlCode = localStorage.getItem(STORAGE_KEYS.HTML_CODE);
    if (htmlCode) {
      migrated.HTMLCode = htmlCode;
    }

    // Migrate Jade/Pug code
    const jadeCode = localStorage.getItem(STORAGE_KEYS.JADE_CODE);
    if (jadeCode) {
      migrated.JADECode = jadeCode;
    }

    // Migrate Id to class toggle
    const idToClass = localStorage.getItem(STORAGE_KEYS.ID_TO_CLASS);
    if (idToClass) {
      migrated.enableSvgIdToClass = idToClass === 'true';
    }

    // Migrate SVGO settings
    const svgoSettings = localStorage.getItem(STORAGE_KEYS.SVGO_SETTINGS);
    if (svgoSettings) {
      migrated.svgoSettings = JSON.parse(svgoSettings);
    }

    // Migrate SVGO enabled
    const svgoEnabled = localStorage.getItem(STORAGE_KEYS.SVGO_ENABLED);
    if (svgoEnabled) {
      migrated.isSvgoEnabled = svgoEnabled === 'true';
    }

    // Migrate Pug size vars toggle
    const pugSizeVars = localStorage.getItem(STORAGE_KEYS.PUG_SIZE_VARS);
    if (pugSizeVars) {
      migrated.enablePugSizeVars = pugSizeVars === 'true';
    }

    // Migrate open files
    const openFiles = localStorage.getItem(STORAGE_KEYS.OPEN_FILES);
    if (openFiles) {
      migrated.openFiles = JSON.parse(openFiles);
    }

    // Migrate active file ID
    const activeFile = localStorage.getItem(STORAGE_KEYS.ACTIVE_FILE);
    if (activeFile) {
      migrated.activeFileId = activeFile;
    }
  } catch (error) {
    console.error('Error migrating localStorage data:', error);
  }

  return migrated;
};

/**
 * Check if migration is needed (any of the old keys exist)
 */
export const needsMigration = (): boolean => {
  return Object.values(STORAGE_KEYS).some(key => localStorage.getItem(key) !== null);
};
