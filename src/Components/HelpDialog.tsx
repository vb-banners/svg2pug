import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">HTML to PUG</DialogTitle>
          <DialogDescription>Keyboard shortcuts and information</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Keyboard Shortcuts - Temporarily commented out for beta
          <section>
            <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">⌥</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">⌘</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">T</kbd>
                </div>
                <span className="text-sm text-muted-foreground">New tab</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">⌥</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">⌘</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">O</kbd>
                </div>
                <span className="text-sm text-muted-foreground">Open files</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">⌥</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">⌘</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">S</kbd>
                </div>
                <span className="text-sm text-muted-foreground">Toggle SVGO settings</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">⌥</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">⌘</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">H</kbd>
                </div>
                <span className="text-sm text-muted-foreground">Show this help</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 text-xs font-semibold bg-[#1A1A1A] border border-[#FFD173]/20 rounded">⌘</kbd>
                  <kbd className="px-2 py-1 text-xs font-semibold bg-[#1A1A1A] border border-[#FFD173]/20 rounded">⇧</kbd>
                  <kbd className="px-2 py-1 text-xs font-semibold bg-[#1A1A1A] border border-[#FFD173]/20 rounded">K</kbd>
                </div>
                <span className="text-sm text-gray-300">Delete line(s) (Monaco)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">⌘</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">⇧</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">C</kbd>
                </div>
                <span className="text-sm text-muted-foreground">Toggle Quick Copy</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">Esc</kbd>
                </div>
                <span className="text-sm text-muted-foreground">Close dialogs</span>
              </div>
            </div>
          </section>
          */}

          <section>
            <h3 className="text-lg font-semibold mb-3">About</h3>
            <p className="text-sm mb-4" style={{ color: '#C5C5C5' }}>
              HTML to PUG helps you convert HTML snippets to PUG format with optional SVGO optimization for SVG elements.
            </p>
            
            <h4 className="text-sm font-semibold mb-2">Features</h4>
            <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: '#C5C5C5' }}>
              <li>Real-time HTML to Pug conversion</li>
              <li>Multi-file support with tabs</li>
              <li>Quick Copy feature with multi-selection (Shift+Click)</li>
              <li>SVGO optimization with 40+ configurable plugins</li>
              <li>SVG Id to class transformation</li>
              <li>Pug size variables for responsive SVGs</li>
              <li>Customizable indentation (spaces/tabs, size)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">Repository</h3>
            <a 
              href="https://github.com/vb-banners/html2pug" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              github.com/vb-banners/html2pug
            </a>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">Based on</h3>
            <div className="space-y-1">
              <a 
                href="https://github.com/dvamvo/html2pug" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                github.com/dvamvo/html2pug
              </a>
              <a 
                href="https://github.com/jakearchibald/svgomg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                github.com/jakearchibald/svgomg
              </a>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
