import React, { createContext, useContext } from 'react';
import type { Message } from '../types/queries';

export type MessageHandler = (message: Message) => void;

const MessageContext = createContext<{
  onMessage?: MessageHandler;
}>({});

type MessageProviderProps = {
  children: React.ReactNode;
  onMessage?: MessageHandler;
};

export const MessageProvider = ({
  children,
  onMessage,
}: MessageProviderProps) => {
  return (
    <MessageContext.Provider value={{ onMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageHandler = () => useContext(MessageContext);
