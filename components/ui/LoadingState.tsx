import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface LoadingStateProps {
  stage?: string;
  completedStages?: string[];
  progress?: number;
  isDarkMode?: boolean;
  searchQuery?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = memo(({
  stage = 'Iniciando análise',
  completedStages = [],
  progress = 0,
  isDarkMode = false,
  searchQuery,
}) => {
  return (
    <div className="space-y-3">
      {searchQuery && (
        <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Pesquisando: <span className="font-medium">{searchQuery}</span>
        </div>
      )}

      {/* Progress bar */}
      <div className={`h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <motion.div
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Current stage */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
        <span className={`text-sm font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
          {stage}
        </span>
      </div>

      {/* Completed stages */}
      {completedStages.length > 0 && (
        <div className="space-y-1">
          {completedStages.map((completedStage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
            >
              <span className="text-emerald-500">✓</span>
              {completedStage}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  isDarkMode?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
  size = 'md',
  isDarkMode = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizeClasses[size]} border-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} border-t-emerald-500 rounded-full`}
      />
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
