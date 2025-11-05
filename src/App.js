import React, { Component } from "react";
import beautify from "js-beautify";
import pugBeautify from "pug-beautify";
import AceEditor from "react-ace";
import "brace/mode/html";
import "brace/mode/xml";
import "brace/mode/jade";
import "./themes/ayu-mirage-custom";
import { HTMLCode, JADECode } from "./template";
import "./App.css";
import "./fonts.css";

const CONTROLS_STORAGE_KEY = "html2pug:floatingControls";
const PUG_WIDTH_STORAGE_KEY = "html2pug:pugPaneWidth";
const MIN_PUG_RATIO = 0.1;
const MAX_PUG_RATIO = 0.9;
const SPLIT_RESIZE_TOLERANCE = 14;
const HTML_CODE_STORAGE_KEY = "html2pug:htmlCode";
const JADE_CODE_STORAGE_KEY = "html2pug:jadeCode";
const ID_TO_CLASS_STORAGE_KEY = "html2pug:idToClassToggle";

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
    isResizingSplit: false
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
    document.addEventListener("focusin", this.handleDocumentFocusIn, true);
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("resize", this.handleWindowResize);
    }
    try {
      const savedControls = window.localStorage.getItem(
        CONTROLS_STORAGE_KEY
      );
      if (savedControls) {
        const parsed = JSON.parse(savedControls);
        if (!this.restoreControlsPosition(parsed) && typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(() => {
            this.restoreControlsPosition(parsed);
          });
        }
      }
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
    document.removeEventListener("focusin", this.handleDocumentFocusIn, true);
    if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
      window.removeEventListener("resize", this.handleWindowResize);
    }
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

  ensureControlReference = element => {
    if (!element || typeof element !== "object") {
      return;
    }

    const target = element;
    if (target.dataset && target.dataset.html2pugControlPatched === "true") {
      return;
    }

    try {
      const descriptor = Object.getOwnPropertyDescriptor(target, "control");
      if (!descriptor || descriptor.configurable) {
        if (typeof target.control === "undefined") {
          Object.defineProperty(target, "control", {
            configurable: true,
            enumerable: false,
            get() {
              return target;
            }
          });
        } else if (!target.control) {
          target.control = target;
        }
      } else if (typeof target.control === "undefined") {
        target.control = target;
      }
    } catch (error) {
      try {
        target.control = target;
      } catch (assignError) {
        // ignore inability to assign custom control reference
      }
    }

    if (target.dataset) {
      target.dataset.html2pugControlPatched = "true";
    }
  };

  configureEditorTextInput = editor => {
    if (!editor || !editor.textInput || typeof editor.textInput.getElement !== "function") {
      return;
    }
    const inputEl = editor.textInput.getElement();
    if (!inputEl) {
      return;
    }

    inputEl.setAttribute("autocomplete", "off");
    inputEl.setAttribute("autocorrect", "off");
    inputEl.setAttribute("autocapitalize", "off");
    inputEl.setAttribute("spellcheck", "false");

    this.ensureControlReference(inputEl);
  };

  isAceTextInput = element => {
    if (!element || typeof element !== "object") {
      return false;
    }
    const { classList, tagName } = element;
    if (tagName && tagName.toLowerCase() === "textarea" && classList && classList.contains("ace_text-input")) {
      return true;
    }
    if (classList && classList.contains("ace_text-input")) {
      return true;
    }
    if (element.getAttribute) {
      const role = element.getAttribute("role");
      if (role === "textbox" && classList && classList.contains("ace_text-input")) {
        return true;
      }
    }
    return false;
  };

  handleDocumentFocusIn = event => {
    if (!event || !event.target) {
      return;
    }
    this.ensureControlReference(event.target);
    if (this.isAceTextInput(event.target) && typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
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
    this.setState({ HTMLCode: newCode }, () => {
      this.persistHTMLCode(newCode);
    });
    this.updateJADE();
  };

  onIndentTypeChange = event => {
    const useSoftTabs = event.target.value === "yes" ? true : false;
    this.setState({ useSoftTabs });
    setTimeout(() => {
      this.updateHTML();
      this.updateJADE();
    }, 100);
  };

  onJADEChange = newCode => {
    this.setState({ JADECode: newCode }, () => {
      this.persistJadeCode(newCode);
    });
    this.updateHTML();
  };

  onSvgIdToClassToggle = event => {
    const isEnabled = Boolean(event.target.checked);
    this.setState(
      { enableSvgIdToClass: isEnabled },
      () => {
        this.persistSvgIdToClassToggle(isEnabled);
        this.updateJADE();
      }
    );
  };

  updateHTML = () => {
    try {
      const HTMLCode = this.pug.render(this.state.JADECode, { pretty: true });

      let sanitizeHTMLCode = HTMLCode.replace(/^\n/, "");
      sanitizeHTMLCode = beautify.html(sanitizeHTMLCode, {
        indent_size: this.state.tabSize,
        indent_with_tabs: !this.state.useSoftTabs
      });
      this.setState({ HTMLCode: sanitizeHTMLCode }, () => {
        this.persistHTMLCode(sanitizeHTMLCode);
      });
    } catch (error) {}
  }

  onTabSizeChange = event => {
    this.setState({ tabSize: parseInt(event.target.value, 10) });
    setTimeout(() => {
      this.updateJADE();
      this.updateHTML();
      
    }, 100);
  };

  findHTMLOrBodyTag = html => html.search(/<\/html>|<\/body>/) > -1;

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
    const { HTMLCode } = this.state;
    const isBodyless = !this.findHTMLOrBodyTag(HTMLCode);
    const options = {
      bodyless: isBodyless,
      donotencode: true
    };

    if (HTMLCode === "") {
      this.setState({ JADECode: "" }, () => {
        this.persistJadeCode("");
      });
      return;
    }

    const html = HTMLCode.replace(/template/g, "template_");
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
      this.setState({ JADECode: sanitizeJade }, () => {
        this.persistJadeCode(sanitizeJade);
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
    const { tabSize, useSoftTabs, controlsPosition, pugWidthRatio, isControlsDragging, isResizingSplit, enableSvgIdToClass } = this.state;
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

    const computedControlsStyle = controlsPosition
      ? this.computeControlsStyle(controlsPosition)
      : undefined;
    const hasCustomControlsPosition = Boolean(
      controlsPosition && computedControlsStyle
    );

    const htmlWidthRatio = 1 - pugWidthRatio;
    const splitHandleStyle = {
      left: `${htmlWidthRatio * 100}%`
    };

    return (
      <React.Fragment>
        <section ref={this.sectionRef}>
          <div
            className={`floating-controls${
              isControlsDragging ? " is-dragging" : ""
            }${hasCustomControlsPosition ? " has-custom-position" : ""}`}
            ref={this.floatingControlsRef}
            style={computedControlsStyle}
            onMouseDown={this.onControlsMouseDown}
          >
            <div className="controls-heading">
              <span className="logo">HTML to PUG</span>
              <a
                className="fork-link"
                href="https://github.com/dvamvo/html2pug"
                target="_blank"
                rel="noopener noreferrer"
                onMouseDown={event => event.stopPropagation()}
              >
                Fork of dvamvo/html2pug
              </a>
            </div>
            <div className="setting controls">
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
            </div>
          </div>
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
                  this.configureEditorTextInput(editor);
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
                  this.configureEditorTextInput(editor);
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
