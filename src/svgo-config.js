const GLOBAL_DEFAULTS = {
  multipass: false,
  pretty: false,
  floatPrecision: 3,
  transformPrecision: 5
};

export const PRECISION_LIMITS = {
  min: 0,
  max: 8
};

// SVGO 4.0 builtin plugins organized by category
export const SVGO_PLUGIN_OPTIONS = [
  // Document cleanup
  { id: "removeDoctype", name: "Remove doctype", enabledByDefault: true, category: "cleanup" },
  { id: "removeXMLProcInst", name: "Remove XML instructions", enabledByDefault: true, category: "cleanup" },
  { id: "removeComments", name: "Remove comments", enabledByDefault: true, category: "cleanup" },
  { id: "removeMetadata", name: "Remove <metadata>", enabledByDefault: true, category: "cleanup" },
  { id: "removeEditorsNSData", name: "Remove editor data", enabledByDefault: true, category: "cleanup" },
  { id: "removeTitle", name: "Remove <title>", enabledByDefault: false, category: "cleanup" },
  { id: "removeDesc", name: "Remove <desc>", enabledByDefault: true, category: "cleanup" },
  { id: "removeHiddenElems", name: "Remove hidden elements", enabledByDefault: true, category: "cleanup" },
  { id: "removeEmptyText", name: "Remove empty text", enabledByDefault: true, category: "cleanup" },
  { id: "removeEmptyAttrs", name: "Remove empty attrs", enabledByDefault: true, category: "cleanup" },
  { id: "removeEmptyContainers", name: "Remove empty containers", enabledByDefault: true, category: "cleanup" },
  { id: "removeUselessDefs", name: "Remove unused defs", enabledByDefault: true, category: "cleanup" },
  { id: "removeUnusedNS", name: "Remove unused namespaces", enabledByDefault: true, category: "cleanup" },
  { id: "removeStyleElement", name: "Remove style elements", enabledByDefault: false, category: "cleanup" },
  { id: "removeScriptElement", name: "Remove script elements", enabledByDefault: false, category: "cleanup" },
  { id: "removeRasterImages", name: "Remove raster images", enabledByDefault: false, category: "cleanup" },
  { id: "removeOffCanvasPaths", name: "Remove out-of-bounds paths", enabledByDefault: false, category: "cleanup" },
  
  // Styles & attributes
  { id: "cleanupAttrs", name: "Clean up attribute whitespace", enabledByDefault: true, category: "style" },
  { id: "mergeStyles", name: "Merge styles", enabledByDefault: true, category: "style" },
  { id: "inlineStyles", name: "Inline styles", enabledByDefault: true, category: "style" },
  { id: "minifyStyles", name: "Minify styles", enabledByDefault: true, category: "style" },
  { id: "convertStyleToAttrs", name: "Style to attributes", enabledByDefault: false, category: "style" },
  { id: "removeUselessStrokeAndFill", name: "Remove useless stroke & fill", enabledByDefault: true, category: "style" },
  { id: "cleanupEnableBackground", name: "Remove/tidy enable-background", enabledByDefault: true, category: "style" },
  
  // Structure optimization
  { id: "moveElemsAttrsToGroup", name: "Move attrs to parent group", enabledByDefault: true, category: "structure" },
  { id: "moveGroupAttrsToElems", name: "Move group attrs to elements", enabledByDefault: true, category: "structure" },
  { id: "collapseGroups", name: "Collapse useless groups", enabledByDefault: true, category: "structure" },
  { id: "sortDefsChildren", name: "Sort children of <defs>", enabledByDefault: true, category: "structure" },
  { id: "removeNonInheritableGroupAttrs", name: "Remove unneeded group attrs", enabledByDefault: true, category: "structure" },
  
  // Paths & shapes
  { id: "convertShapeToPath", name: "Shapes to (smaller) paths", enabledByDefault: true, category: "paths" },
  { id: "convertEllipseToCircle", name: "Convert non-eccentric <ellipse> to <circle>", enabledByDefault: true, category: "paths" },
  { id: "convertPathData", name: "Round/rewrite paths", enabledByDefault: true, category: "paths" },
  { id: "mergePaths", name: "Merge paths", enabledByDefault: true, category: "paths" },
  { id: "reusePaths", name: "Replace duplicate elements with links", enabledByDefault: false, category: "paths" },
  
  // Numbers & transforms
  { id: "cleanupNumericValues", name: "Round/rewrite numbers", enabledByDefault: true, category: "numbers" },
  { id: "convertTransform", name: "Round/rewrite transforms", enabledByDefault: true, category: "numbers" },
  { id: "convertColors", name: "Minify colours", enabledByDefault: true, category: "numbers" },
  
  // SVG attributes
  { id: "removeUnknownsAndDefaults", name: "Remove unknowns & defaults", enabledByDefault: true, category: "attributes" },
  { id: "removeViewBox", name: "Remove viewBox", enabledByDefault: false, category: "attributes" },
  { id: "removeXMLNS", name: "Remove xmlns", enabledByDefault: false, category: "attributes" },
  { id: "removeDimensions", name: "Prefer viewBox to width/height", enabledByDefault: false, category: "attributes" }
];

export const getDefaultSvgoSettings = () => {
  const plugins = {};
  for (const plugin of SVGO_PLUGIN_OPTIONS) {
    plugins[plugin.id] = Boolean(plugin.enabledByDefault);
  }
  return { ...GLOBAL_DEFAULTS, plugins };
};

const clampPrecision = (value, fallback) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric < PRECISION_LIMITS.min) {
      return PRECISION_LIMITS.min;
    }
    if (numeric > PRECISION_LIMITS.max) {
      return PRECISION_LIMITS.max;
    }
    return numeric;
  }
  return fallback;
};

export const mergeSvgoSettings = raw => {
  const defaults = getDefaultSvgoSettings();
  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const merged = {
    ...defaults,
    plugins: { ...defaults.plugins }
  };

  if (Object.prototype.hasOwnProperty.call(raw, "multipass")) {
    merged.multipass = Boolean(raw.multipass);
  }

  if (Object.prototype.hasOwnProperty.call(raw, "pretty")) {
    merged.pretty = Boolean(raw.pretty);
  }

  merged.floatPrecision = clampPrecision(
    raw.floatPrecision,
    defaults.floatPrecision
  );
  merged.transformPrecision = clampPrecision(
    raw.transformPrecision,
    defaults.transformPrecision
  );

  if (raw.plugins && typeof raw.plugins === "object") {
    for (const option of SVGO_PLUGIN_OPTIONS) {
      if (Object.prototype.hasOwnProperty.call(raw.plugins, option.id)) {
        merged.plugins[option.id] = Boolean(raw.plugins[option.id]);
      }
    }
    // Handle old cleanupIDs -> cleanupIds migration
    if (raw.plugins.cleanupIDs !== undefined && raw.plugins.cleanupIds === undefined) {
      merged.plugins.cleanupIds = Boolean(raw.plugins.cleanupIDs);
    }
  }

  return merged;
};
