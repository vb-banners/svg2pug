import React from 'react';
import { useAppStore } from '../store/useAppStore';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const calculateCompressionRatio = (htmlSize: number, pugSize: number): string => {
  if (htmlSize === 0 || pugSize === 0) return '-';
  const ratio = ((htmlSize - pugSize) / htmlSize) * 100;
  const sign = ratio >= 0 ? '-' : '+';
  return `${sign}${Math.abs(ratio).toFixed(1)}%`;
};

export const StatusBar: React.FC = () => {
  const activeEditor = useAppStore(state => state.activeEditor);
  const htmlCursorPosition = useAppStore(state => state.htmlCursorPosition);
  const pugCursorPosition = useAppStore(state => state.pugCursorPosition);
  const htmlSelectionInfo = useAppStore(state => state.htmlSelectionInfo);
  const pugSelectionInfo = useAppStore(state => state.pugSelectionInfo);
  const compressionStats = useAppStore(state => state.compressionStats);
  const statusMessage = useAppStore(state => state.statusMessage);
  const tabSize = useAppStore(state => state.tabSize);
  const useSoftTabs = useAppStore(state => state.useSoftTabs);

  const cursorPosition = activeEditor === 'html' ? htmlCursorPosition : pugCursorPosition;
  const selectionInfo = activeEditor === 'html' ? htmlSelectionInfo : pugSelectionInfo;

  const compressionRatio = calculateCompressionRatio(
    compressionStats?.htmlGzipSize || 0,
    compressionStats?.pugGzipSize || 0
  );

  return (
          <div
        className="status-bar"
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '0 24px',
          color: '#6E7A8F',
          position: 'relative',
          backgroundColor: '#1E2431',
          borderTop: '1px solid #2F3A4B'
        }}
      >
      <div className="status-bar__left" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', flex: '1 1 0', minWidth: 0 }}>
        {activeEditor && (
          <div className="status-bar__item" title="Active editor language" style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center', color: '#6E7A8F' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.5 11.5A.5.5 0 0 1 5 11h10a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm-2-4A.5.5 0 0 1 3 7h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm-2-4A.5.5 0 0 1 1 3h10a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5z"/>
            </svg>
            <span>{activeEditor === 'html' ? 'HTML' : 'Pug'}</span>
          </div>
        )}

        <div className="status-bar__item" title="Indentation settings" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#6E7A8F' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11A.5.5 0 0 1 5 2zm5 0a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11A.5.5 0 0 1 10 2z"/>
          </svg>
          <span>{useSoftTabs ? `Spaces: ${tabSize}` : `Tabs: ${tabSize}`}</span>
        </div>

        {cursorPosition && (
          <div className="status-bar__item" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#6E7A8F' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13A6 6 0 1 1 8 2a6 6 0 0 1 0 12z"/>
              <path d="M8 8a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 1 0v3A.5.5 0 0 1 8 8z"/>
            </svg>
            <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          </div>
        )}

        {selectionInfo && (
          <div className="status-bar__item" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#6E7A8F' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.5 3.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
            </svg>
            <span>{selectionInfo.charCount} char{selectionInfo.charCount !== 1 ? 's' : ''}, {selectionInfo.lineCount} line{selectionInfo.lineCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="status-bar__message" style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '6px', pointerEvents: 'none', color: '#f7c65b' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
          </svg>
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="status-bar__right" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', flex: '1 1 0', minWidth: 0, justifyContent: 'flex-end' }}>
        {compressionStats && compressionStats.htmlGzipSize > 0 && (
          <div className="status-bar__item" title="HTML gzipped size" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#6E7A8F' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>
            </svg>
            <span>HTML: {formatBytes(compressionStats.htmlGzipSize)}</span>
          </div>
        )}

        {compressionStats && compressionStats.pugGzipSize > 0 && (
          <div className="status-bar__item" title="Pug gzipped size" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#6E7A8F' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>
            </svg>
            <span>Pug: {formatBytes(compressionStats.pugGzipSize)}</span>
          </div>
        )}

        {compressionStats && compressionStats.htmlGzipSize > 0 && compressionStats.pugGzipSize > 0 && (
          <div className="status-bar__item status-bar__compression" title="Compression ratio" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#6E7A8F' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2z"/>
            </svg>
            <span>{compressionRatio}</span>
          </div>
        )}
      </div>
    </div>
  );
};
