import {
  ActivityIndicator,
  Alert,
  FlatList,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  View,
  type ViewStyle,
  type ViewToken,
} from 'react-native';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import styles from './style';
import { useColors } from '../hooks/colors';
import TextTyping from '../components/TextTyping';
import NewMessage from '../components/NewMessage';
import {
  deliveredMessage,
  getMessages,
  initializeChat,
  type MetaData,
  readMessage,
  sendFileMessage,
} from '../api/apiMutations';
import {
  type Message,
  type NewStatusSubscriptionData,
  PayloadTypes,
  type Status,
} from '../types/queries';
import { useMutation, useSubscription } from '@apollo/client';
import { NEW_MESSAGE, NEW_STATUS_SUBSCRIPTION } from '../utils/subscriptions';
import {
  debounce,
  generateUUID,
  isStatusHigher,
  mergeMessageArrays,
  prepareFileDraftMessage,
} from '../utils/functions';
import { SEND_BUTTON_MUTATION, SEND_TEXT_MUTATION } from '../utils/mutations';
import ZowieLogo from '../components/ZowieLogo';
import { type UserInfo, useUserInfo } from '../hooks/userInfo';
import MessageView from '../components/MessageView';
import VideoPlayerAndroid from '../components/VideoPlayerAndroid';
import { useVideo } from '../hooks/video';
import type { ZowieConfig } from 'react-native-zowiesdk';
import TimeDate from '../components/TimeDate';
import {
  additionalMinuteInMs,
  debounceTimeForSetNewestMessageAsReadMs,
  maxAttachmentFileSizeInBytes,
  newestMessageOffsetParams,
  notAllowedTypesToMessageList,
} from '../utils/config';
import useIsInternetConnection from '../hooks/internetConnection';
import InternetConnectionBanner from '../components/InternetConnectionBanner';
import DocumentPicker from '../components/DocumentPicker';
import { sendFile } from '../api/rest';
import { imageLibrary } from '../components/ImagePicker';
import { useTranslations } from '../hooks/translations';
import useUserActivity from '../hooks/userActivity';
import { useMessageHandler } from '../hooks/useMessageHandler';

interface Props {
  style?: ViewStyle;
  iosKeyboardOffset: number;
  androidKeyboardOffset: number;
  metaData?: MetaData;
  onStartChatError?: (error: string) => void;
  config: ZowieConfig;
  host: string;
}

const MainView = ({
  config,
  style,
  iosKeyboardOffset,
  androidKeyboardOffset,
  metaData,
  host,
  onStartChatError,
}: Props) => {
  useUserActivity();

  const { translations } = useTranslations();
  const { colors } = useColors();
  const { userInfo, setUserInfo } = useUserInfo();
  const { show, videoUrl, setShow } = useVideo();
  const { onMessage } = useMessageHandler();
  const isConnected = useIsInternetConnection();
  const [text, onChangeText] = React.useState('');
  const [messages, setMessages] = useState<Message[] | []>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [isNewestReaded, setIsNewestReaded] = useState(false);
  const [isNewestMessageVisible, setIsNewestMessageVisible] = useState(false);
  const [chatInitLoading, setChatInitLoading] = useState(false);

  const [sendText] = useMutation(SEND_TEXT_MUTATION);
  const [sendButton] = useMutation(SEND_BUTTON_MUTATION);

  const listRef = useRef<FlatList>(null);

  const scrollToLatest = () => {
    InteractionManager.runAfterInteractions(() => {
      if (listRef.current) {
        listRef.current.scrollToOffset(newestMessageOffsetParams);
      }
    });
  };

  const addNewMessage = (message: Message | undefined) => {
    if (message === undefined) {
      return;
    }
    setMessages((prevState) => [message, ...prevState]);
  };

  const onSend = async (
    clearInput = true,
    messageText?: string,
    buttonId?: string
  ) => {
    if (clearInput) {
      onChangeText('');
    }
    const tempId = generateUUID();
    const draftMessage = {
      time: Date.now(),
      id: tempId,
      payload: {
        __typename: PayloadTypes.Text,
        value: messageText?.trim() || text?.trim(),
      },
      author: {
        userId: userInfo.userId,
      },
      draft: true,
    };
    addNewMessage(draftMessage as Message);
    try {
      let newUserMessage;
      if (buttonId) {
        newUserMessage = await sendButton({
          variables: {
            conversationId: userInfo.conversationId,
            buttonId: buttonId,
          },
          context: {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          },
        });
      } else {
        newUserMessage = await sendText({
          variables: {
            conversationId: userInfo.conversationId,
            text: messageText || text,
          },
          context: {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          },
        });
      }

      if (buttonId) {
        setMessages((prevState) =>
          prevState.map((message) =>
            message.id === tempId
              ? {
                  ...(newUserMessage.data.sendButton as Message),
                  status: isStatusHigher(
                    message.status,
                    newUserMessage.data.sendButton.status
                  )
                    ? newUserMessage.data.sendButton.status
                    : message.status,
                  draft: false,
                }
              : message
          )
        );
      } else {
        setMessages((prevState) =>
          prevState.map((message) =>
            message.id === tempId
              ? {
                  ...(newUserMessage.data.sendText as Message),
                  status: isStatusHigher(
                    message.status,
                    newUserMessage.data.sendText.status
                  )
                    ? newUserMessage.data.sendText.status
                    : message.status,
                  draft: false,
                }
              : message
          )
        );
      }
      scrollToLatest();
    } catch (e) {
      setMessages((prevState) =>
        prevState.map((message) =>
          message.id === tempId
            ? {
                ...message,
                error: true,
                draft: false,
              }
            : message
        )
      );
      scrollToLatest();
    }
  };

  const onSendFileAttachment = async () => {
    const tempId = generateUUID();
    try {
      const file = await DocumentPicker.pickSingle();
      if (file) {
        const { uri, type, name, size } = file;

        if (size && size > maxAttachmentFileSizeInBytes) {
          Alert.alert(translations.maxAttachmentSize20MB);
          return;
        }

        const draftMessage = prepareFileDraftMessage(
          tempId,
          uri,
          type || '',
          userInfo.userId
        );
        addNewMessage(draftMessage);

        const sendFileResponse = await sendFile(
          uri,
          type || '',
          name || '',
          host,
          userInfo.conversationId,
          config.instanceId,
          userInfo.token
        );

        if (sendFileResponse.fileId) {
          const sendFileMessageResponse = await sendFileMessage(
            userInfo.conversationId,
            userInfo.token,
            sendFileResponse.fileId
          );
          setMessages((prevState) =>
            prevState.map((message) =>
              message.id === tempId
                ? {
                    ...(sendFileMessageResponse.data.sendFile as Message),
                    draft: false,
                  }
                : message
            )
          );
        }
      }
    } catch (e) {
      setMessages((prevState) =>
        prevState.map((message) =>
          message.id === tempId
            ? {
                ...message,
                error: true,
                draft: false,
              }
            : message
        )
      );
    }
  };

  const onSendImageAttachment = async () => {
    const tempId = generateUUID();
    try {
      const result = await imageLibrary({
        mediaType: 'mixed',
        selectionLimit: 1,
      });
      if (
        result.assets &&
        result?.assets.length > 0 &&
        result.assets[0]?.uri &&
        result.assets[0]?.fileSize &&
        result.assets[0].fileName &&
        result.assets[0].type
      ) {
        const { uri, fileSize, fileName, type } = result.assets[0];

        if (fileSize > maxAttachmentFileSizeInBytes) {
          Alert.alert(translations.maxAttachmentSize20MB);
          return;
        }

        const draftMessage = prepareFileDraftMessage(
          tempId,
          uri,
          undefined,
          userInfo.userId
        );
        addNewMessage(draftMessage);

        const fileUploadResponse = await sendFile(
          uri,
          type,
          fileName,
          host,
          userInfo.conversationId,
          config.instanceId,
          userInfo.token
        );

        const sendFileMessageResponse = await sendFileMessage(
          userInfo.conversationId,
          userInfo.token,
          fileUploadResponse.fileId
        );

        setMessages((prevState) =>
          prevState.map((message) =>
            message.id === tempId
              ? {
                  ...(sendFileMessageResponse.data.sendFile as Message),
                  time: draftMessage.time,
                  status: isStatusHigher(
                    message.status,
                    sendFileMessageResponse.data.sendFile.status
                  )
                    ? sendFileMessageResponse.data.sendFile.status
                    : message.status,
                  draft: false,
                }
              : message
          )
        );
      }
    } catch (error) {
      setMessages((prevState) =>
        prevState.map((message) =>
          message.id === tempId
            ? {
                ...message,
                error: true,
                draft: false,
              }
            : message
        )
      );
    }
  };

  const onResend = async (errorMessage: Message) => {
    const tempId = generateUUID();
    setMessages((prevState) =>
      prevState.filter((mess) => mess.id !== errorMessage.id)
    );
    if (errorMessage.payload.__typename === PayloadTypes.Text) {
      return await onSend(false, errorMessage.payload.value);
    } else if (errorMessage.payload.__typename === PayloadTypes.Button) {
      return await onSend(false, '', errorMessage.payload.buttonId);
    } else if (errorMessage.payload.__typename === PayloadTypes.File) {
      try {
        const draftMessage = prepareFileDraftMessage(
          tempId,
          errorMessage.payload.url,
          errorMessage.payload.type,
          userInfo.userId
        );
        addNewMessage(draftMessage);

        const fileUploadResponse = await sendFile(
          errorMessage.payload.url,
          errorMessage.payload.type,
          'default',
          host,
          userInfo.conversationId,
          config.instanceId,
          userInfo.token
        );

        const sendFileMessageResponse = await sendFileMessage(
          userInfo.conversationId,
          userInfo.token,
          fileUploadResponse.fileId
        );
        setMessages((prevState) =>
          prevState.map((message) =>
            message.id === tempId
              ? {
                  ...(sendFileMessageResponse.data.sendFile as Message),
                  time: draftMessage.time,
                  status: isStatusHigher(
                    message.status,
                    sendFileMessageResponse.data.sendFile.status
                  )
                    ? sendFileMessageResponse.data.sendFile.status
                    : message.status,
                  draft: false,
                }
              : message
          )
        );
      } catch (error) {
        setMessages((prevState) =>
          prevState.map((message) =>
            message.id === tempId
              ? {
                  ...message,
                  error: true,
                  draft: false,
                }
              : message
          )
        );
      }
    }
  };

  const updateMessages = () => {
    const timestamp = Date.now() + additionalMinuteInMs;
    if (userInfo.conversationId && userInfo.token) {
      getMessages(userInfo.conversationId, timestamp, userInfo.token)
        .then(({ data }) => {
          if (data?.messages.edges) {
            setMessages((prevState) => {
              const newTab = mergeMessageArrays(
                prevState,
                data?.messages.edges.map((edge) => edge.node)
              );
              return newTab;
            });
          }
        })
        .catch(() => {});
    }
  };

  const loadMoreMessages = () => {
    const lastMessageTime = messages[messages.length - 1]?.time;
    if (lastMessageTime) {
      getMessages(
        userInfo.conversationId,
        lastMessageTime || Date.now(),
        userInfo.token
      ).then(({ data }) => {
        const newMessages = data?.messages.edges;
        if (newMessages) {
          const allMessages = mergeMessageArrays(
            messages,
            newMessages.map((edge) => edge.node)
          );
          setMessages(allMessages);
        }
      });
    }
  };

  useSubscription<{ newMessage: Message }>(NEW_MESSAGE, {
    variables: {
      conversationId: userInfo.conversationId,
    },
    context: {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    },
    onData: ({ data }) => {
      const messageType = data.data?.newMessage?.payload.__typename;

      if (messageType === PayloadTypes.TypingOn) {
        setShowTyping(true);
      }

      if (messageType === PayloadTypes.TypingOff) {
        setShowTyping(false);
      }

      if (messageType && !notAllowedTypesToMessageList.includes(messageType)) {
        const message = data.data?.newMessage;
        addNewMessage(message);
        InteractionManager.runAfterInteractions(async () => {
          setShowTyping(false);
          scrollToLatest();
          /** handling text messages */
          if (messageType === PayloadTypes.Text) {
            try {
              if (message) {
                onMessage?.(message);
              }
            } catch (e) {
              console.warn('ZowieChat Error on handling new text message: ', e);
            }
          }
        });
      }
    },
  });

  useSubscription<NewStatusSubscriptionData>(NEW_STATUS_SUBSCRIPTION, {
    variables: { conversationId: userInfo.conversationId },
    onData: ({ data }) => {
      setMessages((prevState) => {
        const newMessages = [...prevState];
        if (newMessages.length > 0) {
          newMessages[0] = {
            ...newMessages[0],
            status: isStatusHigher(
              newMessages[0]?.status,
              data.data?.newStatus.status as Status
            )
              ? (data.data?.newStatus.status as Status)
              : newMessages[0]?.status,
          } as Message;
        }
        return newMessages;
      });
    },
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const isVisible = viewableItems.some((item: ViewToken) => item.index === 0);
    setIsNewestMessageVisible(isVisible);
  }, []);

  const initChat = useCallback(async () => {
    try {
      setChatInitLoading(true);

      const newUserInfo = await initializeChat(config, host, metaData);

      if (newUserInfo) {
        setUserInfo(newUserInfo as UserInfo);
      }
      setChatInitLoading(false);
    } catch (e) {
      setChatInitLoading(false);
      if (onStartChatError) {
        onStartChatError(`ZowieChat startChatError: ${e}`);
      }
    }
  }, [host, config, metaData, setUserInfo, onStartChatError]);

  useEffect(() => {
    if (isConnected) {
      if (userInfo.conversationId && userInfo.token) {
        updateMessages();
      } else {
        initChat();
      }
    } else {
      setShowTyping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  useEffect(() => {
    updateMessages();
    scrollToLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo.token, config.contextId]);

  /* Checking that user read message */
  useEffect(() => {
    if (isNewestReaded && messages[0]?.author.userId !== userInfo.userId) {
      setIsNewestReaded(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages?.length, userInfo.userId]);

  /* Mark new showed message as read by user */
  useEffect(() => {
    if (isNewestMessageVisible && !isNewestReaded) {
      debounce(async () => {
        try {
          await deliveredMessage(
            userInfo.conversationId,
            userInfo.token,
            Date.now() + additionalMinuteInMs
          );
          await readMessage(
            userInfo.conversationId,
            userInfo.token,
            Date.now() + additionalMinuteInMs
          );
          setIsNewestReaded(true);
        } catch (e) {}
      }, debounceTimeForSetNewestMessageAsReadMs)();
    }
  }, [
    isNewestMessageVisible,
    isNewestReaded,
    userInfo.conversationId,
    userInfo.token,
  ]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={
        style || [
          styles.defaultStyle,
          { backgroundColor: colors.backgroundColor },
        ]
      }
      contentContainerStyle={styles.flex1}
      keyboardVerticalOffset={
        Platform.OS === 'ios' ? iosKeyboardOffset : androidKeyboardOffset + 20
      }
    >
      {show ? (
        <VideoPlayerAndroid
          videoUrl={videoUrl}
          onPressBack={() => setShow(false)}
        />
      ) : null}
      <View style={styles.flex1}>
        <InternetConnectionBanner isConnection={!!isConnected} />
        <FlatList
          key="zowieMessageList"
          style={styles.flex1}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          inverted={messages?.length > 0}
          onEndReachedThreshold={2}
          ref={listRef}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          onEndReached={loadMoreMessages}
          data={messages}
          renderItem={({ item, index }) => (
            <MessageView
              item={item}
              style={style}
              scrollToLatest={scrollToLatest}
              isNewest={index === 0}
              prevItemTime={messages[index + 1]?.time}
              prevItemUserId={messages[index + 1]?.author.userId}
              onPressTryAgain={onResend}
              prevItem={messages[index + 1]}
              onSend={onSend}
            />
          )}
          ListHeaderComponent={
            <TextTyping show={showTyping} setShow={setShowTyping} />
          }
          ListFooterComponent={
            <TimeDate timestamp={messages[messages.length - 1]?.time} />
          }
          ListEmptyComponent={
            chatInitLoading ? (
              <ActivityIndicator
                size={'large'}
                color={colors.placeholderTextColor}
                style={styles.activityIndicator}
              />
            ) : null
          }
        />
        <ZowieLogo />
        <NewMessage
          disabled={chatInitLoading}
          value={text}
          onChangeText={onChangeText}
          onSend={onSend}
          scrollToEnd={scrollToLatest}
          onSendFileAttachment={onSendFileAttachment}
          onSendImageAttachment={onSendImageAttachment}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default memo(MainView);
