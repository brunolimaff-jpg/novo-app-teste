import React, { memo, useRef, useCallback, useEffect, useState } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import type { Message, Sender } from '../types';
import { motion } from 'framer-motion';

interface VirtualMessageListProps {
  messages: Message[];
  isDarkMode: boolean;
  renderMessage: (message: Message, index: number) => React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// Altura estimada para cada tipo de mensagem
const MESSAGE_HEIGHTS: Record<string, number> = {
  user: 80,
  bot: 400,
  thinking: 120,
  error: 200,
};

const getItemHeight = (message: Message): number => {
  if (message.isThinking) return MESSAGE_HEIGHTS.thinking;
  if (message.isError) return MESSAGE_HEIGHTS.error;
  if (message.sender === Sender.User) return MESSAGE_HEIGHTS.user;
  
  // Estimativa baseada no tamanho do texto
  const textLength = message.text?.length || 0;
  if (textLength > 2000) return 600;
  if (textLength > 1000) return 400;
  if (textLength > 500) return 300;
  return MESSAGE_HEIGHTS.bot;
};

interface ItemData {
  messages: Message[];
  isDarkMode: boolean;
  renderMessage: (message: Message, index: number) => React.ReactNode;
}

const Row = memo(({ index, style, data }: ListChildComponentProps<ItemData>) => {
  const { messages, renderMessage } = data;
  const message = messages[index];
  
  return (
    <div style={style} className="px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
      >
        {renderMessage(message, index)}
      </motion.div>
    </div>
  );
});

Row.displayName = 'VirtualMessageRow';

export const VirtualMessageList: React.FC<VirtualMessageListProps> = memo(({
  messages,
  isDarkMode,
  renderMessage,
  onLoadMore,
  hasMore = false,
}) => {
  const listRef = useRef<List>(null);
  const [itemHeights, setItemHeights] = useState<number[]>([]);

  // Calcular alturas iniciais
  useEffect(() => {
    const heights = messages.map(getItemHeight);
    setItemHeights(heights);
  }, [messages]);

  const itemData: ItemData = {
    messages,
    isDarkMode,
    renderMessage,
  };

  // Scroll para o final quando novas mensagens chegam
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  const getItemSize = useCallback((index: number) => {
    return itemHeights[index] || MESSAGE_HEIGHTS.bot;
  }, [itemHeights]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 min-h-0">
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            itemCount={messages.length}
            itemSize={getItemSize}
            width={width}
            itemData={itemData}
            overscanCount={3}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
});

VirtualMessageList.displayName = 'VirtualMessageList';
