import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Message, Sender, Feedback } from '../types';
import { LoadingState } from './ui/LoadingState';

interface MessageBubbleProps {
  message: Message;
  isDarkMode: boolean;
  mode: 'diretoria' | 'operacao';
  onFeedback?: (feedback: Feedback) => void;
  onToggleSources?: () => void;
  isLast?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = memo(({
  message,
  isDarkMode,
  mode,
  onFeedback,
  onToggleSources,
  isLast = false,
}) => {
  const isBot = message.sender === Sender.Bot;
  const isUser = message.sender === Sender.User;

  const bubbleClass = useMemo(() => {
    if (isBot) {
      return `${isDarkMode ? 'bg-slate-900' : 'bg-white'} border ${
        isDarkMode ? 'border-gray-700/30' : 'border-gray-200'
      }`;
    }
    return `${
      isDarkMode
        ? 'bg-emerald-900/20 border-emerald-900/30 text-emerald-100'
        : 'bg-emerald-50 border-emerald-100 text-slate-800'
    }`;
  }, [isBot, isDarkMode]);

  // Loading state
  if (message.isThinking) {
    return (
      <div className="flex justify-start">
        <div className={`rounded-2xl p-4 shadow-sm w-full ${bubbleClass}`}>
          <div className="flex items-center justify-between mb-2 opacity-70 text-[10px] uppercase font-bold tracking-wider">
            <span>{mode === 'operacao' ? '🚺 Operação' : '✈️ Diretoria'}</span>
            <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <LoadingState 
            stage="Processando..." 
            isDarkMode={isDarkMode}
            progress={30}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (message.isError) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start"
      >
        <div className={`rounded-2xl p-4 shadow-sm w-full ${
          isDarkMode ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50 border-red-200'
        } border`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${
                isDarkMode ? 'text-red-400' : 'text-red-700'
              }`}>
                Erro no processamento
              </h4>
              <p className={`text-xs leading-relaxed ${
                isDarkMode ? 'text-red-300' : 'text-red-600'
              }`}>
                {message.errorDetails?.friendlyMessage || 'Ocorreu um erro ao processar sua mensagem.'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`rounded-2xl p-4 shadow-sm ${
        isBot ? 'w-full' : 'max-w-[85%] md:max-w-[70%]'
      } ${bubbleClass}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2 opacity-70 text-[10px] uppercase font-bold tracking-wider">
          <span>
            {isBot 
              ? (mode === 'operacao' ? '🚺 Operação' : '✈️ Diretoria')
              : '👤 Você'
            }
          </span>
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {isBot ? (
            <div 
              className="whitespace-pre-wrap text-sm md:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
              {message.text}
            </div>
          )}
        </div>

        {/* Actions */}
        {isBot && onFeedback && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/30 dark:border-gray-700/30">
            <button
              onClick={() => onFeedback('up')}
              className={`p-1.5 rounded transition-colors ${
                message.feedback === 'up'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'
              }`}
              aria-label="Gostei"
            >
              👍
            </button>
            <button
              onClick={() => onFeedback('down')}
              className={`p-1.5 rounded transition-colors ${
                message.feedback === 'down'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'
              }`}
              aria-label="Não gostei"
            >
              👎
            </button>
            {message.groundingSources && message.groundingSources.length > 0 && (
              <button
                onClick={onToggleSources}
                className="ml-auto text-xs text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                {message.isSourcesOpen ? 'Ocultar' : 'Ver'} fontes ({message.groundingSources.length})
              </button>
            )}
          </div>
        )}

        {/* Sources */}
        {isBot && message.isSourcesOpen && message.groundingSources && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-gray-200/30 dark:border-gray-700/30"
          >
            <h5 className="text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">
              Fontes consultadas
            </h5>
            <ul className="space-y-1">
              {message.groundingSources.map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-500 hover:text-emerald-600 hover:underline truncate block"
                  >
                    {i + 1}. {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

// Helper para formatar texto da mensagem
function formatMessageText(text: string): string {
  if (!text) return '';
  
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-500 hover:underline">$1</a>')
    // Lists
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-emerald-500 pl-4 my-2 italic">$1</blockquote>')
    // Line breaks
    .replace(/\n/g, '<br />');
}
