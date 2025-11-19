import React, { useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from './ui/button';
import { X, Plus, Upload, Copy, XCircle, Layers } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useFileTabs } from '../hooks/useFileTabs';
import { useConversion } from '../hooks/useConversion';
import { cn } from '../lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';

interface SortableTabProps {
  id: string;
  title: string;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onDuplicate: () => void;
  onCloseOthers: () => void;
  onCloseAll: () => void;
  onNewTab: () => void;
}

const SortableTab: React.FC<SortableTabProps> = ({
  id,
  title,
  isActive,
  onSelect,
  onClose,
  onDuplicate,
  onCloseOthers,
  onCloseAll,
  onNewTab
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="flex items-center">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={setNodeRef}
            data-tab-id={id}
            style={{
              ...style,
              backgroundColor: isActive ? '#232937' : 'transparent'
            }}
            className={cn(
              'flex items-center gap-2 pl-6 pr-3 py-2 border-t border-t-transparent select-none h-10',
              'hover:bg-muted transition-colors relative',
              isActive && 'text-accent-foreground border-t-[#FFC94F]',
              isDragging && 'opacity-50'
            )}
            role="tab"
            aria-selected={isActive}
          >
            <span
              className="text-sm truncate max-w-[200px] cursor-pointer"
              style={{ color: isActive ? '#C5C5C5' : '#6E7A8F' }}
              title={title}
              onClick={onSelect}
              {...attributes}
              {...listeners}
            >
              {title}
            </span>
            <button
              className={cn(
                'p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                isActive ? 'text-foreground/70' : 'text-muted-foreground'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label={`Close ${title}`}
              tabIndex={0}
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={onNewTab}>
            <Plus className="w-4 h-4 mr-2" />
            New Tab
          </ContextMenuItem>
          <ContextMenuItem onClick={onDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate Tab
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close Tab
          </ContextMenuItem>
          <ContextMenuItem onClick={onCloseOthers}>
            <XCircle className="w-4 h-4 mr-2" />
            Close Other Tabs
          </ContextMenuItem>
          <ContextMenuItem onClick={onCloseAll}>
            <Layers className="w-4 h-4 mr-2" />
            Close All Tabs
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <div className="h-10 w-px bg-border shrink-0" />
    </div>
  );
};

export const TabBar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const openFiles = useAppStore(state => state.openFiles);
  const activeFileId = useAppStore(state => state.activeFileId);
  const reorderFiles = useAppStore(state => state.reorderFiles);
  const addFile = useAppStore(state => state.addFile);
  const addFiles = useAppStore(state => state.addFiles);
  const setTabBarScrollPosition = useAppStore(state => state.setTabBarScrollPosition);
  const duplicateFile = useAppStore(state => state.duplicateFile);
  const closeOtherFiles = useAppStore(state => state.closeOtherFiles);
  const closeAllFiles = useAppStore(state => state.closeAllFiles);

  const { handleTabSwitch, handleTabClose } = useFileTabs();
  const { convertHtmlToPug } = useConversion();

  // Scroll active tab into view on mount and when it changes
  React.useEffect(() => {
    if (tabBarRef.current && activeFileId) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const activeTab = tabBarRef.current?.querySelector(`[data-tab-id="${activeFileId}"]`);
        if (activeTab) {
          activeTab.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeFileId]);

  // Save scroll position when user scrolls
  const handleScroll = React.useCallback(() => {
    if (tabBarRef.current) {
      setTabBarScrollPosition(tabBarRef.current.scrollLeft);
    }
  }, [setTabBarScrollPosition]);

  const handleNewTab = () => {
    const newFile = {
      id: Date.now().toString(),
      name: 'Untitled',
      htmlContent: '',
      pugContent: ''
    };
    addFile(newFile);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const state = useAppStore.getState();
      const fileArray = Array.from(files);
      let processedCount = 0;
      const newFiles: Array<{
        id: string;
        name: string;
        htmlContent: string;
        pugContent: string;
      }> = [];

      fileArray.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (!content) return;

          const pugContent = convertHtmlToPug(content, {
            isSvgoEnabled: state.isSvgoEnabled,
            svgoSettings: state.svgoSettings,
            enableSvgIdToClass: state.enableSvgIdToClass,
            enableCommonClasses: state.enableCommonClasses,
            enablePugSizeVars: state.enablePugSizeVars,
            useSoftTabs: state.useSoftTabs,
            tabSize: state.tabSize,
            fileName: file.name
          });

          const fileData = {
            id: `file-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            htmlContent: content,
            pugContent
          };

          newFiles.push(fileData);
          processedCount++;

          if (processedCount === fileArray.length) {
            addFiles(newFiles);
          }
        };
        reader.onerror = () => {
          console.error(`Failed to read file: ${file.name}`);
          processedCount++;
        };
        reader.readAsText(file);
      });

      e.target.value = '';
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = openFiles.findIndex((f) => f.id === active.id);
      const newIndex = openFiles.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(openFiles, oldIndex, newIndex);
        reorderFiles(newOrder.map((f) => f.id));
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.svg"
        multiple
        onChange={handleFileInputChange}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }}
        aria-label="Upload HTML files"
      />

      <div className="flex items-center h-10 relative" style={{ backgroundColor: '#1E2431', borderBottom: '1px solid #2F3A4B' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUploadClick}
          className="h-8 ml-2 mr-2 shrink-0"
          style={{ color: '#C5C5C5' }}
          aria-label="Upload files"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>

        <div className="h-full w-px bg-border shrink-0" />

        <div
          ref={tabBarRef}
          className="flex items-center overflow-x-auto scrollbar-hide flex-1"
          role="tablist"
          onScroll={handleScroll}
        >
          {openFiles.length === 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewTab}
              className="h-8 ml-2 shrink-0"
              aria-label="Create new tab"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Tab
            </Button>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={openFiles.map((f) => f.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {openFiles.map((file) => (
                    <SortableTab
                      key={file.id}
                      id={file.id}
                      title={file.name}
                      isActive={file.id === activeFileId}
                      onSelect={() => handleTabSwitch(file.id)}
                      onClose={() => handleTabClose(file.id)}
                      onDuplicate={() => duplicateFile(file.id)}
                      onCloseOthers={() => closeOtherFiles(file.id)}
                      onCloseAll={closeAllFiles}
                      onNewTab={handleNewTab}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewTab}
                className="h-8 ml-2 shrink-0"
                aria-label="Create new tab"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
