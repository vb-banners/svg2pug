# HTML to PUG Converter (Beta)

A real-time online converter that transforms HTML code into PUG (formerly Jade) template syntax. Built with React and TypeScript, featuring Monaco Editor with live bidirectional conversion, multi-file support, and advanced SVG optimization.

## 🌟 Features

### Core Functionality
- **Bidirectional Conversion**: Instantly convert HTML to PUG and vice versa with live editing in both editors
- **Multi-File Support**: Open and work with multiple files simultaneously using tabs
- **Monaco Editor**: Professional code editing experience with VS Code-like features and keyboard shortcuts
- **Quick Copy Feature**: Multi-select specific elements or lines with Shift+Click for precise copying
- **Drag & Drop**: Reorder tabs by dragging them to different positions
- **File Upload**: Upload multiple HTML/SVG files at once using the Upload button
- **Paste Files**: Copy SVG/HTML files from Finder and paste with <kbd>⌘</kbd><kbd>V</kbd> to create new tabs or replace blank tab content

### Customization
- **Flexible Indentation**:
  - Toggle between spaces and tabs
  - Adjustable tab size (1-6 spaces)
- **Resizable Interface**:
  - Draggable floating controls
  - Resizable split panes between editors
- **Persistent Preferences**: All settings and open files are saved in local storage

### Advanced Features
- **SVGO Integration**: 
  - Optional SVG optimization with customizable settings
  - Fine-grained control over 50+ optimization plugins
  - Adjustable precision for numbers and transforms
  - Multipass optimization for maximum compression
  - Hover hints explaining each plugin's function
- **SVG Id to Class Conversion**: Convert SVG `id` attributes to `class` attributes
- **PUG Size Variables**: Automatically convert width/height to variables when matching viewBox
- **Smart SVG Processing**:
  - Color attributes (fill, stroke) always appear first in output
  - Defs blocks automatically positioned at the beginning
  - Auto-removal of rect elements matching filename
- **Smart Formatting**: Automatic beautification of both HTML and PUG code
- **Bodyless Mode**: Automatically detects and handles HTML snippets without `<html>` or `<body>` tags

## 🚀 Demo

Visit the live demo at: [https://vb-banners.github.io/html2pug/](https://vb-banners.github.io/html2pug/)

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/vb-banners/html2pug.git

# Navigate to the project directory
cd html2pug

# Install dependencies
npm install
```

## 🛠️ Development

```bash
# Start the development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Build

```bash
# Create a production build
npm run build
```

This will create an optimized build in the `docs/` folder (configured for GitHub Pages deployment).

## 📝 Usage

### Basic Operations
1. **HTML to PUG**: Type or paste HTML code in the left editor panel - PUG updates instantly
2. **PUG to HTML**: Edit PUG code in the right editor panel - HTML updates in real-time
3. **Upload Files**: Click the "Upload" button in the tab bar to select and open multiple HTML/SVG files
4. **Paste Files**: Copy HTML/SVG files from Finder (<kbd>⌘</kbd><kbd>C</kbd>) and paste (<kbd>⌘</kbd><kbd>V</kbd>) directly into the app
   - When no tabs are open: Creates new tabs for each pasted file
   - When pasting into a blank tab: Replaces the tab content and renames it
5. **Quick Copy**: Use <kbd>⌘</kbd><kbd>⇧</kbd><kbd>C</kbd> to toggle Quick Copy mode, then Shift+Click to select multiple lines or elements
6. **Create New Tab**: Click the "+" button in the tab bar
7. **Switch Tabs**: Click on any tab to switch between open files
8. **Reorder Tabs**: Drag and drop tabs to rearrange them
9. **Close Tabs**: Click the "×" button on a tab

### Settings
Use the floating controls to customize your experience:
- **Spaces/Tabs**: Toggle between spaces and tabs for indentation
- **Tab Size**: Choose indentation size (1-6 spaces)
- **Id to Class**: Convert SVG `id` attributes to `class` attributes
- **SVGO**: Enable/disable SVG optimization with detailed plugin configuration
- **Resize Panes**: Drag the divider between editors to adjust the view
- **Move Controls**: Drag the floating controls panel to your preferred position

### SVGO Settings
Click the "SVGO Settings" button to access advanced SVG optimization options:
- **Global Settings**: 
  - **Multipass**: Run optimization up to 10 times for maximum compression
  - **PUG Size Vars**: Convert width/height to variables when matching viewBox
  - **Number Precision**: Control decimal precision (0-8)
  - **Transform Precision**: Control transform precision (0-8)
- **Cleanup**: Remove doctype, comments, metadata, editor data, hidden elements, etc.
- **Styles & Attributes**: Clean up attributes, merge/inline styles, minify CSS
- **Structure**: Optimize element grouping and hierarchy
- **Paths & Shapes**: Convert shapes to paths, merge paths, optimize path data
- **Numbers & Transforms**: Round coordinates and optimize transform matrices
- **SVG Attributes**: Manage viewBox, xmlns, dimensions, and defaults

All toggles feature helpful hover hints explaining their function.

## 🔧 Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Monaco Editor** - VS Code's code editor with advanced features
- **Zustand** - State management with localStorage persistence
- **Pug** - Template engine for PUG to HTML conversion
- **html-to-jade** - HTML to PUG conversion library
- **SVGO** - SVG optimization library
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality React components
- **he** - HTML entity encoder/decoder

## 📂 Project Structure

```
html2pug/
├── public/           # Static assets and HTML template
│   ├── html-to-jade.js  # HTML to PUG conversion
│   ├── pug.js           # PUG to HTML conversion
│   └── he.js            # HTML entity encoding
├── src/              # TypeScript/React source code
│   ├── App.tsx       # Main application component
│   ├── Components/   # React components
│   │   ├── EditorPane.tsx        # Monaco editor wrapper
│   │   ├── TabBar.tsx            # File tabs with upload
│   │   ├── FloatingControls.tsx  # Settings toolbar
│   │   ├── HelpDialog.tsx        # Help dialog
│   │   └── SvgoSettingsDialog.tsx # SVGO settings
│   ├── hooks/        # Custom React hooks
│   │   ├── useConversion.ts      # Conversion logic
│   │   ├── useFileTabs.ts        # Tab management
│   │   ├── useKeyboardShortcuts.ts # Keyboard handling
│   │   └── useSplitPane.ts       # Resizable panes
│   ├── store/        # Zustand state management
│   │   └── useAppStore.ts
│   ├── types/        # TypeScript definitions
│   ├── themes/       # Monaco editor themes
│   └── vendor/       # Third-party libraries
│       └── svgo-browser.esm.js
├── docs/             # Production build (GitHub Pages)
└── scripts/          # Build scripts
    ├── build-svgo.js
    └── build-to-docs.js
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

This project is based on and inspired by:
- [dvamvo/html2pug](https://github.com/dvamvo/html2pug) - HTML to PUG converter
- [jakearchibald/svgomg](https://github.com/jakearchibald/svgomg) - SVGO's Missing GUI
- [svg/svgo](https://github.com/svg/svgo) - SVG Optimizer

Special thanks to the original authors and contributors of these projects.

## 📧 Contact

For issues and questions, please use the [GitHub Issues](https://github.com/vb-banners/html2pug/issues) page.
