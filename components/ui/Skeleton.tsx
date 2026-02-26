import React, { memo } from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = memo(({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
        />
      ))}
    </>
  );
});

Skeleton.displayName = 'Skeleton';

interface SkeletonMessageProps {
  isDarkMode?: boolean;
  count?: number;
}

export const SkeletonMessage: React.FC<SkeletonMessageProps> = memo(({ 
  isDarkMode = false, 
  count = 1 
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-2xl p-4 ${
            isDarkMode ? 'bg-slate-900' : 'bg-white'
          } border ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-12 h-3" />
          </div>
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-3/4 h-4 mb-2" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      ))}
    </div>
  );
});

SkeletonMessage.displayName = 'SkeletonMessage';

interface SkeletonSidebarProps {
  isDarkMode?: boolean;
  count?: number;
}

export const SkeletonSidebar: React.FC<SkeletonSidebarProps> = memo(({ 
  isDarkMode = false, 
  count = 5 
}) => {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`p-3 rounded-lg ${
            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}
        >
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-2/3 h-3" />
        </div>
      ))}
    </div>
  );
});

SkeletonSidebar.displayName = 'SkeletonSidebar';
