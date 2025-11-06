# HTML to PUG Converter

A real-time online converter that transforms HTML code into PUG (formerly Jade) template syntax. Built with React and featuring a split-pane editor with live conversion, multi-file support, and advanced SVG optimization.

## 🌟 Features

### Core Functionality
- **Real-time Conversion**: Instantly convert HTML to PUG and vice versa
- **Multi-File Support**: Open and work with multiple files simultaneously using tabs
- **Dual Editor Interface**: Side-by-side HTML and PUG editors with syntax highlighting
- **Drag & Drop**: Reorder tabs by dragging them to different positions

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
  - Fine-grained control over optimization plugins
  - Adjustable precision for numbers and transforms
- **SVG ID to Class Conversion**: Convert SVG `id` attributes to `class` attributes
- **Smart Formatting**: Automatic beautification of both HTML and PUG code
- **Bodyless Mode**: Automatically detects and handles HTML snippets without `<html>` or `<body>` tags

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| <kbd>⌥</kbd><kbd>⌘</kbd><kbd>T</kbd> (Mac) / <kbd>Alt</kbd><kbd>Ctrl</kbd><kbd>T</kbd> (Win/Linux) | Create new tab |
| <kbd>⌥</kbd><kbd>⌘</kbd><kbd>O</kbd> (Mac) / <kbd>Alt</kbd><kbd>Ctrl</kbd><kbd>O</kbd> (Win/Linux) | Open files |
| <kbd>⌥</kbd><kbd>⌘</kbd><kbd>W</kbd> (Mac) / <kbd>Alt</kbd><kbd>Ctrl</kbd><kbd>W</kbd> (Win/Linux) | Close current tab |
| <kbd>⇧</kbd><kbd>⌥</kbd><kbd>⌘</kbd><kbd>W</kbd> (Mac) / <kbd>Shift</kbd><kbd>Alt</kbd><kbd>Ctrl</kbd><kbd>W</kbd> (Win/Linux) | Close all tabs |
| <kbd>⌃</kbd><kbd>⌥</kbd><kbd>⌘</kbd><kbd>W</kbd> (Mac) / <kbd>Ctrl</kbd><kbd>Alt</kbd><kbd>W</kbd> (Win/Linux) | Close all other tabs |
| <kbd>⌘</kbd><kbd>⇧</kbd><kbd>K</kbd> (Mac) / <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>K</kbd> (Win/Linux) | Delete current line |

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
1. **HTML to PUG**: Type or paste HTML code in the left editor panel
2. **PUG to HTML**: Type or paste PUG code in the right editor panel
3. **Open Files**: Click the "Open" button or use <kbd>⌥</kbd><kbd>⌘</kbd><kbd>O</kbd> to select and open multiple HTML/SVG files
4. **Create New Tab**: Click the "+" button in the tab bar or use <kbd>⌥</kbd><kbd>⌘</kbd><kbd>T</kbd>
5. **Switch Tabs**: Click on any tab to switch between open files
6. **Reorder Tabs**: Drag and drop tabs to rearrange them
7. **Close Tabs**: Click the "×" button on a tab or use keyboard shortcuts

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
- **Global Settings**: Enable/disable multipass optimization and set precision
- **Cleanup**: Remove doctype, comments, metadata, editor data, etc.
- **Styles & Attributes**: Manage styles, classes, and attributes
- **Structure**: Control element merging and grouping
- **Paths & Shapes**: Optimize paths, shapes, and coordinates
- **Numbers & Transforms**: Round numbers and optimize transforms
- **SVG Attributes**: Manage viewBox, IDs, and other SVG-specific attributes

## 🔧 Technologies Used

- **React** - UI framework
- **Ace Editor** - Code editor component with syntax highlighting
- **Pug** - Template engine for conversion
- **html-to-jade** - HTML to PUG conversion library
- **SVGO** - SVG optimization library
- **js-beautify** - Code formatting and beautification
- **he** - HTML entity encoder/decoder

## 📂 Project Structure

```
html2pug/
├── public/           # Static assets and HTML template
│   ├── html-to-jade.js
│   ├── pug.js
│   └── he.js
├── src/              # React source code
│   ├── App.js        # Main application component
│   ├── App.css       # Application styles
│   ├── Components/   # React components
│   │   └── Editor.js # Ace editor wrapper
│   ├── themes/       # Editor themes
│   │   └── ayu-mirage-custom.js
│   ├── vendor/       # Third-party libraries
│   │   └── svgo-browser.esm.js
│   ├── svgo-config.js # SVGO plugin configuration
│   └── template.js   # Default code templates
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
