import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import pako from 'pako';

export const useCompressionStats = (htmlCode: string, pugCode: string) => {
  const setCompressionStats = useAppStore(state => state.setCompressionStats);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const htmlGzipped = pako.gzip(htmlCode);
        const pugGzipped = pako.gzip(pugCode);
        
        setCompressionStats({
          htmlGzipSize: htmlGzipped.length,
          pugGzipSize: pugGzipped.length
        });
      } catch (error) {
        console.error('Error calculating compression stats:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [htmlCode, pugCode, setCompressionStats]);
};
