import React from 'react';
import { type ViewStyle } from 'react-native';
import MainView from './MainView/MainView';
import { type Colors, ColorsProvider } from './hooks/colors';
import { client, setHost } from './utils/apollo-client';
import { ApolloProvider } from '@apollo/client';
import { UserInfoProvider } from './hooks/userInfo';
import { VideoProvider } from './hooks/video';
import {
  checkChatExits,
  deleteSession,
  type MetaData,
  sendActive,
} from './api/apiMutations';
import { type Translations, TranslationsProvider } from './hooks/translations';
import { type Theme, ThemeProvider } from './hooks/theme';
import {
  clearReferralSession,
  setNewReferral,
} from './utils/referralModificator';
import { OnPressLinkProvider } from './hooks/onPressLink';
import {
  type MessageHandler,
  MessageProvider,
} from './hooks/useMessageHandler';
import type { Message } from './types/queries';
import type {
  ExternalMessageInput,
  ConversationHistoryResponse,
  GetExternalConversationHistoryResponse,
  GetZowieConversationHistoryResponse,
} from './types/api';

export enum ZowieAuthenticationType {
  Anonymous = 'Anonymous',
  JwtToken = 'JwtToken',
}

export interface ZowieConfig {
  authenticationType: ZowieAuthenticationType;
  instanceId: string;
  jwt?: string;
  authorId?: string;
  contextId?: string;
  fcmToken?: string;
  conversationInitReferral?: string;
  initSaveExternalConversation?: {
    externalSystemId: string;
    externalMessages: ExternalMessageInput[];
  };
}

export interface ZowieChatProps {
  style?: ViewStyle;
  onStartChatError?: (error: string) => void;
  iosKeyboardOffset?: number;
  androidKeyboardOffset?: number;
  translations?: Translations;
  theme?: Theme;
  customColors?: Colors;
  metaData?: MetaData;
  config: ZowieConfig;
  host: string;
  onPressLink?: (url: string) => void;
  onNewTextMessage?: MessageHandler;
}

let isZowieChatMounted = false;

export const ZowieChat = ({
  style,
  iosKeyboardOffset = 0,
  androidKeyboardOffset = 0,
  customColors,
  metaData,
  config,
  host,
  onStartChatError,
  translations,
  theme,
  onPressLink,
  onNewTextMessage,
}: ZowieChatProps) => {
  setHost(host);

  React.useEffect(() => {
    isZowieChatMounted = true;
    return () => {
      isZowieChatMounted = false;
    };
  }, []);

  return (
    <ApolloProvider client={client}>
      <TranslationsProvider customTranslations={translations}>
        <ThemeProvider customTheme={theme}>
          <VideoProvider>
            <ColorsProvider customColors={customColors}>
              <UserInfoProvider>
                <MessageProvider onMessage={onNewTextMessage || undefined}>
                  <OnPressLinkProvider onPressLink={onPressLink || undefined}>
                    <MainView
                      host={host}
                      style={style}
                      androidKeyboardOffset={androidKeyboardOffset}
                      iosKeyboardOffset={iosKeyboardOffset}
                      metaData={metaData}
                      onStartChatError={onStartChatError}
                      config={config}
                    />
                  </OnPressLinkProvider>
                </MessageProvider>
              </UserInfoProvider>
            </ColorsProvider>
          </VideoProvider>
        </ThemeProvider>
      </TranslationsProvider>
    </ApolloProvider>
  );
};

/** Use this functions when you have sure that component is mounted **/
export const clearSession = async () => {
  try {
    if (await checkChatExits()) {
      await clearReferralSession();
      await deleteSession();
    }
    return 200;
  } catch (e) {
    return e;
  }
};

export const setActive = async (isActive: boolean) => {
  return await sendActive(isActive);
};

export const setReferral = async (referralId: string) => {
  await setNewReferral(referralId, isZowieChatMounted);
};

export {
  saveExternalConversationHistory,
  clearExternalConversationHistory,
} from './api/apiMutations';

export {
  getExternalConversationHistory,
  getZowieConversationHistory,
} from './api/apiQueries';

export type {
  Colors,
  MetaData,
  Translations,
  Theme,
  Message,
  ExternalMessageInput,
  GetExternalConversationHistoryResponse,
  ConversationHistoryResponse,
  GetZowieConversationHistoryResponse,
};
