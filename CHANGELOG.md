# Changelog

All notable changes to the SVG to PUG Converter project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.4.0] - 2025-11-19

### Added
- **Live Preview Pane**: New split-pane view showing real-time visual rendering of the SVG/HTML content
  - Toggle visibility via the "Preview" switch in the toolbar
  - Updates instantly as you type in either editor
  - Supports both SVG and HTML rendering
  - Displays current dimensions of the rendered content
- **In-Editor Color Highlighting**: Hex color codes in the editor are automatically colored to match their value
  - Scans editor content for hex color patterns (e.g., `#FF0000`, `#333`)
  - Applies the actual color to the text of the hex code
  - Makes it easier to identify colors directly within the code
- **Rebranding**: Renamed project from "HTML to PUG" to "SVG to PUG" (SVG2PUG)
  - Updated application title, headers, and dialogs
  - Updated manifest and package metadata
  - Replaced favicon with official Pug logo

## [0.3.0-beta] - 2025-11-17

### Added
- **Common Classes Feature**: New toggle to extract common class prefixes and add them as parent classes
  - Detects patterns like `.rating-popup1`, `.rating-popup2` → `.rating-popup.rating-popup1`, `.rating-popup.rating-popup2`
  - Supports both dash-number (`.class-1`) and direct-number (`.class1`) patterns
  - Position: After "Id to Class" toggle in settings
  - Automatically applies to classes with 2+ instances sharing the same base prefix
- **Auto-Copy on Selection**: When Quick Copy is disabled, selecting text and releasing the mouse automatically copies to clipboard
  - Shows status message with line and character count
  - Provides convenient copy without manual Cmd+C
  - Only active when Quick Copy toggle is off
- **Tab Context Menu**: Right-click context menu for tab operations
  - New Tab: Create a new blank tab
  - Duplicate: Clone the current tab
  - Close: Close the current tab
  - Close Others: Close all tabs except current
  - Close All: Close all open tabs
  - Styled to match dropdown/select components with icons
  - Uses Radix UI Context Menu (@radix-ui/react-context-menu v2.2.16)
- **Enhanced Multi-Selection in Quick Copy**: Improved selection persistence during multi-select
  - Previous selections remain visible while hovering over new blocks
  - Selections no longer disappear when moving between blocks with Shift held
  - Visual feedback maintains all selections until clicking without Shift

### Changed
- **Quick Copy Position**: Moved to leftmost position in feature toggles (before Id to Class and Common Classes)
- **Editor Theme Colors**:
  - Yellow accent changed from `#FFC94F` to `#FFCF61` for better contrast
  - Blue syntax highlighting changed from `#5CCFE6` and `#73D0FF` to `#00D3E9` for consistency
  - Code line highlight changed from `#232834` to `#191F2A` for subtler appearance
- **Tab Bar Enhancements**:
  - Upload button fixed outside scrollable area with full-height separator
  - Plus button repositioned to follow last tab inside scrollable area
  - Tab separators updated to match Upload button separator style
  - Scroll position persisted in localStorage with active tab always visible on refresh
  - Hidden scrollbar for cleaner appearance
- **Plus Button Behavior**: Now sticky to the right side of the last tab for intuitive tab creation

### Fixed
- **Quick Copy Selection Lock**: Selection now persists after clicking during Quick Copy mode
  - Added selection locking mechanism with 1-second duration
  - Prevents hover handler from clearing selection immediately after click
  - Uses `onDidChangeCursorSelection` listener to actively maintain locked selection
- **Multi-Selection Visual Persistence**: Fixed disappearing selections during multi-select
  - Selections remain visible throughout the selection process
  - Only cleared when clicking without Shift key held
  - Improved `areSelectionsEqual` helper for accurate selection comparison

### Technical Improvements
- **State Management**: Added `enableCommonClasses` and `tabBarScrollPosition` to Zustand store with localStorage persistence
- **Conversion Logic**: Implemented `applyCommonClassesTransform` function in `useConversion.ts`
  - Uses Map-based collection of class patterns
  - Applies transformation only when 2+ classes share base prefix
  - Preserves existing class structure with regex-based replacement
- **Custom Hooks**: 
  - Created `useAutoCopyOnSelect.ts` for auto-copy functionality
  - Enhanced `useQuickCopy.ts` with multi-selection locking and persistence logic
- **Context Menu Integration**: 
  - Created `src/Components/ui/context-menu.tsx` with full Radix UI component set
  - Added `duplicateFile`, `closeOtherFiles`, `closeAllFiles` actions to store
  - Integrated context menu in TabBar with proper event handling
- **Editor Updates**: Modified `MonacoEditor.tsx` to use `pushEditOperations` instead of `setValue` (preserves undo/redo history)

## [0.2.0-beta] - 2025-11-17

### UI/UX Redesign - Complete Color Scheme Overhaul

#### Visual Design Changes
- **Color Palette Refresh**: Complete redesign with modern, cohesive color scheme
  - Main UI background: `#1E2431` (dark blue-gray)
  - Editor background: `#232937` (slightly lighter blue-gray for contrast)
  - Borders and separators: `#2F3A4B` (subtle borders at 1px thickness)
  - Primary accent color: `#FFC94F` (warm yellow for highlights and active states)
  - UI labels: `#C5C5C5` (light gray for primary text)
  - Muted labels: `#6E7A8F` (medium gray for secondary text)

#### Component Enhancements
- **Button Hover States**: All buttons now feature smooth hover transitions
  - Outline and ghost buttons show `primary/10` background on hover
  - Hover states preserved after fixing inline style conflicts
- **Dropdown/Select Components**: Enhanced with proper hover states matching button behavior
- **Toggle Switches**: Updated background colors to match UI theme (`#1E2431`)
- **Editor Resize Handle**: 
  - Reduced width to exactly 1px for cleaner appearance
  - Added accent color (`#FFC94F`) on hover for better visibility
  - Fixed width using inline styles with `minWidth` and `maxWidth` constraints
- **Slider Controls**: 
  - Redesigned thumb handles as perfect circles with explicit `borderRadius: 50%`
  - Left side of filled range now has rounded cap (`rounded-l-full`)
  - Thumb background: `#1E2431` with `#FFC94F` border
  - Removed all focus rings and shadows for clean appearance
- **Status Bar**: Added 1px top border (`#2F3A4B`) to separate from editor area

#### Accessibility Improvements
- **Comprehensive Tooltips**: Added descriptive tooltips to all interactive controls
  - Top bar controls: "Use spaces for indentation", "Use tabs for indentation", "Number of spaces or tab width"
  - Feature toggles: "Convert SVG id attributes to class attributes", "Automatically copy converted Pug code to clipboard", "Enable SVG optimization using SVGO"
  - Action buttons: "Configure SVGO optimization plugins and settings", "View keyboard shortcuts and features"
  - SVGO Settings: All 50+ plugin toggles now have detailed explanations
    - Example: "Remove unnecessary whitespace and newlines from attributes"
    - Example: "Convert color values to shorter formats"
    - Example: "Find and reuse duplicate paths"
  - Precision sliders: "Number of decimal places for floating point values" and "Number of decimal places for transformation matrices"

#### Layout & Spacing Refinements
- **SVGO Settings Dialog**:
  - Increased toggle label spacing to 15px from switch for better readability
  - Added 6px top margin to all toggle labels for proper vertical alignment
  - Improved visual hierarchy with consistent spacing throughout
- **Tab Bar**: Connected seamlessly with editor via coordinated border styles
  - Tab bar has 1px bottom border
  - Editor has no top border
  - Creates single unified separator line
- **Border Consistency**: All UI borders standardized to 1px thickness

#### Monaco Editor Theme Updates
- **Syntax Highlighting**: Updated all keyword/attribute/class/ID tokens to use `#FFC94F` accent color
- **Editor Gutter**: Background color matches UI (`#1E2431`) with `#2F3A4B` right border
- **Cursor**: Changed to accent color (`#FFC94F`) for better visibility
- **Widgets**: All suggestion widgets and hover widgets use UI background color (`#1E2431`)

### Technical Implementation
- **Inline Styles Strategy**: Used inline styles with explicit hex values throughout to ensure immediate visibility and override Tailwind CSS variables
- **CSS Specificity Management**: Carefully balanced inline styles with Tailwind classes to preserve hover states
- **Component-Level Styling**: Updated all UI components (`Button`, `Switch`, `Select`, `Slider`, `Dialog`) with theme-consistent colors

### Fixed
- **Button Hover States**: Resolved issue where inline `backgroundColor` styles were preventing Tailwind hover classes from working
- **Slider Appearance**: Fixed square slider thumbs by using explicit inline border-radius and removing conflicting class styles
- **Resize Handle Width**: Ensured 1px width using `minWidth` and `maxWidth` inline styles to prevent flexbox expansion

## [0.1.0-beta] - 2025-11-17

### Major Changes - Beta Release
- **Complete TypeScript Rewrite**: Migrated entire codebase from JavaScript to TypeScript for type safety
- **Monaco Editor Integration**: Replaced Ace Editor with Monaco Editor (VS Code's editor)
  - Full VS Code keyboard shortcuts support
  - Native command palette and editor features
  - Multi-cursor editing and advanced text manipulation
- **Bidirectional Editing**: Edit either HTML or PUG and see changes in both editors in real-time
- **Zustand State Management**: Replaced Redux with Zustand for simpler, more efficient state management
- **Modern UI with Tailwind + shadcn/ui**: Complete UI redesign with Tailwind CSS and shadcn/ui components

### Added
- **Quick Copy Feature**: New multi-selection mode for copying specific lines or elements
  - Toggle with <kbd>⌘</kbd><kbd>⇧</kbd><kbd>C</kbd> keyboard shortcut
  - Shift+Click to select/deselect individual lines or elements
  - Copy only selected content to clipboard
  - Visual feedback with yellow highlights for selected items
- **File Upload Button**: New Upload button in tab bar for easy file importing
  - Upload multiple HTML/SVG files at once
  - Positioned at the leftmost side of the tab bar
  - Replaced previous file-paste-only workflow
- **Paste File Functionality**: Copy SVG/HTML files from Finder and paste directly into the app
  - When no tabs are open: Creates new tabs for pasted files
  - When pasting into blank tab: Replaces content and renames tab
  - Uses capture phase event handling to intercept before Monaco editor
- **Beta Badge**: Added "Beta" label next to logo in toolbar to indicate development status
- **Improved Keyboard Shortcuts**: Full Monaco Editor shortcuts now work (Command+A, Command+K, etc.)
- **Color Attributes Ordering**: Color-related attributes (fill, stroke, color, stop-color, flood-color, lighting-color) now always appear first in PUG output for better consistency and readability
- **Auto-Remove Matching Rects**: Automatically removes `<rect>` elements whose id or class attributes match the filename (without extension), cleaning up common SVG artifacts
- **Defs Block Positioning**: SVG `<defs>` elements are now automatically positioned first among SVG children, following SVG best practices
- **PUG Size Variables Toggle**: New toggle in SVGO Settings to convert width and height attributes to PUG variables when they match viewBox dimensions
  - Example: `width='300' height='250'` becomes `width=width height=height` with `-var width = 300` and `-var height = 250` at the top
- **Comprehensive Hover Hints**: All 50+ SVGO plugin toggles and global settings now feature descriptive tooltips explaining their function
  - Multipass: "Runs optimization up to 10 times until no further improvements are made (vs single pass)"
  - PUG Size Vars: "Converts width and height attributes to PUG variables when they match viewBox dimensions"
  - Each plugin toggle includes detailed explanation of its optimization behavior

### Changed
- **Editor Behavior**: PUG editor is now fully editable (removed read-only restriction)
- **Toolbar Layout**: Improved spacing with flexible spacers for better visual balance
- **Help Dialog**: Updated branding from "HTML to Pug Converter" to "HTML to PUG"
- **Upload Workflow**: Moved Upload button from FloatingControls to TabBar for better discoverability
- **SVGO Configuration**: Enhanced `svgo-config.js` with description property for all plugin options
- **Toggle Rendering**: Updated `renderToggle` function to support title parameter for native HTML tooltips
- **Global Settings Structure**: Refactored global toggle items to include description metadata

### Removed
- **Prettify Markup Toggle**: Removed non-functional "Prettify markup" toggle that had no effect on final output
  - The prettify option was rendered obsolete since output is immediately converted to PUG format
  - Cleaned up from UI, config defaults, and build configuration

### Fixed
- **Multipass Verification**: Confirmed Multipass toggle is working correctly (runs up to 10 optimization passes vs 1)

### Technical Improvements
- **Component Architecture**: 
  - Created modular component structure with `EditorPane.tsx`, `TabBar.tsx`, `FloatingControls.tsx`
  - Implemented custom hooks: `useConversion.ts`, `useFileTabs.ts`, `useKeyboardShortcuts.ts`, `useSplitPane.ts`, `useFloatingControls.ts`, `usePasteHandler.ts`
  - Centralized state management in `useAppStore.ts` with Zustand
- **Keyboard Event Handling**: 
  - Selective event interception - only captures Command+Shift+C for Quick Copy
  - All other shortcuts pass through to Monaco editor unchanged
  - Proper editor detection using `textarea.inputarea` class check
- **Conversion Logic**:
  - HTML to PUG: Uses `window.Html2Jade.convertHtml()` from html-to-jade.js library
  - PUG to HTML: Uses `window.pug.render()` for reverse conversion
  - Real-time bidirectional sync between both editors
- **localStorage Integration**: Persistent storage for all settings, open files, and user preferences
- **Paste Handler**: Custom `usePasteHandler` hook with clipboard file detection
  - Reads SVG/HTML files from clipboard using FileReader API
  - Detects blank tab scenario vs. empty workspace scenario
  - Added `updateFileName` method to store for dynamic tab renaming
  - Uses event capture phase with `stopPropagation` to prevent Monaco interference
- **HTML-to-Jade Library**: Modified `Writer.prototype.tagAttr` to implement color-first attribute ordering
- **HTML-to-Jade Library**: Enhanced `Converter.prototype.children` to sort elements with defs-first logic
- **App Component**: Added `convertHtmlToJade` method with fileName parameter support
- **App Component**: Implemented `removeMatchingRects` method using DOMParser for targeted element removal
- **App Component**: Created `applyPugSizeVarsTransform` method for intelligent size variable conversion
- **Storage Management**: Added `PUG_SIZE_VARS_STORAGE_KEY` constant for persistent user preferences
- **State Management**: Integrated `enablePugSizeVars` state property with proper persistence and handlers

## [Pre-Beta] - Before TypeScript Migration

### Legacy Features (Original JavaScript Version)
- Multi-file tab support with drag-and-drop reordering
- Real-time HTML to PUG conversion with Ace Editor
- Split-pane editor interface with resizable panels
- SVGO integration with 50+ configurable optimization plugins
- SVG Id to Class conversion
- Local storage persistence for settings and open files
- Paste files directly from Finder
- Adjustable indentation (spaces/tabs, 1-6 size)
- Draggable floating controls panel
- Dark theme with Ayu Mirage color scheme

### Migration Notes
- Complete rewrite from JavaScript to TypeScript
- Replaced Ace Editor with Monaco Editor
- Replaced custom state management with Zustand
- Added bidirectional editing (PUG ↔ HTML)
- Modernized UI with Tailwind CSS and shadcn/ui
- Improved file handling and keyboard shortcuts

---

For more information, visit the [GitHub repository](https://github.com/vb-banners/html2pug).
