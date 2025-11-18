import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './Components/ErrorBoundary';
import './index.css';
import './styles/globals.css';

// Suppress ResizeObserver errors that occur during rapid resizing
window.addEventListener('error', (e: ErrorEvent) => {
  if (
    e.message.includes('ResizeObserver loop') ||
    e.message.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

const warn = window.console.warn;
window.console.warn = (message: any) => {
  if (/Automatically scrolling/.test(message)) {
    return;
  }
  warn(message);
};
