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

export const SVGO_PLUGIN_OPTIONS = [
  { id: "removeDoctype", name: "Remove doctype", enabledByDefault: true },
  { id: "removeXMLProcInst", name: "Remove XML instructions", enabledByDefault: true },
  { id: "removeComments", name: "Remove comments", enabledByDefault: true },
  { id: "removeMetadata", name: "Remove <metadata>", enabledByDefault: true },
  { id: "removeXMLNS", name: "Remove xmlns", enabledByDefault: false },
  { id: "removeEditorsNSData", name: "Remove editor data", enabledByDefault: true },
  { id: "cleanupAttrs", name: "Clean up attribute whitespace", enabledByDefault: true },
  { id: "mergeStyles", name: "Merge styles", enabledByDefault: true },
  { id: "inlineStyles", name: "Inline styles", enabledByDefault: true },
  { id: "minifyStyles", name: "Minify styles", enabledByDefault: true },
  { id: "convertStyleToAttrs", name: "Style to attributes", enabledByDefault: false },
  { id: "cleanupIds", name: "Clean up IDs", enabledByDefault: true },
  { id: "removeRasterImages", name: "Remove raster images", enabledByDefault: false },
  { id: "removeUselessDefs", name: "Remove unused defs", enabledByDefault: true },
  { id: "cleanupNumericValues", name: "Round/rewrite numbers", enabledByDefault: true },
  { id: "cleanupListOfValues", name: "Round/rewrite number lists", enabledByDefault: false },
  { id: "convertColors", name: "Minify colours", enabledByDefault: true },
  { id: "removeUnknownsAndDefaults", name: "Remove unknowns & defaults", enabledByDefault: true },
  { id: "removeNonInheritableGroupAttrs", name: "Remove unneeded group attrs", enabledByDefault: true },
  { id: "removeUselessStrokeAndFill", name: "Remove useless stroke & fill", enabledByDefault: true },
  { id: "removeViewBox", name: "Remove viewBox", enabledByDefault: false },
  { id: "cleanupEnableBackground", name: "Remove/tidy enable-background", enabledByDefault: true },
  { id: "removeHiddenElems", name: "Remove hidden elements", enabledByDefault: true },
  { id: "removeEmptyText", name: "Remove empty text", enabledByDefault: true },
  { id: "convertShapeToPath", name: "Shapes to (smaller) paths", enabledByDefault: true },
  { id: "moveElemsAttrsToGroup", name: "Move attrs to parent group", enabledByDefault: true },
  { id: "moveGroupAttrsToElems", name: "Move group attrs to elements", enabledByDefault: true },
  { id: "collapseGroups", name: "Collapse useless groups", enabledByDefault: true },
  { id: "convertPathData", name: "Round/rewrite paths", enabledByDefault: true },
  { id: "convertEllipseToCircle", name: "Convert non-eccentric <ellipse> to <circle>", enabledByDefault: true },
  { id: "convertTransform", name: "Round/rewrite transforms", enabledByDefault: true },
  { id: "removeEmptyAttrs", name: "Remove empty attrs", enabledByDefault: true },
  { id: "removeEmptyContainers", name: "Remove empty containers", enabledByDefault: true },
  { id: "mergePaths", name: "Merge paths", enabledByDefault: true },
  { id: "removeUnusedNS", name: "Remove unused namespaces", enabledByDefault: true },
  { id: "reusePaths", name: "Replace duplicate elements with links", enabledByDefault: false },
  { id: "sortAttrs", name: "Sort attrs", enabledByDefault: true },
  { id: "sortDefsChildren", name: "Sort children of <defs>", enabledByDefault: true },
  { id: "removeTitle", name: "Remove <title>", enabledByDefault: false },
  { id: "removeDesc", name: "Remove <desc>", enabledByDefault: true },
  { id: "removeDimensions", name: "Prefer viewBox to width/height", enabledByDefault: false },
  { id: "removeStyleElement", name: "Remove style elements", enabledByDefault: false },
  { id: "removeScripts", name: "Remove scripts", enabledByDefault: false },
  { id: "removeOffCanvasPaths", name: "Remove out-of-bounds paths", enabledByDefault: false },
  { id: "convertOneStopGradients", name: "Convert one-stop gradients to solid colours", enabledByDefault: false },
  { id: "removeDeprecatedAttrs", name: "Remove deprecated attributes", enabledByDefault: true },
  { id: "removeXlink", name: "Replace xlink with native SVG", enabledByDefault: false }
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
  }

  return merged;
};
