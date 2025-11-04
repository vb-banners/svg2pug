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
  isSyncingEditorScroll = false;
  detachScrollSync = null;

  state = {
    HTMLCode,
    JADECode,
    tabSize: 4,
    useSoftTabs: true,
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

  componentDidMount() {
    document.addEventListener("mousemove", this.handleDocumentMouseMove);
    document.addEventListener("mouseup", this.handleDocumentMouseUp);
    try {
      const savedControls = window.localStorage.getItem(
        CONTROLS_STORAGE_KEY
      );
      if (savedControls) {
        const parsed = JSON.parse(savedControls);
        if (
          parsed &&
          typeof parsed.top === "number" &&
          typeof parsed.left === "number"
        ) {
          this.setState({ controlsPosition: parsed });
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
      const restoredState = {};
      if (typeof savedHtmlCode === "string") {
        restoredState.HTMLCode = savedHtmlCode;
      }
      if (typeof savedJadeCode === "string") {
        restoredState.JADECode = savedJadeCode;
      }
      if (Object.keys(restoredState).length > 0) {
        this.setState(restoredState);
      }
    } catch (error) {
      // Storage might be unavailable; ignore and fall back to defaults.
    }
  }

  componentWillUnmount() {
    document.removeEventListener("mousemove", this.handleDocumentMouseMove);
    document.removeEventListener("mouseup", this.handleDocumentMouseUp);
    this.removeResizeListeners();
    if (this.detachScrollSync) {
      this.detachScrollSync();
      this.detachScrollSync = null;
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
    this.setState(prevState => {
      const existingPosition = prevState.controlsPosition;
      return {
        isControlsDragging: true,
        controlsPosition:
          existingPosition !== null && existingPosition !== undefined
            ? existingPosition
            : {
                left: controlsRect.left - sectionRect.left,
                top: controlsRect.top - sectionRect.top
              }
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
    const maxLeft = sectionRect.width - controlsRect.width;
    const maxTop = sectionRect.height - controlsRect.height;
    let nextLeft = event.clientX - sectionRect.left - this.dragOffset.x;
    let nextTop = event.clientY - sectionRect.top - this.dragOffset.y;
    nextLeft = Math.min(Math.max(0, nextLeft), Math.max(0, maxLeft));
    nextTop = Math.min(Math.max(0, nextTop), Math.max(0, maxTop));
    this.setState({
      controlsPosition: {
        left: nextLeft,
        top: nextTop
      }
    });
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
      if (controlsPosition) {
        window.localStorage.setItem(
          CONTROLS_STORAGE_KEY,
          JSON.stringify(controlsPosition)
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
    const { tabSize, useSoftTabs, controlsPosition, pugWidthRatio, isControlsDragging, isResizingSplit } = this.state;
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

    const controlsStyle = controlsPosition
      ? {
          top: `${controlsPosition.top}px`,
          left: `${controlsPosition.left}px`,
          right: "auto",
          bottom: "auto",
          transform: "none"
        }
      : undefined;

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
            }${controlsPosition ? " has-custom-position" : ""}`}
            ref={this.floatingControlsRef}
            style={controlsStyle}
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
