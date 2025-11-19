import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './Components/ErrorBoundary';
import './index.css';
import './styles/globals.css';

// Suppress ResizeObserver errors that occur during rapid resizing
const resizeObserverLoopErr = 'ResizeObserver loop completed with undelivered notifications';
const resizeObserverLoopErr2 = 'ResizeObserver loop limit exceeded';

// Patch console.error to suppress these errors from showing in console
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes(resizeObserverLoopErr) || args[0].includes(resizeObserverLoopErr2))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

window.addEventListener('error', (e: ErrorEvent) => {
  if (
    e.message.includes(resizeObserverLoopErr) ||
    e.message.includes(resizeObserverLoopErr2)
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, { capture: true });

window.onerror = (message) => {
  const msg = typeof message === 'string' ? message : '';
  if (
    msg.includes(resizeObserverLoopErr) ||
    msg.includes(resizeObserverLoopErr2)
  ) {
    return true;
  }
  return false;
};

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
