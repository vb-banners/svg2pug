import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FileTab } from '../types/FileTab';

export const useFileTabs = () => {
  const {
    openFiles,
    activeFileId,
    addFile,
    removeFile,
    setActiveFile,
    updateFileContent,
    reorderFiles,
    setDraggedTabId,
    setDragOverTabId,
  } = useAppStore();

  const handleTabSwitch = useCallback((fileId: string) => {
    const file = openFiles.find(f => f.id === fileId);
    if (!file) {
      return;
    }
    setActiveFile(fileId);
  }, [openFiles, setActiveFile]);

  const handleTabClose = useCallback((fileId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    removeFile(fileId);
  }, [removeFile]);

  const handleTabDragStart = useCallback((fileId: string, event: React.DragEvent) => {
    setDraggedTabId(fileId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', fileId);
  }, [setDraggedTabId]);

  const handleTabDragOver = useCallback((fileId: string, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverTabId(fileId);
  }, [setDragOverTabId]);

  const handleTabDragLeave = useCallback(() => {
    setDragOverTabId(null);
  }, [setDragOverTabId]);

  const handleTabDrop = useCallback((targetFileId: string, event: React.DragEvent) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/html');
    
    if (!draggedId || draggedId === targetFileId) {
      setDraggedTabId(null);
      setDragOverTabId(null);
      return;
    }

    const draggedIndex = openFiles.findIndex(f => f.id === draggedId);
    const targetIndex = openFiles.findIndex(f => f.id === targetFileId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTabId(null);
      setDragOverTabId(null);
      return;
    }

    const newFiles = [...openFiles];
    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(targetIndex, 0, draggedFile);

    reorderFiles(newFiles.map(f => f.id));
    setDraggedTabId(null);
    setDragOverTabId(null);
  }, [openFiles, reorderFiles, setDraggedTabId, setDragOverTabId]);

  const handleTabDragEnd = useCallback(() => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  }, [setDraggedTabId, setDragOverTabId]);

  const handleFileOpen = useCallback((files: FileList | null, convertHtmlToPug: (html: string, fileName: string) => string) => {
    if (!files || files.length === 0) {
      return;
    }

    let filesProcessed = 0;
    const totalFiles = files.length;
    const newFiles: FileTab[] = [];

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          const fileId = `file-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
          
          const pugContent = convertHtmlToPug(content, file.name);
          
          newFiles.push({
            id: fileId,
            name: file.name,
            htmlContent: content,
            pugContent: pugContent
          });

          filesProcessed++;
          if (filesProcessed === totalFiles) {
            newFiles.forEach(f => addFile(f));
          }
        }
      };
      reader.onerror = () => {
        console.error(`Failed to read file: ${file.name}`);
        filesProcessed++;
      };
      reader.readAsText(file);
    });
  }, [addFile]);

  const getActiveFile = useCallback(() => {
    return openFiles.find(f => f.id === activeFileId) || null;
  }, [openFiles, activeFileId]);

  return {
    openFiles,
    activeFileId,
    handleTabSwitch,
    handleTabClose,
    handleTabDragStart,
    handleTabDragOver,
    handleTabDragLeave,
    handleTabDrop,
    handleTabDragEnd,
    handleFileOpen,
    getActiveFile,
    updateFileContent,
  };
};
