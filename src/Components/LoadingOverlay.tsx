import React from 'react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: '#1E2431' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <div
            className="absolute inset-0 rounded-full border-2 border-[#2F3A4B]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FFC94F] animate-spin"
            aria-hidden="true"
          />
        </div>

        {/* Loading text */}
        <p className="text-[#6E7A8F] text-sm">Loading editor scripts...</p>
      </div>
    </div>
  );
};
