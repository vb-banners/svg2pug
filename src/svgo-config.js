const GLOBAL_DEFAULTS = {
  multipass: false,
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
  { id: "removeDoctype", name: "Remove doctype", enabledByDefault: true, category: "cleanup", description: "Removes DOCTYPE declaration from SVG" },
  { id: "removeXMLProcInst", name: "Remove XML instructions", enabledByDefault: true, category: "cleanup", description: "Removes XML processing instructions like <?xml version='1.0'?>" },
  { id: "removeComments", name: "Remove comments", enabledByDefault: true, category: "cleanup", description: "Removes all comments from SVG markup" },
  { id: "removeMetadata", name: "Remove <metadata>", enabledByDefault: true, category: "cleanup", description: "Removes <metadata> elements containing non-rendering information" },
  { id: "removeEditorsNSData", name: "Remove editor data", enabledByDefault: true, category: "cleanup", description: "Removes data created by vector editors (Sketch, Illustrator, etc.)" },
  { id: "removeTitle", name: "Remove <title>", enabledByDefault: false, category: "cleanup", description: "Removes <title> elements (may reduce accessibility)" },
  { id: "removeDesc", name: "Remove <desc>", enabledByDefault: true, category: "cleanup", description: "Removes <desc> description elements" },
  { id: "removeHiddenElems", name: "Remove hidden elements", enabledByDefault: true, category: "cleanup", description: "Removes elements that are not rendered (display:none, opacity:0, etc.)" },
  { id: "removeEmptyText", name: "Remove empty text", enabledByDefault: true, category: "cleanup", description: "Removes empty <text> elements with no content" },
  { id: "removeEmptyAttrs", name: "Remove empty attrs", enabledByDefault: true, category: "cleanup", description: "Removes attributes with empty values" },
  { id: "removeEmptyContainers", name: "Remove empty containers", enabledByDefault: true, category: "cleanup", description: "Removes container elements (<g>, <defs>, etc.) that have no children" },
  { id: "removeUselessDefs", name: "Remove unused defs", enabledByDefault: true, category: "cleanup", description: "Removes unreferenced definitions from <defs>" },
  { id: "removeUnusedNS", name: "Remove unused namespaces", enabledByDefault: true, category: "cleanup", description: "Removes unused namespace declarations" },
  { id: "removeStyleElement", name: "Remove style elements", enabledByDefault: false, category: "cleanup", description: "Removes <style> elements from SVG" },
  { id: "removeScriptElement", name: "Remove script elements", enabledByDefault: false, category: "cleanup", description: "Removes <script> elements from SVG" },
  { id: "removeRasterImages", name: "Remove raster images", enabledByDefault: false, category: "cleanup", description: "Removes embedded raster images (PNG, JPG) from SVG" },
  { id: "removeOffCanvasPaths", name: "Remove out-of-bounds paths", enabledByDefault: false, category: "cleanup", description: "Removes paths that are completely outside the viewBox" },
  
  // Styles & attributes
  { id: "cleanupAttrs", name: "Clean up attribute whitespace", enabledByDefault: true, category: "style", description: "Removes unnecessary whitespace in attribute values" },
  { id: "mergeStyles", name: "Merge styles", enabledByDefault: true, category: "style", description: "Merges multiple <style> elements into one" },
  { id: "inlineStyles", name: "Inline styles", enabledByDefault: true, category: "style", description: "Moves styles from <style> elements to inline style attributes" },
  { id: "minifyStyles", name: "Minify styles", enabledByDefault: true, category: "style", description: "Minifies CSS in <style> elements and style attributes" },
  { id: "convertStyleToAttrs", name: "Style to attributes", enabledByDefault: false, category: "style", description: "Converts style properties to SVG attributes (fill, stroke, etc.)" },
  { id: "removeUselessStrokeAndFill", name: "Remove useless stroke & fill", enabledByDefault: true, category: "style", description: "Removes stroke and fill attributes when they match defaults" },
  { id: "cleanupEnableBackground", name: "Remove/tidy enable-background", enabledByDefault: true, category: "style", description: "Removes or simplifies enable-background attribute" },
  
  // Structure optimization
  { id: "moveElemsAttrsToGroup", name: "Move attrs to parent group", enabledByDefault: true, category: "structure", description: "Moves common attributes from child elements to parent <g> group" },
  { id: "moveGroupAttrsToElems", name: "Move group attrs to elements", enabledByDefault: true, category: "structure", description: "Moves group attributes to child elements when beneficial" },
  { id: "collapseGroups", name: "Collapse useless groups", enabledByDefault: true, category: "structure", description: "Removes unnecessary <g> wrapper groups" },
  { id: "sortDefsChildren", name: "Sort children of <defs>", enabledByDefault: true, category: "structure", description: "Sorts elements in <defs> for better compression" },
  { id: "removeNonInheritableGroupAttrs", name: "Remove unneeded group attrs", enabledByDefault: true, category: "structure", description: "Removes attributes from groups that don't affect children" },
  
  // Paths & shapes
  { id: "convertShapeToPath", name: "Shapes to (smaller) paths", enabledByDefault: true, category: "paths", description: "Converts basic shapes (rect, circle, etc.) to <path> when smaller" },
  { id: "convertEllipseToCircle", name: "Convert non-eccentric <ellipse> to <circle>", enabledByDefault: true, category: "paths", description: "Converts circular <ellipse> elements to <circle> for brevity" },
  { id: "convertPathData", name: "Round/rewrite paths", enabledByDefault: true, category: "paths", description: "Optimizes path data by rounding coordinates and using shorter commands" },
  { id: "mergePaths", name: "Merge paths", enabledByDefault: true, category: "paths", description: "Combines multiple paths with identical attributes" },
  { id: "reusePaths", name: "Replace duplicate elements with links", enabledByDefault: false, category: "paths", description: "Replaces duplicate shapes with <use> references to <defs>" },
  
  // Numbers & transforms
  { id: "cleanupNumericValues", name: "Round/rewrite numbers", enabledByDefault: true, category: "numbers", description: "Rounds numeric values to specified precision and removes trailing zeros" },
  { id: "convertTransform", name: "Round/rewrite transforms", enabledByDefault: true, category: "numbers", description: "Optimizes transform attributes (matrix, translate, scale, etc.)" },
  { id: "convertColors", name: "Minify colours", enabledByDefault: true, category: "numbers", description: "Converts colors to shortest form (#RGB, named colors, etc.)" },
  
  // SVG attributes
  { id: "removeUnknownsAndDefaults", name: "Remove unknowns & defaults", enabledByDefault: true, category: "attributes", description: "Removes unknown elements/attributes and attributes with default values" },
  { id: "removeViewBox", name: "Remove viewBox", enabledByDefault: false, category: "attributes", description: "Removes viewBox attribute if width and height are specified" },
  { id: "removeXMLNS", name: "Remove xmlns", enabledByDefault: false, category: "attributes", description: "Removes xmlns attribute (useful for inline SVG in HTML)" },
  { id: "removeDimensions", name: "Prefer viewBox to width/height", enabledByDefault: false, category: "attributes", description: "Removes width/height attributes in favor of viewBox for responsive SVG" }
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
