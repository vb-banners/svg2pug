import React, { Component } from "react";
import beautify from "js-beautify";
import pugBeautify from "pug-beautify";
import AceEditor from "react-ace";
import { optimize } from "./vendor/svgo-browser.esm";
import "brace/mode/html";
import "brace/mode/xml";
import "brace/mode/jade";
import "./themes/ayu-mirage-custom";
import { HTMLCode, JADECode } from "./template";
import "./App.css";
import "./fonts.css";
import {
  SVGO_PLUGIN_OPTIONS,
  getDefaultSvgoSettings,
  mergeSvgoSettings,
  PRECISION_LIMITS
} from "./svgo-config";

const CONTROLS_STORAGE_KEY = "html2pug:floatingControls";
const PUG_WIDTH_STORAGE_KEY = "html2pug:pugPaneWidth";
const MIN_PUG_RATIO = 0.1;
const MAX_PUG_RATIO = 0.9;
const SPLIT_RESIZE_TOLERANCE = 14;
const HTML_CODE_STORAGE_KEY = "html2pug:htmlCode";
const JADE_CODE_STORAGE_KEY = "html2pug:jadeCode";
const ID_TO_CLASS_STORAGE_KEY = "html2pug:idToClassToggle";
const SVGO_SETTINGS_STORAGE_KEY = "html2pug:svgoSettings";
const SVGO_ENABLED_STORAGE_KEY = "html2pug:svgoEnabled";
const OPEN_FILES_STORAGE_KEY = "html2pug:openFiles";
const ACTIVE_FILE_STORAGE_KEY = "html2pug:activeFileId";

const HEX_COLOR_MARKER_KEY = "__hexColorPreviewMarker";
const HEX_COLOR_REGEX_SOURCE = "#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])";
const EDITOR_BACKGROUND_RGB = { r: 31, g: 36, b: 48 };

const toHexPair = value => {
  const doubled = value + value;
  return doubled.toUpperCase();
};

const clamp = (value, min, max) => {
  if (value < min) {
    return min;
  }
  if (typeof max === "number" && value > max) {
    return max;
  }
  return value;
};

const formatAlpha = value => {
  if (value <= 0) {
    return "0";
  }
  if (value >= 1) {
    return "1";
  }
  return (value < 0.1 ? value.toFixed(3) : value.toFixed(2)).replace(/\.0+$/, "").replace(/0+$/, "");
};

const escapeHtml = value =>
  String(value).replace(/[&<>"']/g, match => {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return match;
    }
  });

const blendChannel = (base, target, ratio) => Math.round(base + (target - base) * ratio);

const normalizeHexColor = hex => {
  if (typeof hex !== "string" || !hex.startsWith("#")) {
    return null;
  }
  const token = hex;
  let raw = hex.slice(1);
  if (![3, 4, 6, 8].includes(raw.length)) {
    return null;
  }
  if (raw.length === 3 || raw.length === 4) {
    raw = raw
      .split("")
      .map(toHexPair)
      .join("");
  }

  let alphaHex = null;
  if (raw.length === 8) {
    alphaHex = raw.slice(6, 8);
    raw = raw.slice(0, 6);
  }

  const normalized = raw.toUpperCase();
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some(value => Number.isNaN(value))) {
    return null;
  }

  const alpha = alphaHex ? parseInt(alphaHex, 16) / 255 : 1;
  const display = token;
  const rgbaString = `rgba(${r}, ${g}, ${b}, ${formatAlpha(alpha)})`;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const highlightColor = `rgb(${r}, ${g}, ${b})`;
  const borderMixRatio = clamp(alpha > 0 ? 0.82 : 0.6, 0.4, 0.9);
  const borderR = blendChannel(EDITOR_BACKGROUND_RGB.r, r, borderMixRatio);
  const borderG = blendChannel(EDITOR_BACKGROUND_RGB.g, g, borderMixRatio);
  const borderB = blendChannel(EDITOR_BACKGROUND_RGB.b, b, borderMixRatio);
  const borderColor = `rgb(${borderR}, ${borderG}, ${borderB})`;
  const textColor = luminance > 0.68 ? "#1f2430" : "#f6f7fb";

  return {
    display,
    highlightColor,
    borderColor,
    textColor,
    rgbaString
  };
};

const shouldRenderHexPreview = (line, index) => {
  if (index <= 0) {
    return true;
  }
  const prev = line[index - 1];
  return !/[0-9a-zA-Z_-]/.test(prev);
};

const createHexColorMarker = editor => ({
  regex: new RegExp(HEX_COLOR_REGEX_SOURCE, "g"),
  highlightPadding: 7,
  minHighlightHeight: 14,
  redraw: true,
  update(html, markerLayer, session, config) {
    const firstRow = config.firstRow;
    const getLength = typeof session.getLength === "function" ? session.getLength.bind(session) : () => session.getDocument().getLength();
    const lastRow = Math.min(config.lastRow, getLength() - 1);
    const charWidth = config.characterWidth || 7;
    const lineHeight = config.lineHeight || 16;
    const markerPadding = markerLayer.$padding || 0;

    for (let row = firstRow; row <= lastRow; row += 1) {
      const line = session.getLine(row);
      if (!line || line.indexOf("#") === -1) {
        continue;
      }
      this.regex.lastIndex = 0;
      let match;
      // eslint-disable-next-line no-cond-assign
      while ((match = this.regex.exec(line)) !== null) {
        const startIndex = match.index;
        if (!shouldRenderHexPreview(line, startIndex)) {
          continue;
        }
        const colorInfo = normalizeHexColor(match[0]);
        if (!colorInfo) {
          continue;
        }

        const displayText = colorInfo.display;
        const screenPos = session.documentToScreenPosition(row, startIndex);
        const endScreenPos = session.documentToScreenPosition(row, startIndex + displayText.length);
        const topBase = markerLayer.$getTop(screenPos.row, config);
        const highlightHeight = clamp(Math.round(lineHeight - 4), this.minHighlightHeight, Math.round(lineHeight - 1));
        const highlightTop = Math.round(topBase + (lineHeight - highlightHeight) / 2);
        const baseLeft = Math.round(markerPadding + screenPos.column * charWidth);
        const baseRight = Math.round(markerPadding + endScreenPos.column * charWidth);
        const leftPadding = Math.max(1, Math.round(charWidth * 0.2));
        const rightPadding = Math.max(2, Math.round(charWidth * 0.25));
        const highlightLeft = clamp(baseLeft - leftPadding, 0);
        const highlightRight = Math.max(baseRight + rightPadding, highlightLeft + leftPadding + 2);
        const highlightWidth = Math.max(0, highlightRight - highlightLeft);
        const title = `${colorInfo.display} - ${colorInfo.rgbaString}`;
        const safeTitle = escapeHtml(title);
        const safeDisplay = escapeHtml(displayText);
        const configFontSizeValue = typeof config.fontSize === "string" ? parseFloat(config.fontSize) : config.fontSize;
        const editorFontSize = editor && typeof editor.getFontSize === "function" ? editor.getFontSize() : null;
        const numericFontSize = Number.isFinite(configFontSizeValue) ? configFontSizeValue : editorFontSize || 14;
        const highlightStyle = `top:${highlightTop}px;left:${highlightLeft}px;width:${highlightWidth}px;height:${highlightHeight}px;background:${colorInfo.highlightColor};border-color:${colorInfo.borderColor};`;
        const textStyle = `color:${colorInfo.textColor};font-size:${numericFontSize}px;line-height:${highlightHeight}px;padding:0 ${rightPadding}px 0 ${leftPadding}px;`;

        html.push(
          `<div class="ace-hex-color-chip" style="${highlightStyle}" title="${safeTitle}">` +
            `<span class="ace-hex-color-chip__text" style="${textStyle}">${safeDisplay}</span>` +
          `</div>`
        );
      }
    }
  }
});

const registerHexColorPreview = editor => {
  if (!editor || !editor.session) {
    return () => {};
  }

  const ensureMarker = session => {
    if (!session || session[HEX_COLOR_MARKER_KEY]) {
      return;
    }
    const marker = createHexColorMarker(editor);
    const markerId = session.addDynamicMarker(marker, true);

    const triggerFrontMarkerUpdate = () => {
      if (editor && editor.renderer) {
        if (typeof editor.renderer.updateFrontMarkers === "function") {
          editor.renderer.updateFrontMarkers();
        }
        if (typeof editor.renderer.updateFull === "function") {
          editor.renderer.updateFull(true);
        }
      } else if (typeof session._signal === "function") {
        session._signal("changeFrontMarker");
      }
    };

    const handleSessionChange = () => triggerFrontMarkerUpdate();
    const handleEditorChange = () => triggerFrontMarkerUpdate();

    if (typeof session.on === "function") {
      session.on("change", handleSessionChange);
    } else if (typeof session.addEventListener === "function") {
      session.addEventListener("change", handleSessionChange);
    }

    if (typeof editor.on === "function") {
      editor.on("change", handleEditorChange);
    }

    session[HEX_COLOR_MARKER_KEY] = { marker, markerId, handleSessionChange, handleEditorChange };
    triggerFrontMarkerUpdate();
  };

  const removeMarker = session => {
    if (session && session[HEX_COLOR_MARKER_KEY]) {
      const { markerId, marker, handleSessionChange, handleEditorChange } = session[HEX_COLOR_MARKER_KEY];
      if (typeof session.removeMarker === "function") {
        session.removeMarker(markerId != null ? markerId : marker);
      }
      if (handleSessionChange) {
        if (typeof session.off === "function") {
          session.off("change", handleSessionChange);
        } else if (typeof session.removeEventListener === "function") {
          session.removeEventListener("change", handleSessionChange);
        }
      }
      if (handleEditorChange && typeof editor.off === "function") {
        editor.off("change", handleEditorChange);
      }
      delete session[HEX_COLOR_MARKER_KEY];
      // prevent retaining stale regex state
      if (marker && marker.regex) {
        marker.regex.lastIndex = 0;
      }
    }
  };

  ensureMarker(editor.session);

  const handleChangeSession = ({ oldSession, session }) => {
    if (oldSession) {
      removeMarker(oldSession);
    }
    ensureMarker(session);
  };

  editor.on("changeSession", handleChangeSession);

  const detachListeners = () => {
    if (typeof editor.off === "function") {
      editor.off("changeSession", handleChangeSession);
    } else if (typeof editor.removeListener === "function") {
      editor.removeListener("changeSession", handleChangeSession);
    }
  };

  const cleanup = () => {
    detachListeners();
    removeMarker(editor.session);
  };

  const destroyHandler = () => {
    cleanup();
    if (typeof editor.off === "function") {
      editor.off("destroy", destroyHandler);
    } else if (typeof editor.removeListener === "function") {
      editor.removeListener("destroy", destroyHandler);
    }
  };

  editor.on("destroy", destroyHandler);

  return () => {
    destroyHandler();
  };
};

class App extends Component {
  htmlEditor = null;
  jadeEditor = null;
  floatingControlsRef = React.createRef();
  sectionRef = React.createRef();
  splitRef = React.createRef();
  svgoControlsRef = React.createRef();
  helpControlsRef = React.createRef();
  dragOffset = { x: 0, y: 0 };
  resizeListenersAttached = false;
  cachedSplitRect = null;
  currentSplitRect = null;
  controlsResizeRaf = null;
  isSyncingEditorScroll = false;
  detachScrollSync = null;
  htmlColorPreviewDetach = null;
  jadeColorPreviewDetach = null;

  state = {
    HTMLCode,
    JADECode,
    tabSize: 4,
    useSoftTabs: true,
    enableSvgIdToClass: false,
    controlsPosition: null,
    isControlsDragging: false,
    pugWidthRatio: 0.5,
    isResizingSplit: false,
    svgoSettings: getDefaultSvgoSettings(),
    isSvgoEnabled: true,
    isSvgoMenuOpen: false,
    isHelpMenuOpen: false,
    openFiles: [],
    activeFileId: null,
    draggedTabId: null,
    dragOverTabId: null
  };

  constructor() {
    super();
    this.Html2Jade = window.Html2Jade;
    this.pug = window.pug;
  }

  getControlsMetrics = () => {
    const section = this.sectionRef.current;
    const controls = this.floatingControlsRef.current;
    if (!section || !controls) {
      return null;
    }
    const sectionRect = section.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    const maxLeft = Math.max(0, sectionRect.width - controlsRect.width);
    const maxTop = Math.max(0, sectionRect.height - controlsRect.height);
    return { sectionRect, controlsRect, maxLeft, maxTop };
  };

  computeRatiosFromPixels = (position, metrics) => {
    if (!metrics) {
      return null;
    }
    const { maxLeft, maxTop } = metrics;
    const leftRatio = maxLeft > 0 ? clamp(position.left / maxLeft, 0, 1) : 0;
    const topRatio = maxTop > 0 ? clamp(position.top / maxTop, 0, 1) : 0;
    return { leftRatio, topRatio };
  };

  computeControlsStyle = position => {
    if (!position) {
      return undefined;
    }
    const metrics = this.getControlsMetrics();
    if (!metrics) {
      return undefined;
    }
    const { maxLeft, maxTop } = metrics;
    const leftRatio = typeof position.leftRatio === "number" ? clamp(position.leftRatio, 0, 1) : 0;
    const topRatio = typeof position.topRatio === "number" ? clamp(position.topRatio, 0, 1) : 0;
    const leftPx = maxLeft > 0 ? leftRatio * maxLeft : 0;
    const topPx = maxTop > 0 ? topRatio * maxTop : 0;
    return {
      top: `${Math.round(topPx)}px`,
      left: `${Math.round(leftPx)}px`,
      right: "auto",
      bottom: "auto",
      transform: "none"
    };
  };

  normalizeSavedControlsPosition = saved => {
    if (!saved) {
      return null;
    }
    const metrics = this.getControlsMetrics();
    if (!metrics) {
      return null;
    }
    if (
      typeof saved.leftRatio === "number" &&
      typeof saved.topRatio === "number"
    ) {
      return {
        leftRatio: clamp(saved.leftRatio, 0, 1),
        topRatio: clamp(saved.topRatio, 0, 1)
      };
    }
    if (typeof saved.left === "number" && typeof saved.top === "number") {
      return this.computeRatiosFromPixels(saved, metrics);
    }
    return null;
  };

  restoreControlsPosition = saved => {
    const normalized = this.normalizeSavedControlsPosition(saved);
    if (normalized) {
      this.setState({ controlsPosition: normalized }, () => {
        // Persist in the new format so future loads reuse ratios.
        this.persistControlsPosition();
        this.scheduleControlsReflow();
      });
      return true;
    }
    return false;
  };

  reflowControlsPosition = () => {
    this.setState(prevState => {
      const current = prevState.controlsPosition;
      if (!current) {
        return null;
      }
      const metrics = this.getControlsMetrics();
      if (!metrics) {
        return null;
      }
      const clampedLeftRatio = clamp(
        typeof current.leftRatio === "number" ? current.leftRatio : 0,
        0,
        1
      );
      const clampedTopRatio = clamp(
        typeof current.topRatio === "number" ? current.topRatio : 0,
        0,
        1
      );
      const pixelPosition = {
        left: metrics.maxLeft > 0 ? clampedLeftRatio * metrics.maxLeft : 0,
        top: metrics.maxTop > 0 ? clampedTopRatio * metrics.maxTop : 0
      };
      const ratios = this.computeRatiosFromPixels(pixelPosition, metrics);
      if (!ratios) {
        return null;
      }
      return {
        controlsPosition: {
          leftRatio: ratios.leftRatio,
          topRatio: ratios.topRatio
        }
      };
    }, () => {
      this.persistControlsPosition();
    });
  };

  scheduleControlsReflow = () => {
    if (typeof window === "undefined") {
      this.reflowControlsPosition();
      return;
    }
    if (typeof window.requestAnimationFrame !== "function") {
      this.reflowControlsPosition();
      return;
    }
    if (this.controlsResizeRaf != null) {
      return;
    }
    this.controlsResizeRaf = window.requestAnimationFrame(() => {
      this.controlsResizeRaf = null;
      this.reflowControlsPosition();
    });
  };

  handleWindowResize = () => {
    if (!this.state.controlsPosition) {
      return;
    }
    this.scheduleControlsReflow();
  };

  componentDidMount() {
    document.addEventListener("mousemove", this.handleDocumentMouseMove);
    document.addEventListener("mouseup", this.handleDocumentMouseUp);
    document.addEventListener("pointerdown", this.handleDocumentPointerDown);
    document.addEventListener("keydown", this.handleKeyDown);
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("resize", this.handleWindowResize);
    }
    try {
      window.localStorage.removeItem(CONTROLS_STORAGE_KEY);
      const savedWidth = window.localStorage.getItem(PUG_WIDTH_STORAGE_KEY);
      if (savedWidth) {
        const parsedWidth = parseFloat(savedWidth);
        if (!Number.isNaN(parsedWidth)) {
          this.setState({
            pugWidthRatio: Math.min(
              MAX_PUG_RATIO,
              Math.max(MIN_PUG_RATIO, parsedWidth)
            )
          });
        }
      }
      const savedHtmlCode = window.localStorage.getItem(HTML_CODE_STORAGE_KEY);
      const savedJadeCode = window.localStorage.getItem(JADE_CODE_STORAGE_KEY);
      const savedIdToClass = window.localStorage.getItem(
        ID_TO_CLASS_STORAGE_KEY
      );
      const savedSvgoSettings = window.localStorage.getItem(
        SVGO_SETTINGS_STORAGE_KEY
      );
      const savedSvgoEnabled = window.localStorage.getItem(
        SVGO_ENABLED_STORAGE_KEY
      );
      const restoredState = {};
      if (typeof savedHtmlCode === "string") {
        restoredState.HTMLCode = savedHtmlCode;
      }
      if (typeof savedJadeCode === "string") {
        restoredState.JADECode = savedJadeCode;
      }
      if (savedIdToClass === "true" || savedIdToClass === "false") {
        restoredState.enableSvgIdToClass = savedIdToClass === "true";
      }
      if (savedSvgoSettings) {
        const parsedSvgo = JSON.parse(savedSvgoSettings);
        restoredState.svgoSettings = mergeSvgoSettings(parsedSvgo);
      }
      if (savedSvgoEnabled === "true" || savedSvgoEnabled === "false") {
        restoredState.isSvgoEnabled = savedSvgoEnabled === "true";
      }
      const savedOpenFiles = window.localStorage.getItem(OPEN_FILES_STORAGE_KEY);
      const savedActiveFileId = window.localStorage.getItem(ACTIVE_FILE_STORAGE_KEY);
      if (savedOpenFiles) {
        try {
          const parsedFiles = JSON.parse(savedOpenFiles);
          if (Array.isArray(parsedFiles) && parsedFiles.length > 0) {
            restoredState.openFiles = parsedFiles;
            if (savedActiveFileId && parsedFiles.some(f => f.id === savedActiveFileId)) {
              restoredState.activeFileId = savedActiveFileId;
              const activeFile = parsedFiles.find(f => f.id === savedActiveFileId);
              if (activeFile) {
                restoredState.HTMLCode = activeFile.htmlContent;
                restoredState.JADECode = activeFile.jadeContent;
              }
            } else if (parsedFiles.length > 0) {
              restoredState.activeFileId = parsedFiles[0].id;
              restoredState.HTMLCode = parsedFiles[0].htmlContent;
              restoredState.JADECode = parsedFiles[0].jadeContent;
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      if (Object.keys(restoredState).length > 0) {
        this.setState(restoredState);
      }
    } catch (error) {
      // Storage might be unavailable; ignore and fall back to defaults.
    }
    this.scheduleControlsReflow();
  }

  componentWillUnmount() {
    document.removeEventListener("mousemove", this.handleDocumentMouseMove);
    document.removeEventListener("mouseup", this.handleDocumentMouseUp);
    document.removeEventListener("keydown", this.handleKeyDown);
    if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
      window.removeEventListener("resize", this.handleWindowResize);
    }
    document.removeEventListener("pointerdown", this.handleDocumentPointerDown);
    if (this.controlsResizeRaf != null && typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(this.controlsResizeRaf);
      this.controlsResizeRaf = null;
    }
    this.removeResizeListeners();
    if (this.detachScrollSync) {
      this.detachScrollSync();
      this.detachScrollSync = null;
    }
    if (this.htmlColorPreviewDetach) {
      this.htmlColorPreviewDetach();
      this.htmlColorPreviewDetach = null;
    }
    if (this.jadeColorPreviewDetach) {
      this.jadeColorPreviewDetach();
      this.jadeColorPreviewDetach = null;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.tabSize !== this.state.tabSize ||
      prevState.useSoftTabs !== this.state.useSoftTabs
    ) {
      this.syncEditorSession(this.htmlEditor);
      this.syncEditorSession(this.jadeEditor);
    }
    if (!prevState.controlsPosition && this.state.controlsPosition) {
      this.scheduleControlsReflow();
    }
  }

  syncEditorSession = editor => {
    if (!editor) {
      return;
    }
    const { tabSize, useSoftTabs } = this.state;
    editor.session.setTabSize(tabSize);
    editor.session.setUseSoftTabs(useSoftTabs);
    editor.renderer.updateFull();
  };
  persistHTMLCode = value => {
    try {
      const storedValue =
        value === undefined || value === null ? "" : value;
      window.localStorage.setItem(HTML_CODE_STORAGE_KEY, storedValue);
    } catch (error) {
      // Ignore persistence errors.
    }
  };

  persistJadeCode = value => {
    try {
      const storedValue =
        value === undefined || value === null ? "" : value;
      window.localStorage.setItem(JADE_CODE_STORAGE_KEY, storedValue);
    } catch (error) {
      // Ignore persistence errors.
    }
  };
  persistSvgIdToClassToggle = isEnabled => {
    try {
      window.localStorage.setItem(
        ID_TO_CLASS_STORAGE_KEY,
        isEnabled ? "true" : "false"
      );
    } catch (error) {
      // Ignore persistence issues.
    }
  };

  persistSvgoSettings = settings => {
    try {
      const payload = settings || this.state.svgoSettings;
      window.localStorage.setItem(
        SVGO_SETTINGS_STORAGE_KEY,
        JSON.stringify(payload)
      );
    } catch (error) {
      // Ignore persistence issues.
    }
  };

  persistSvgoEnabled = isEnabled => {
    try {
      window.localStorage.setItem(
        SVGO_ENABLED_STORAGE_KEY,
        isEnabled ? "true" : "false"
      );
    } catch (error) {
      // Ignore persistence issues.
    }
  };

  persistOpenFiles = () => {
    try {
      window.localStorage.setItem(
        OPEN_FILES_STORAGE_KEY,
        JSON.stringify(this.state.openFiles)
      );
    } catch (error) {
      // Ignore persistence issues.
    }
  };

  persistActiveFileId = () => {
    try {
      window.localStorage.setItem(
        ACTIVE_FILE_STORAGE_KEY,
        this.state.activeFileId || ""
      );
    } catch (error) {
      // Ignore persistence issues.
    }
  };

  handleSvgoToggle = event => {
    const nextEnabled = Boolean(event.target.checked);
    this.setState(
      {
        isSvgoEnabled: nextEnabled
      },
      () => {
        this.persistSvgoEnabled(nextEnabled);
        this.regenerateAllTabsPug();
      }
    );
  };

  handleSvgoGlobalCheckboxChange = event => {
    const { name, checked } = event.target;
    this.setState(
      prevState => {
        if (!name) {
          return null;
        }
        const nextSettings = {
          ...prevState.svgoSettings,
          [name]: checked
        };
        return {
          svgoSettings: nextSettings
        };
      },
      () => {
        this.persistSvgoSettings();
        this.regenerateAllTabsPug();
      }
    );
  };

  handleSvgoPrecisionChange = event => {
    const { name, value } = event.target;
    this.setState(
      prevState => {
        if (!name) {
          return null;
        }
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          return null;
        }
        const nextSettings = {
          ...prevState.svgoSettings,
          [name]: clamp(
            numeric,
            PRECISION_LIMITS.min,
            PRECISION_LIMITS.max
          )
        };
        return {
          svgoSettings: nextSettings
        };
      },
      () => {
        this.persistSvgoSettings();
        this.regenerateAllTabsPug();
      }
    );
  };

  handleSvgoPluginToggle = event => {
    const { name, checked } = event.target;
    if (!name) {
      return;
    }
    this.setState(
      prevState => {
        if (!prevState.svgoSettings || !prevState.svgoSettings.plugins) {
          return null;
        }
        const nextPlugins = {
          ...prevState.svgoSettings.plugins,
          [name]: checked
        };
        return {
          svgoSettings: {
            ...prevState.svgoSettings,
            plugins: nextPlugins
          }
        };
      },
      () => {
        this.persistSvgoSettings();
        this.regenerateAllTabsPug();
      }
    );
  };

  toggleSvgoMenu = () => {
    this.setState(prevState => ({
      isSvgoMenuOpen: !prevState.isSvgoMenuOpen
    }));
  };

  closeSvgoMenu = () => {
    this.setState({ isSvgoMenuOpen: false });
  };

  toggleHelpMenu = () => {
    this.setState(prevState => ({
      isHelpMenuOpen: !prevState.isHelpMenuOpen
    }));
  };

  closeHelpMenu = () => {
    this.setState({ isHelpMenuOpen: false });
  };

  handleDocumentPointerDown = event => {
    if (this.state.isSvgoMenuOpen) {
      const controls = this.svgoControlsRef.current;
      if (controls && controls.contains(event.target)) {
        return;
      }
      this.closeSvgoMenu();
    }
    if (this.state.isHelpMenuOpen) {
      const helpControls = this.helpControlsRef.current;
      if (helpControls && helpControls.contains(event.target)) {
        return;
      }
      this.closeHelpMenu();
    }
  };

  buildSvgoConfig = settings => {
    const floatPrecision = Number(settings.floatPrecision);
    const transformPrecision = Number(settings.transformPrecision);
    const plugins = [];

    for (const option of SVGO_PLUGIN_OPTIONS) {
      const enabled = Boolean(settings.plugins[option.id]);

      if (enabled) {
        const plugin = {
          name: option.id
        };

        const params = {};

        // Only add precision params to plugins that use them
        if (option.id === 'cleanupNumericValues' && Number.isFinite(floatPrecision)) {
          params.floatPrecision = floatPrecision === 0 ? 1 : floatPrecision;
        }

        if ((option.id === 'convertPathData' || option.id === 'convertTransform') && Number.isFinite(transformPrecision)) {
          params.transformPrecision = transformPrecision;
        }

        if (Object.keys(params).length > 0) {
          plugin.params = params;
        }

        plugins.push(plugin);
      }
    }

    const config = {
      multipass: Boolean(settings.multipass),
      plugins,
      js2svg: {
        pretty: Boolean(settings.pretty),
        indent: 2
      }
    };
    
    return config;
  };

  applySvgoOptimizations = (source, settings) => {
    const html = typeof source === "string" ? source : "";
    if (!html.trim()) {
      return html;
    }

    const fragmentPattern = /<svg[\s\S]*?<\/svg>/gi;
    if (!fragmentPattern.test(html)) {
      return html;
    }
    fragmentPattern.lastIndex = 0;

    const activeSettings = settings || this.state.svgoSettings || getDefaultSvgoSettings();
    const config = this.buildSvgoConfig(activeSettings);

    let optimized = "";
    let lastIndex = 0;
    let match;

    while ((match = fragmentPattern.exec(html)) !== null) {
      optimized += html.slice(lastIndex, match.index);
      let fragment = match[0];
      try {
        const result = optimize(fragment, config);
        if (result && typeof result.data === "string") {
          fragment = result.data;
        }
      } catch (error) {
        // Keep the original fragment for this SVG and continue
        console.warn('SVGO optimization failed for fragment:', error.message);
      }
      optimized += fragment;
      lastIndex = match.index + match[0].length;
    }

    optimized += html.slice(lastIndex);
    return optimized;
  };

  handleSvgoReset = () => {
    const defaults = getDefaultSvgoSettings();
    this.setState(
      {
        svgoSettings: defaults
      },
      () => {
        this.persistSvgoSettings(defaults);
        this.regenerateAllTabsPug();
      }
    );
  };

  handleFileOpen = event => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    let filesProcessed = 0;
    const totalFiles = files.length;
    const newFiles = [];

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target && e.target.result;
        if (typeof content === "string") {
          const fileId = `file-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Convert HTML to Pug for this file
          const jadeContent = this.convertHtmlToJade(content);
          
          newFiles.push({
            id: fileId,
            name: file.name,
            htmlContent: content,
            jadeContent: jadeContent
          });

          filesProcessed++;
          if (filesProcessed === totalFiles) {
            // All files have been read, update state
            this.setState(prevState => {
              const openFiles = [...prevState.openFiles, ...newFiles];
              // Set the first newly added file as active
              const activeFileId = newFiles[0].id;
              return {
                openFiles,
                activeFileId,
                HTMLCode: newFiles[0].htmlContent,
                JADECode: newFiles[0].jadeContent
              };
            }, () => {
              this.persistHTMLCode(newFiles[0].htmlContent);
              this.persistJadeCode(newFiles[0].jadeContent);
              this.persistOpenFiles();
              this.persistActiveFileId();
            });
          }
        }
      };
      reader.onerror = () => {
        console.error(`Failed to read file: ${file.name}`);
        filesProcessed++;
      };
      reader.readAsText(file);
    });

    // Reset the input so the same file can be selected again
    event.target.value = "";
  };

  handleTabSwitch = fileId => {
    const file = this.state.openFiles.find(f => f.id === fileId);
    if (!file) {
      return;
    }

    this.setState({
      activeFileId: fileId,
      HTMLCode: file.htmlContent,
      JADECode: file.jadeContent
    }, () => {
      this.persistHTMLCode(file.htmlContent);
      this.persistJadeCode(file.jadeContent);
      this.persistActiveFileId();
    });
  };

  handleTabDragStart = (fileId, event) => {
    this.setState({ draggedTabId: fileId });
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', fileId);
  };

  handleTabDragOver = (fileId, event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    if (this.state.dragOverTabId !== fileId) {
      this.setState({ dragOverTabId: fileId });
    }
  };

  handleTabDragLeave = () => {
    this.setState({ dragOverTabId: null });
  };

  handleTabDrop = (targetFileId, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const { draggedTabId } = this.state;
    
    if (!draggedTabId || draggedTabId === targetFileId) {
      this.setState({ draggedTabId: null, dragOverTabId: null });
      return;
    }

    this.setState(prevState => {
      const openFiles = [...prevState.openFiles];
      const draggedIndex = openFiles.findIndex(f => f.id === draggedTabId);
      const targetIndex = openFiles.findIndex(f => f.id === targetFileId);
      
      if (draggedIndex === -1 || targetIndex === -1) {
        return { draggedTabId: null, dragOverTabId: null };
      }

      // Remove dragged item and insert at target position
      const [draggedItem] = openFiles.splice(draggedIndex, 1);
      openFiles.splice(targetIndex, 0, draggedItem);

      return {
        openFiles,
        draggedTabId: null,
        dragOverTabId: null
      };
    }, () => {
      this.persistOpenFiles();
    });
  };

  handleTabDragEnd = () => {
    this.setState({ draggedTabId: null, dragOverTabId: null });
  };

  handleTabClose = (fileId, event) => {
    if (event) {
      event.stopPropagation();
    }

    this.setState(prevState => {
      const openFiles = prevState.openFiles.filter(f => f.id !== fileId);
      let nextActiveId = prevState.activeFileId;

      // If we're closing the active tab, switch to another tab
      if (fileId === prevState.activeFileId) {
        if (openFiles.length > 0) {
          const closedIndex = prevState.openFiles.findIndex(f => f.id === fileId);
          const nextIndex = Math.min(closedIndex, openFiles.length - 1);
          nextActiveId = (openFiles[nextIndex] && openFiles[nextIndex].id) || null;
        } else {
          nextActiveId = null;
        }
      }

      const activeFile = openFiles.find(f => f.id === nextActiveId);
      const htmlCode = activeFile ? activeFile.htmlContent : HTMLCode;
      const jadeCode = activeFile ? activeFile.jadeContent : JADECode;

      return {
        openFiles,
        activeFileId: nextActiveId,
        HTMLCode: htmlCode,
        JADECode: jadeCode
      };
    }, () => {
      this.persistOpenFiles();
      this.persistActiveFileId();
      if (this.state.activeFileId) {
        const activeFile = this.state.openFiles.find(f => f.id === this.state.activeFileId);
        if (activeFile) {
          this.persistHTMLCode(activeFile.htmlContent);
          this.persistJadeCode(activeFile.jadeContent);
        }
      } else {
        this.persistHTMLCode(HTMLCode);
        this.persistJadeCode(JADECode);
      }
    });
  };

  handleNewTab = () => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newFile = {
      id: fileId,
      name: "Untitled",
      htmlContent: "",
      jadeContent: ""
    };

    this.setState(prevState => {
      const openFiles = [...prevState.openFiles, newFile];
      return {
        openFiles,
        activeFileId: fileId,
        HTMLCode: "",
        JADECode: ""
      };
    }, () => {
      this.persistHTMLCode("");
      this.persistJadeCode("");
      this.persistOpenFiles();
      this.persistActiveFileId();
    });
  };

  handleKeyDown = event => {
    const key = event.key ? event.key.toLowerCase() : '';
    const code = event.code || '';
    
    // Command+Shift+K (Mac) or Ctrl+Shift+K (Windows/Linux) to delete current line
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (key === 'k' || code === 'KeyK')) {
      event.preventDefault();
      event.stopPropagation();
      // Get the active editor (HTML or JADE)
      const htmlEditor = this.htmlEditor;
      const jadeEditor = this.jadeEditor;
      
      // Determine which editor has focus and delete line in that editor
      if (htmlEditor && htmlEditor.isFocused()) {
        htmlEditor.removeLines();
      } else if (jadeEditor && jadeEditor.isFocused()) {
        jadeEditor.removeLines();
      }
      return false;
    }
    
    // Option+Command+T (Mac) or Alt+Ctrl+T (Windows/Linux) to create a new tab
    if ((event.metaKey || event.ctrlKey) && event.altKey && (key === 't' || code === 'KeyT')) {
      event.preventDefault();
      event.stopPropagation();
      this.handleNewTab();
      return false;
    }
    
    // Option+Command+O (Mac) or Alt+Ctrl+O (Windows/Linux) to open files
    if ((event.metaKey || event.ctrlKey) && event.altKey && (key === 'o' || code === 'KeyO')) {
      event.preventDefault();
      event.stopPropagation();
      // Trigger the file input click
      const fileInput = document.getElementById('open-file-input');
      if (fileInput) {
        fileInput.click();
      }
      return false;
    }
    
    // Control+Option+Command+W (Mac) or Ctrl+Alt+W (Windows/Linux) to close all except active tab
    if (event.metaKey && event.altKey && event.ctrlKey && (key === 'w' || code === 'KeyW')) {
      event.preventDefault();
      event.stopPropagation();
      if (this.state.activeFileId) {
        this.setState(prevState => {
          const activeFile = prevState.openFiles.find(f => f.id === prevState.activeFileId);
          if (activeFile) {
            return { openFiles: [activeFile] };
          }
          return null;
        }, () => {
          this.persistOpenFiles();
        });
      }
      return false;
    }
    
    // Shift+Option+Command+W (Mac) or Shift+Alt+Ctrl+W (Windows/Linux) to close all tabs
    if ((event.metaKey || event.ctrlKey) && event.altKey && event.shiftKey && (key === 'w' || code === 'KeyW')) {
      event.preventDefault();
      event.stopPropagation();
      this.setState({
        openFiles: [],
        activeFileId: null,
        HTMLCode: HTMLCode,
        JADECode: JADECode
      }, () => {
        this.persistOpenFiles();
        this.persistActiveFileId();
        this.persistHTMLCode(HTMLCode);
        this.persistJadeCode(JADECode);
      });
      return false;
    }
    
    // Option+Command+W (Mac) or Alt+Ctrl+W (Windows/Linux) to close active tab
    if ((event.metaKey || event.ctrlKey) && event.altKey && (key === 'w' || code === 'KeyW')) {
      event.preventDefault();
      event.stopPropagation();
      if (this.state.activeFileId) {
        this.handleTabClose(this.state.activeFileId, null);
      }
      return false;
    }
  };

  formatTabLabel = name => {
    if (!name || typeof name !== "string") {
      return "";
    }
    
    const MAX_LENGTH = 22;
    
    if (name.length <= MAX_LENGTH) {
      return name;
    }
    
    // Show first 7 chars, ellipsis, then last 12 chars (including extension)
    const startChars = 7;
    const endChars = 12;
    
    const start = name.slice(0, startChars);
    const end = name.slice(-endChars);
    
    return `${start}...${end}`;
  };

  initializeScrollSync = () => {
    if (this.detachScrollSync) {
      return;
    }
    if (!this.htmlEditor || !this.jadeEditor) {
      return;
    }

    const getSession = editor =>
      editor.getSession ? editor.getSession() : editor.session;

    const htmlSession = getSession(this.htmlEditor);
    const jadeSession = getSession(this.jadeEditor);

    if (!htmlSession || !jadeSession) {
      return;
    }

    const getScrollMetrics = editor => {
      const session = getSession(editor);
      const renderer = editor.renderer || {};
      const layerConfig = renderer.layerConfig || {};
      const size = renderer.$size || {};
      const lineHeight = renderer.lineHeight || 16;

      const scrollTop =
        typeof session.getScrollTop === "function"
          ? session.getScrollTop()
          : 0;
      const scrollLeft =
        typeof session.getScrollLeft === "function"
          ? session.getScrollLeft()
          : 0;

      const estimatedMaxHeight =
        typeof layerConfig.maxHeight === "number"
          ? layerConfig.maxHeight
          : session.getLength() * lineHeight;
      const viewportHeight =
        typeof size.scrollerHeight === "number"
          ? size.scrollerHeight
          : editor.container
          ? editor.container.clientHeight
          : 0;
      const scrollableHeight = Math.max(
        estimatedMaxHeight - viewportHeight,
        0
      );

      let estimatedMaxWidth = 0;
      if (typeof layerConfig.maxWidth === "number") {
        estimatedMaxWidth = layerConfig.maxWidth;
      } else if (
        typeof layerConfig.maxLineLength === "number" &&
        typeof renderer.characterWidth === "number"
      ) {
        estimatedMaxWidth =
          layerConfig.maxLineLength * renderer.characterWidth;
      }

      const viewportWidth =
        typeof size.scrollerWidth === "number"
          ? size.scrollerWidth
          : editor.container
          ? editor.container.clientWidth
          : 0;
      const scrollableWidth = Math.max(estimatedMaxWidth - viewportWidth, 0);

      return {
        scrollTop,
        scrollLeft,
        scrollableHeight,
        scrollableWidth
      };
    };

    const clamp = (value, min, max) =>
      Math.min(Math.max(value, min), max);

    const syncScroll = (sourceEditor, targetEditor) => {
      const sourceSession = getSession(sourceEditor);
      const targetSession = getSession(targetEditor);
      if (!sourceSession || !targetSession) {
        return;
      }

      const sourceMetrics = getScrollMetrics(sourceEditor);
      const targetMetrics = getScrollMetrics(targetEditor);

      const verticalRatio =
        sourceMetrics.scrollableHeight > 0
          ? clamp(
              sourceMetrics.scrollTop / sourceMetrics.scrollableHeight,
              0,
              1
            )
          : 0;
      const targetScrollTop =
        targetMetrics.scrollableHeight > 0
          ? verticalRatio * targetMetrics.scrollableHeight
          : 0;
      targetSession.setScrollTop(targetScrollTop);

      const sourceHorizontalRatio =
        sourceMetrics.scrollableWidth > 0
          ? clamp(
              sourceMetrics.scrollLeft / sourceMetrics.scrollableWidth,
              0,
              1
            )
          : 0;
      const targetScrollLeft =
        targetMetrics.scrollableWidth > 0
          ? targetMetrics.scrollableWidth * sourceHorizontalRatio
          : sourceMetrics.scrollLeft;

      if (typeof targetSession.setScrollLeft === "function") {
        targetSession.setScrollLeft(targetScrollLeft);
      } else if (typeof targetEditor.scrollToX === "function") {
        targetEditor.scrollToX(targetScrollLeft);
      }
    };

    const syncFromHtml = () => {
      if (this.isSyncingEditorScroll) {
        return;
      }
      this.isSyncingEditorScroll = true;
      syncScroll(this.htmlEditor, this.jadeEditor);
      this.isSyncingEditorScroll = false;
    };

    const syncFromJade = () => {
      if (this.isSyncingEditorScroll) {
        return;
      }
      this.isSyncingEditorScroll = true;
      syncScroll(this.jadeEditor, this.htmlEditor);
      this.isSyncingEditorScroll = false;
    };

    htmlSession.on("changeScrollTop", syncFromHtml);
    htmlSession.on("changeScrollLeft", syncFromHtml);
    jadeSession.on("changeScrollTop", syncFromJade);
    jadeSession.on("changeScrollLeft", syncFromJade);

    this.detachScrollSync = () => {
      htmlSession.removeListener("changeScrollTop", syncFromHtml);
      htmlSession.removeListener("changeScrollLeft", syncFromHtml);
      jadeSession.removeListener("changeScrollTop", syncFromJade);
      jadeSession.removeListener("changeScrollLeft", syncFromJade);
      this.detachScrollSync = null;
    };

    syncFromHtml();
  };

  onHTMLChage = newCode => {
    this.setState(prevState => {
      const { activeFileId, openFiles } = prevState;
      if (activeFileId && openFiles.length > 0) {
        const updatedFiles = openFiles.map(file =>
          file.id === activeFileId
            ? { ...file, htmlContent: newCode }
            : file
        );
        return { HTMLCode: newCode, openFiles: updatedFiles };
      }
      return { HTMLCode: newCode };
    }, () => {
      this.persistHTMLCode(newCode);
      if (this.state.activeFileId && this.state.openFiles.length > 0) {
        this.persistOpenFiles();
      }
      this.updateJADE();
    });
  };

  onIndentTypeChange = event => {
    const useSoftTabs = event.target.value === "yes" ? true : false;
    this.setState({ useSoftTabs });
    setTimeout(() => {
      this.updateHTML();
      this.regenerateAllTabsPug();
    }, 100);
  };

  onJADEChange = newCode => {
    this.setState(prevState => {
      const { activeFileId, openFiles } = prevState;
      if (activeFileId && openFiles.length > 0) {
        const updatedFiles = openFiles.map(file =>
          file.id === activeFileId
            ? { ...file, jadeContent: newCode }
            : file
        );
        return { JADECode: newCode, openFiles: updatedFiles };
      }
      return { JADECode: newCode };
    }, () => {
      this.persistJadeCode(newCode);
      if (this.state.activeFileId && this.state.openFiles.length > 0) {
        this.persistOpenFiles();
      }
    });
    this.updateHTML();
  };

  onSvgIdToClassToggle = event => {
    const isEnabled = Boolean(event.target.checked);
    this.setState(
      { enableSvgIdToClass: isEnabled },
      () => {
        this.persistSvgIdToClassToggle(isEnabled);
        this.regenerateAllTabsPug();
      }
    );
  };

  regenerateAllTabsPug = () => {
    // Regenerate Pug for all open files with current settings
    this.setState(prevState => {
      const updatedFiles = prevState.openFiles.map(file => ({
        ...file,
        jadeContent: this.convertHtmlToJade(file.htmlContent)
      }));
      
      // Update current active tab display
      const activeFile = updatedFiles.find(f => f.id === prevState.activeFileId);
      const jadeCode = activeFile ? activeFile.jadeContent : prevState.JADECode;
      
      return {
        openFiles: updatedFiles,
        JADECode: jadeCode
      };
    }, () => {
      this.persistOpenFiles();
      this.persistJadeCode(this.state.JADECode);
    });
  };

  updateHTML = () => {
    try {
      const HTMLCode = this.pug.render(this.state.JADECode, { pretty: true });

      let sanitizeHTMLCode = HTMLCode.replace(/^\n/, "");
      sanitizeHTMLCode = beautify.html(sanitizeHTMLCode, {
        indent_size: this.state.tabSize,
        indent_with_tabs: !this.state.useSoftTabs
      });
      this.setState(prevState => {
        const { activeFileId, openFiles } = prevState;
        if (activeFileId && openFiles.length > 0) {
          const updatedFiles = openFiles.map(file =>
            file.id === activeFileId
              ? { ...file, htmlContent: sanitizeHTMLCode }
              : file
          );
          return { HTMLCode: sanitizeHTMLCode, openFiles: updatedFiles };
        }
        return { HTMLCode: sanitizeHTMLCode };
      }, () => {
        this.persistHTMLCode(sanitizeHTMLCode);
      });
    } catch (error) {}
  }

  onTabSizeChange = event => {
    this.setState({ tabSize: parseInt(event.target.value, 10) });
    setTimeout(() => {
      this.regenerateAllTabsPug();
      this.updateHTML();
      
    }, 100);
  };

  findHTMLOrBodyTag = html => html.search(/<\/html>|<\/body>/) > -1;

  convertHtmlToJade = (sourceHtml) => {
    const { isSvgoEnabled, svgoSettings, useSoftTabs, tabSize } = this.state;
    
    if (!sourceHtml || typeof sourceHtml !== "string" || !sourceHtml.trim()) {
      return "";
    }

    const optimizedHtml = isSvgoEnabled
      ? this.applySvgoOptimizations(sourceHtml, svgoSettings)
      : sourceHtml;

    const isBodyless = !this.findHTMLOrBodyTag(optimizedHtml);
    const options = {
      bodyless: isBodyless,
      donotencode: true
    };

    const html = optimizedHtml.replace(/template/g, "template_");
    
    let result = "";
    this.Html2Jade.convertHtml(html, options, (err, jade) => {
      if (err) {
        result = "";
        return;
      }
      let sanitizeJade = jade
        .replace(/\|\s+$/gm, "")
        .replace(/^(?:[\t ]*(?:\r?\n|\r))+/gm, "");
      if (isBodyless) {
        sanitizeJade = sanitizeJade.replace("head\n", "");
      }
      sanitizeJade = sanitizeJade.replace(/template_/g, "template");
      sanitizeJade = pugBeautify(sanitizeJade, {
        fill_tab: !useSoftTabs,
        tab_size: tabSize
      });
      sanitizeJade = this.applySvgIdToClassTransform(sanitizeJade);
      result = sanitizeJade;
    });
    
    return result;
  };

  applySvgIdToClassTransform = jade => {
    if (!this.state.enableSvgIdToClass || typeof jade !== "string") {
      return jade;
    }
    let transformed = jade;
    const tagReplacements = [
      { pattern: /\bg#/g, replacement: "g." },
      { pattern: /\bpath#/g, replacement: "path." },
      { pattern: /\brect#/g, replacement: "rect." },
      { pattern: /\bcircle#/g, replacement: "circle." }
    ];
    tagReplacements.forEach(({ pattern, replacement }) => {
      transformed = transformed.replace(pattern, replacement);
    });
    transformed = transformed.replace(/\b(x|y)=['"]-?0['"]\s*,\s*/g, "");
    transformed = transformed.replace(/,\s*\b(x|y)=['"]-?0['"]/g, "");
    transformed = transformed.replace(/\b(x|y)=['"]-?0['"]\s+/g, "");
    transformed = transformed.replace(/\b(x|y)=['"]-?0['"](?=\s*\))/g, "");
    transformed = transformed.replace(/,\s*(?=\))/g, "");
    transformed = transformed.replace(/\(\s*,/g, "(");
    transformed = transformed.replace(/[ \t]+\)/g, ")");
    transformed = transformed.replace(/\(\s*\)/g, "");
    return transformed;
  };

  updateJADE = () => {
    const { HTMLCode, isSvgoEnabled, svgoSettings } = this.state;
    const sourceHtml = typeof HTMLCode === "string" ? HTMLCode : "";
    if (!sourceHtml.trim()) {
      this.setState({ JADECode: "" }, () => {
        this.persistJadeCode("");
      });
      return;
    }

    const optimizedHtml = isSvgoEnabled
      ? this.applySvgoOptimizations(sourceHtml, svgoSettings)
      : sourceHtml;

    const isBodyless = !this.findHTMLOrBodyTag(optimizedHtml);
    const options = {
      bodyless: isBodyless,
      donotencode: true
    };

    const html = optimizedHtml.replace(/template/g, "template_");
    this.Html2Jade.convertHtml(html, options, (err, jade) => {
      if (err) {
        return;
      }
      let sanitizeJade = jade
        .replace(/\|\s+$/gm, "")
        .replace(/^(?:[\t ]*(?:\r?\n|\r))+/gm, "");
      if (isBodyless) {
        sanitizeJade = sanitizeJade.replace("head\n", "");
      }
      sanitizeJade = sanitizeJade.replace(/template_/g, "template");
      sanitizeJade = pugBeautify(sanitizeJade, {
        fill_tab: !this.state.useSoftTabs,
        tab_size: this.state.tabSize
      });
      sanitizeJade = this.applySvgIdToClassTransform(sanitizeJade);
      this.setState(prevState => {
        const { activeFileId, openFiles } = prevState;
        if (activeFileId && openFiles.length > 0) {
          const updatedFiles = openFiles.map(file =>
            file.id === activeFileId
              ? { ...file, jadeContent: sanitizeJade }
              : file
          );
          return { JADECode: sanitizeJade, openFiles: updatedFiles };
        }
        return { JADECode: sanitizeJade };
      }, () => {
        this.persistJadeCode(sanitizeJade);
        if (this.state.activeFileId && this.state.openFiles.length > 0) {
          this.persistOpenFiles();
        }
      });
    });
  };

  onControlsMouseDown = event => {
    if (event.button !== 0) {
      return;
    }
    if (
      event.target.closest &&
      event.target.closest("input, select, button, textarea, label")
    ) {
      return;
    }
    const controls = this.floatingControlsRef.current;
    const section = this.sectionRef.current;
    if (!controls || !section) {
      return;
    }
    const controlsRect = controls.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    this.dragOffset = {
      x: event.clientX - controlsRect.left,
      y: event.clientY - controlsRect.top
    };
    const metrics = {
      sectionRect,
      controlsRect,
      maxLeft: Math.max(0, sectionRect.width - controlsRect.width),
      maxTop: Math.max(0, sectionRect.height - controlsRect.height)
    };
    const defaultRatios = this.computeRatiosFromPixels(
      {
        left: controlsRect.left - sectionRect.left,
        top: controlsRect.top - sectionRect.top
      },
      metrics
    );
    this.setState(prevState => {
      const existingPosition = prevState.controlsPosition;
      return {
        isControlsDragging: true,
        controlsPosition:
          existingPosition !== null && existingPosition !== undefined
            ? existingPosition
            : defaultRatios || existingPosition
      };
    });
    event.preventDefault();
  };

  handleDocumentMouseMove = event => {
    if (!this.state.isControlsDragging) {
      return;
    }
    const controls = this.floatingControlsRef.current;
    const section = this.sectionRef.current;
    if (!controls || !section) {
      return;
    }
    const sectionRect = section.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    const maxLeft = Math.max(0, sectionRect.width - controlsRect.width);
    const maxTop = Math.max(0, sectionRect.height - controlsRect.height);
    let nextLeft = event.clientX - sectionRect.left - this.dragOffset.x;
    let nextTop = event.clientY - sectionRect.top - this.dragOffset.y;
    nextLeft = Math.min(Math.max(0, nextLeft), Math.max(0, maxLeft));
    nextTop = Math.min(Math.max(0, nextTop), Math.max(0, maxTop));
    const metrics = {
      sectionRect,
      controlsRect,
      maxLeft,
      maxTop
    };
    const ratios = this.computeRatiosFromPixels(
      { left: nextLeft, top: nextTop },
      metrics
    );
    if (ratios) {
      this.setState({
        controlsPosition: ratios
      });
    }
  };

  handleDocumentMouseUp = () => {
    if (this.state.isControlsDragging) {
      this.setState({ isControlsDragging: false }, () => {
        this.persistControlsPosition();
      });
    }
  };

  persistControlsPosition = () => {
    try {
      const { controlsPosition } = this.state;
      if (
        controlsPosition &&
        typeof controlsPosition.leftRatio === "number" &&
        typeof controlsPosition.topRatio === "number"
      ) {
        const payload = {
          leftRatio: clamp(controlsPosition.leftRatio, 0, 1),
          topRatio: clamp(controlsPosition.topRatio, 0, 1)
        };
        window.localStorage.setItem(
          CONTROLS_STORAGE_KEY,
          JSON.stringify(payload)
        );
      } else {
        window.localStorage.removeItem(CONTROLS_STORAGE_KEY);
      }
    } catch (error) {
      // Ignore persistence errors
    }
  };

  onSplitPointerDown = event => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }
    const container = this.splitRef.current;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const htmlWidth = (1 - this.state.pugWidthRatio) * rect.width;
    if (Math.abs(relativeX - htmlWidth) <= SPLIT_RESIZE_TOLERANCE) {
      this.cachedSplitRect = rect;
      this.onSplitResizeStart(event);
    }
  };

  onSplitHandlePointerDown = event => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }
    event.stopPropagation();
    const container = this.splitRef.current;
    if (!container) {
      return;
    }
    this.cachedSplitRect = container.getBoundingClientRect();
    this.onSplitResizeStart(event);
  };

  onSplitResizeStart = event => {
    event.preventDefault();
    if (!this.resizeListenersAttached) {
      document.addEventListener('pointermove', this.handleSplitResizeMove);
      document.addEventListener('pointerup', this.handleSplitResizeEnd);
      this.resizeListenersAttached = true;
    }
    this.currentSplitRect = this.cachedSplitRect || null;
    this.cachedSplitRect = null;
    this.setState({ isResizingSplit: true });
    this.handleSplitResizeMove(event);
  };

  handleSplitResizeMove = event => {
    const container = this.splitRef.current;
    if (!container) {
      return;
    }
    const rect = this.currentSplitRect
      ? this.currentSplitRect
      : container.getBoundingClientRect();
    if (!this.currentSplitRect) {
      this.currentSplitRect = rect;
    }
    const relativeX = event.clientX - rect.left;
    const constrainedX = Math.min(Math.max(relativeX, 0), rect.width);
    const pugRatio = (rect.width - constrainedX) / rect.width;
    const clampedRatio = Math.min(
      MAX_PUG_RATIO,
      Math.max(MIN_PUG_RATIO, pugRatio)
    );
    this.setState({ pugWidthRatio: clampedRatio });
  };

  handleSplitResizeEnd = () => {
    this.currentSplitRect = null;
    this.setState(
      { isResizingSplit: false },
      () => {
        this.persistPugWidth();
      }
    );
    this.removeResizeListeners();
  };

  removeResizeListeners = () => {
    if (this.resizeListenersAttached) {
      document.removeEventListener('pointermove', this.handleSplitResizeMove);
      document.removeEventListener('pointerup', this.handleSplitResizeEnd);
      this.resizeListenersAttached = false;
    }
  };

  persistPugWidth = () => {
    try {
      window.localStorage.setItem(
        PUG_WIDTH_STORAGE_KEY,
        String(this.state.pugWidthRatio)
      );
    } catch (error) {
      // Ignore persistence issues
    }
  };

  render() {
    const {
      tabSize,
      useSoftTabs,
      pugWidthRatio,
      isResizingSplit,
      enableSvgIdToClass,
      svgoSettings,
      isSvgoEnabled,
      isSvgoMenuOpen,
      isHelpMenuOpen
    } = this.state;

    const activeSvgoSettings = svgoSettings || getDefaultSvgoSettings();
    const precisionMin = PRECISION_LIMITS.min;
    const precisionMax = PRECISION_LIMITS.max;
    const options = {
      showLineNumbers: true,
      showGutter: true,
      displayIndentGuides: true,
      showInvisibles: true,
      printMargin: false,
      useSoftTabs,
      tabSize,
      scrollPastEnd: 0.5
    };

    const renderToggle = (label, name, checked, onChange, variant = "default") => {
      const classNames = ["svgo-toggle"];
      if (checked) {
        classNames.push("is-active");
      }
      if (variant === "compact") {
        classNames.push("svgo-toggle--compact");
      }

      return (
        <label key={name} className={classNames.join(" ")}>
          <input
            className="svgo-toggle__input"
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
          />
          <span className="svgo-toggle__track" aria-hidden="true">
            <span className="svgo-toggle__thumb" />
          </span>
          <span className="svgo-toggle__text">{label}</span>
        </label>
      );
    };

    const renderSlider = (label, name, value, onChange) => {
      const sliderId = `svgo-slider-${name}`;
      return (
        <div key={name} className="svgo-slider">
          <div className="svgo-slider__header">
            <label className="svgo-slider__label" htmlFor={sliderId}>
              {label}
            </label>
            <span className="svgo-slider__value">{value}</span>
          </div>
          <input
            id={sliderId}
            className="svgo-slider__input"
            type="range"
            name={name}
            min={precisionMin}
            max={precisionMax}
            step="1"
            value={value}
            onChange={onChange}
          />
        </div>
      );
    };

    const globalToggleItems = [
      { label: "Prettify markup", name: "pretty" },
      { label: "Multipass", name: "multipass" }
    ];

    const htmlWidthRatio = 1 - pugWidthRatio;
    const splitHandleStyle = {
      left: `${htmlWidthRatio * 100}%`
    };

    return (
      <React.Fragment>
        <section ref={this.sectionRef}>
          <div
            className="floating-controls"
            ref={this.floatingControlsRef}
          >
            <div className="controls-heading">
              <a href="https://github.com/vb-banners/html2pug" target="_blank" rel="noopener noreferrer" className="logo">HTML to PUG</a>
            </div>
            <div className="setting controls">
              <div className="open-file-control">
                <input
                  type="file"
                  accept=".svg,image/svg+xml,.html,.htm,text/html"
                  onChange={this.handleFileOpen}
                  className="open-file-input"
                  id="open-file-input"
                  onMouseDown={event => event.stopPropagation()}
                  multiple
                />
                <label htmlFor="open-file-input" className="open-file-button">
                  <span className="open-file-button__icon" aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                    >
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11z"/>
                    </svg>
                  </span>
                  <span className="open-file-button__text">Open</span>
                </label>
              </div>
              <label>
                <input
                  type="radio"
                  name="useSoftTabs"
                  value="yes"
                  checked={this.state.useSoftTabs}
                  onChange={this.onIndentTypeChange}
                />
                <span>Spaces</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="useSoftTabs"
                  value="no"
                  checked={!this.state.useSoftTabs}
                  onChange={this.onIndentTypeChange}
                />
                <span>Tabs</span>
              </label>
              <div className="tabsize-control">
                <select
                  name="tabSize"
                  value={tabSize}
                  onChange={this.onTabSizeChange}
                  aria-label="Tab size"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>
              <label className="id-to-class-control">
                <input
                  type="checkbox"
                  name="idToClass"
                  checked={enableSvgIdToClass}
                  onChange={this.onSvgIdToClassToggle}
                  aria-label="Toggle SVG id to class conversion"
                />
                <span>Id to Class</span>
              </label>
              <div className="svgo-controls-group" ref={this.svgoControlsRef}>
                <label className="svgo-toggle-control">
                  <input
                    type="checkbox"
                    name="svgoEnabled"
                    checked={isSvgoEnabled}
                    onChange={this.handleSvgoToggle}
                    aria-label="Toggle SVGO optimization"
                  />
                  <span>SVGO</span>
                </label>
                <div className={`svgo-controls${isSvgoMenuOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="svgo-settings-button"
                    onClick={this.toggleSvgoMenu}
                    aria-haspopup="dialog"
                    aria-expanded={isSvgoMenuOpen}
                  >
                  <span className="svgo-settings-button__icon" aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                    >
                      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                    </svg>
                  </span>
                  <span className="svgo-settings-button__text">SVGO Settings</span>
                  </button>
                  {isSvgoMenuOpen && (
                    <div
                      className="svgo-popup"
                      role="dialog"
                      aria-label="SVGO configuration"
                      onClick={event => event.stopPropagation()}
                    >
                      <div className="svgo-popup__content">
                        <section className="svgo-popup__group">
                          <div className="svgo-popup__group-heading">Global settings</div>
                          <div className="svgo-popup__toggles">
                            {globalToggleItems.map(item =>
                              renderToggle(
                                item.label,
                                item.name,
                                Boolean(activeSvgoSettings[item.name]),
                                this.handleSvgoGlobalCheckboxChange
                              )
                            )}
                          </div>
                          <div className="svgo-popup__sliders">
                            {renderSlider(
                              "Number precision",
                              "floatPrecision",
                              activeSvgoSettings.floatPrecision,
                              this.handleSvgoPrecisionChange
                            )}
                            {renderSlider(
                              "Transform precision",
                              "transformPrecision",
                              activeSvgoSettings.transformPrecision,
                              this.handleSvgoPrecisionChange
                            )}
                          </div>
                        </section>
                        <section className="svgo-popup__group">
                          <div className="svgo-popup__group-heading">Cleanup</div>
                          <div className="svgo-popup__features">
                            {SVGO_PLUGIN_OPTIONS.filter(opt => opt.category === 'cleanup').map(option =>
                              renderToggle(
                                option.name,
                                option.id,
                                Boolean(activeSvgoSettings.plugins[option.id]),
                                this.handleSvgoPluginToggle,
                                "compact"
                              )
                            )}
                          </div>
                        </section>
                        <section className="svgo-popup__group">
                          <div className="svgo-popup__group-heading">Styles & Attributes</div>
                          <div className="svgo-popup__features">
                            {SVGO_PLUGIN_OPTIONS.filter(opt => opt.category === 'style').map(option =>
                              renderToggle(
                                option.name,
                                option.id,
                                Boolean(activeSvgoSettings.plugins[option.id]),
                                this.handleSvgoPluginToggle,
                                "compact"
                              )
                            )}
                          </div>
                        </section>
                        <section className="svgo-popup__group">
                          <div className="svgo-popup__group-heading">Structure</div>
                          <div className="svgo-popup__features">
                            {SVGO_PLUGIN_OPTIONS.filter(opt => opt.category === 'structure').map(option =>
                              renderToggle(
                                option.name,
                                option.id,
                                Boolean(activeSvgoSettings.plugins[option.id]),
                                this.handleSvgoPluginToggle,
                                "compact"
                              )
                            )}
                          </div>
                        </section>
                        <section className="svgo-popup__group">
                          <div className="svgo-popup__group-heading">Paths & Shapes</div>
                          <div className="svgo-popup__features">
                            {SVGO_PLUGIN_OPTIONS.filter(opt => opt.category === 'paths').map(option =>
                              renderToggle(
                                option.name,
                                option.id,
                                Boolean(activeSvgoSettings.plugins[option.id]),
                                this.handleSvgoPluginToggle,
                                "compact"
                              )
                            )}
                          </div>
                        </section>
                        <section className="svgo-popup__group">
                          <div className="svgo-popup__group-heading">Numbers & Transforms</div>
                          <div className="svgo-popup__features">
                            {SVGO_PLUGIN_OPTIONS.filter(opt => opt.category === 'numbers').map(option =>
                              renderToggle(
                                option.name,
                                option.id,
                                Boolean(activeSvgoSettings.plugins[option.id]),
                                this.handleSvgoPluginToggle,
                                "compact"
                              )
                            )}
                          </div>
                        </section>
                        <section className="svgo-popup__group">
                          <div className="svgo-popup__group-heading">SVG Attributes</div>
                          <div className="svgo-popup__features">
                            {SVGO_PLUGIN_OPTIONS.filter(opt => opt.category === 'attributes').map(option =>
                              renderToggle(
                                option.name,
                                option.id,
                                Boolean(activeSvgoSettings.plugins[option.id]),
                                this.handleSvgoPluginToggle,
                                "compact"
                              )
                            )}
                          </div>
                        </section>
                          <div className="svgo-popup__actions">
                            <button
                              type="button"
                              className="svgo-popup__reset"
                              onClick={this.handleSvgoReset}
                            >
                              Reset All
                            </button>
                          </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>
              <div className={`help-controls${isHelpMenuOpen ? " is-open" : ""}`} ref={this.helpControlsRef}>
                <button
                  type="button"
                  className="help-button"
                  onClick={this.toggleHelpMenu}
                  aria-haspopup="dialog"
                  aria-expanded={isHelpMenuOpen}
                  aria-label="Help and keyboard shortcuts"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                  >
                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                  </svg>
                </button>
                {isHelpMenuOpen && (
                  <div
                    className="help-popup"
                    role="dialog"
                    aria-label="Help and keyboard shortcuts"
                    onClick={event => event.stopPropagation()}
                  >
                    <div className="help-popup__content">
                      <h2 className="help-popup__title">HTML to Pug Converter</h2>
                      <section className="help-popup__group">
                        <h3 className="help-popup__group-heading">Keyboard Shortcuts</h3>
                        <div className="help-popup__shortcuts">
                          <div className="help-shortcut">
                            <kbd>⌥</kbd><kbd>⌘</kbd><kbd>T</kbd>
                            <span>New tab</span>
                          </div>
                          <div className="help-shortcut">
                            <kbd>⌥</kbd><kbd>⌘</kbd><kbd>O</kbd>
                            <span>Open files</span>
                          </div>
                          <div className="help-shortcut">
                            <kbd>⌥</kbd><kbd>⌘</kbd><kbd>W</kbd>
                            <span>Close tab</span>
                          </div>
                          <div className="help-shortcut">
                            <kbd>⇧</kbd><kbd>⌥</kbd><kbd>⌘</kbd><kbd>W</kbd>
                            <span>Close all tabs</span>
                          </div>
                          <div className="help-shortcut">
                            <kbd>⌃</kbd><kbd>⌥</kbd><kbd>⌘</kbd><kbd>W</kbd>
                            <span>Close other tabs</span>
                          </div>
                          <div className="help-shortcut">
                            <kbd>⌘</kbd><kbd>⇧</kbd><kbd>K</kbd>
                            <span>Delete line</span>
                          </div>
                        </div>
                      </section>
                      <section className="help-popup__group">
                        <h3 className="help-popup__group-heading">Repository</h3>
                        <div className="help-popup__links">
                          <a href="https://github.com/vb-banners/html2pug" target="_blank" rel="noopener noreferrer">
                            github.com/vb-banners/html2pug
                          </a>
                        </div>
                      </section>
                      <section className="help-popup__group">
                        <h3 className="help-popup__group-heading">Based on</h3>
                        <div className="help-popup__links">
                          <a href="https://github.com/dvamvo/html2pug" target="_blank" rel="noopener noreferrer">
                            github.com/dvamvo/html2pug
                          </a>
                          <a href="https://github.com/jakearchibald/svgomg" target="_blank" rel="noopener noreferrer">
                            github.com/jakearchibald/svgomg
                          </a>
                          <a href="https://github.com/svg/svgo" target="_blank" rel="noopener noreferrer">
                            github.com/svg/svgo
                          </a>
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {this.state.openFiles.length > 0 && (
            <div className="tab-bar">
              {this.state.openFiles.map(file => (
                <div
                  key={file.id}
                  className={`tab${file.id === this.state.activeFileId ? " active" : ""}${this.state.draggedTabId === file.id ? " dragging" : ""}${this.state.dragOverTabId === file.id ? " drag-over" : ""}`}
                  onClick={() => this.handleTabSwitch(file.id)}
                  draggable="true"
                  onDragStart={(e) => this.handleTabDragStart(file.id, e)}
                  onDragOver={(e) => this.handleTabDragOver(file.id, e)}
                  onDragLeave={this.handleTabDragLeave}
                  onDrop={(e) => this.handleTabDrop(file.id, e)}
                  onDragEnd={this.handleTabDragEnd}
                >
                  <span className="tab__name" title={file.name}>
                    {this.formatTabLabel(file.name)}
                  </span>
                  <button
                    type="button"
                    className="tab__close"
                    onClick={event => this.handleTabClose(file.id, event)}
                    aria-label={`Close ${file.name}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="tab-bar__new-tab"
                onClick={this.handleNewTab}
                aria-label="New tab"
                title="New tab"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
          <div
            className={`editor-split${isResizingSplit ? " is-resizing" : ""}`}
            ref={this.splitRef}
            onPointerDown={this.onSplitPointerDown}
          >
            <div
              className="editor editor-html"
              style={{ flexBasis: `${htmlWidthRatio * 100}%` }}
            >
              <AceEditor
                mode="html"
                theme="ayu-mirage-custom"
                name="ace-html"
                onLoad={editor => {
                  this.htmlEditor = editor;
                  this.syncEditorSession(editor);
                  this.initializeScrollSync();
                  if (this.htmlColorPreviewDetach) {
                    this.htmlColorPreviewDetach();
                  }
                  this.htmlColorPreviewDetach = registerHexColorPreview(editor);
                }}
                fontSize={18}
                tabSize={tabSize}
                value={this.state.HTMLCode}
                onChange={this.onHTMLChage}
                setOptions={options}
                editorProps={{ $blockScrolling: true }}
              />
            </div>
            <div
              className="editor-split-handle"
              style={splitHandleStyle}
              onPointerDown={this.onSplitHandlePointerDown}
            />
            <div
              className="editor editor-jade"
              style={{ flexBasis: `${pugWidthRatio * 100}%` }}
            >
              <AceEditor
                mode="jade"
                theme="ayu-mirage-custom"
                name="ace-jade"
                onLoad={editor => {
                  this.jadeEditor = editor;
                  this.syncEditorSession(editor);
                  this.initializeScrollSync();
                  if (this.jadeColorPreviewDetach) {
                    this.jadeColorPreviewDetach();
                  }
                  this.jadeColorPreviewDetach = registerHexColorPreview(editor);
                }}
                fontSize={18}
                tabSize={tabSize}
                value={this.state.JADECode}
                onChange={this.onJADEChange}
                setOptions={options}
                editorProps={{ $blockScrolling: true }}
              />
            </div>
          </div>
        </section>
      </React.Fragment>
    );
  }
}

export default App;
