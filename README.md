# HTML to PUG Converter

A real-time online converter that transforms HTML code into PUG (formerly Jade) template syntax. Built with React and featuring a split-pane editor with live conversion.

## 🌟 Features

- **Real-time Conversion**: Instantly convert HTML to PUG and vice versa
- **Dual Editor Interface**: Side-by-side HTML and PUG editors with syntax highlighting
- **Customizable Settings**:
  - Toggle between spaces and tabs for indentation
  - Adjustable tab size (1-6 spaces)
  - Resizable split panes
  - Draggable floating controls
- **Persistent Preferences**: Your settings are saved in local storage
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

1. **HTML to PUG**: Type or paste HTML code in the left editor panel
2. **PUG to HTML**: Type or paste PUG code in the right editor panel
3. **Adjust Settings**: Use the floating controls to:
   - Switch between spaces and tabs
   - Change the indentation size
   - Drag the controls panel to your preferred position
4. **Resize Panes**: Drag the divider between editors to adjust the view

## 🔧 Technologies Used

- **React** - UI framework
- **Ace Editor** - Code editor component with syntax highlighting
- **Pug** - Template engine for conversion
- **html-to-jade** - HTML to PUG conversion library
- **js-beautify** - Code formatting and beautification
- **he** - HTML entity encoder/decoder

## 📂 Project Structure

```
html2pug/
├── public/           # Static assets and HTML template
├── src/              # React source code
│   ├── App.js        # Main application component
│   ├── Components/   # React components
│   ├── themes/       # Editor themes
│   └── template.js   # Default code templates
├── docs/             # Production build (GitHub Pages)
└── scripts/          # Build scripts
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Fork of [dvamvo/html2pug](https://github.com/dvamvo/html2pug)
- Original project by @chenka

## 📧 Contact

For issues and questions, please use the [GitHub Issues](https://github.com/vb-banners/html2pug/issues) page.
