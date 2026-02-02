# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SVG2PUG is a React/TypeScript web app that converts SVG/HTML to PUG (formerly Jade) template syntax with live bidirectional editing. It features Monaco Editor, multi-file tabs, SVGO optimization, and live preview. Deployed to GitHub Pages at https://vb-banners.github.io/svg2pug/

## Commands

```bash
npm start          # Start dev server at localhost:3000
npm run build      # Production build to docs/ (for GitHub Pages)
npm test           # Run tests with Jest
npm run deploy     # Build + commit docs/
```

## Deployment Workflow

**IMPORTANT**: Before pushing to remote, ALWAYS run `npm run build` first to update the `docs/` folder, then commit the docs changes, then push. The site deploys from `docs/` via GitHub Pages.

## Architecture

### State Management
- **Zustand store** (`src/store/useAppStore.ts`): Single centralized store with localStorage persistence via `html2pug-storage` key. Contains all app state including open files, editor content, SVGO settings, and UI preferences.
- Store uses `partialize` to selectively persist only certain fields and `merge` for handling SVGO settings migrations.

### Conversion Pipeline
The core conversion logic is in `src/hooks/useConversion.ts`:
1. **HTML→PUG**: `convertHtmlToPug()` chains: SVGO optimization → fill/opacity reordering → html-to-jade conversion → pug-beautify → custom transforms (id-to-class, common classes, size vars, remove SVG parent)
2. **PUG→HTML**: `convertPugToHtml()` uses window.pug.render() → js-beautify
3. Custom SVGO plugins: `figmaCleanup` (removes Exclude/Vector IDs), `removeBlackFill` (removes fill="#000")

### External Scripts
Three scripts loaded via `<script>` tags in `public/index.html` and exposed globally:
- `window.Html2Jade` - SVG to PUG conversion
- `window.pug` - PUG to HTML rendering
- `window.he` - HTML entity encoding

The app polls for these scripts on mount (`App.tsx:36-66`) before becoming functional.

### Key Custom Hooks
| Hook | Purpose |
|------|---------|
| `useConversion` | All conversion logic and SVGO config building |
| `useFileTabs` | Tab management, drag-drop reordering |
| `useQuickCopy` | Shift+click multi-line selection in PUG editor |
| `useSplitPane` | Resizable editor panes |
| `usePasteHandler` | Paste SVG/HTML files from Finder |
| `useKeyboardShortcuts` | Global keyboard bindings |

### Component Structure
- `App.tsx` - Root, manages script loading and keyboard shortcuts
- `EditorPane.tsx` - Main editing area with Monaco editors and preview
- `MonacoEditor.tsx` - Monaco wrapper with custom Ayu Mirage theme
- `FloatingControls.tsx` - Draggable settings toolbar
- `TabBar.tsx` - File tabs with dnd-kit for drag reordering
- `PreviewPane.tsx` - Live SVG preview with line highlighting

### SVGO Configuration
- Plugin definitions in `src/svgo-config.ts` with 50+ plugins organized by category
- Browser-bundled SVGO at `src/vendor/svgo-browser.esm.js`
- Settings dialog provides granular control over each plugin

### Build Process
`scripts/build-to-docs.js`:
- Runs react-scripts build
- Moves output from `build/` to `docs/` (GitHub Pages convention)
- Adds cache-busting timestamps to external script tags
- Preserves old hashed chunks for cache safety

## UI/Styling
- Tailwind CSS with custom Ayu Mirage dark theme
- shadcn/ui components in `src/Components/ui/`
- Monaco editor theme defined in `src/themes/ayu-mirage-monaco.ts`
- Inter font for UI, Fira Code for editors

### Toast Notifications
- Toast system in Zustand store (`toasts` array, `addToast`/`removeToast` actions)
- `ToastContainer.tsx` renders toasts via React Portal (bottom-right, max 5 visible)
- Variants: success (#CAFF6C), error (#FF3333), warning (#FFC94F), info (#73D0FF)

### PreviewPane Content Sanitization
The preview iframe (`PreviewPane.tsx`) sanitizes injected content to prevent errors:
- Strips document wrappers (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>` tags) from full HTML documents
- Removes `<script>` tags to prevent JavaScript errors in sandboxed iframe context
- Content is extracted from body if present, otherwise from after `</head>`

## Testing & Code Quality
```bash
npm run lint        # ESLint check
npm run lint:fix    # ESLint auto-fix
npm run format      # Prettier format
npm run format:check # Prettier check
npm run typecheck   # TypeScript check
npm test            # Jest tests
```

- ESLint config in `.eslintrc.json` (extends react-app + prettier)
- Prettier config in `.prettierrc`
- Jest tests in `src/__tests__/`
- GitHub Actions CI in `.github/workflows/ci.yml`
