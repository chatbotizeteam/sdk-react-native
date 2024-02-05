import React, { memo, useCallback } from 'react';
import type { Message } from '../../types/queries';
import { PayloadTypes } from '../../types/queries';
import { TextMessage } from '../TextMessage';
import { useUserInfo } from '../../hooks/userInfo';
import ImageTemplate from '../ImageTemplateMessage';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import QuickButtonsTemplateMessage from '../QuickButtonsTemplateMessage';
import UrlButtonTemplateMessage from '../UrlButtonTemplateMessage';
import VideoTemplateMessage from '../VideoTemplateMessage';
import PersistentButtonsTemplateMessage from '../PersistentButtonsTemplateMessage';
import CarouselTemplateMessage from '../CarouselTemplateMessage';
import FileMessage from '../FileMessage';
import CallButtonTemplateMessage from '../CallButtonTemplateMessage';
import { isSameDay } from '../../utils/functions';
import TimeDate from '../TimeDate';

interface Props {
  item: Message;
  style?: ViewStyle;
  isNewest: boolean;
  scrollToLatest: () => void;
  prevItemTime: number | undefined;
}
const MessageItem = ({
  item,
  style,
  isNewest,
  scrollToLatest,
  prevItemTime,
}: Props) => {
  const { userInfo } = useUserInfo();
  const isUser = userInfo.userId === item.author.userId;
  const getMessageComponent = useCallback(() => {
    switch (item.payload.__typename) {
      case PayloadTypes.Text:
        return (
          <TextMessage
            text={item.payload.value}
            isUser={isUser}
            status={item.status}
            isNewest={isNewest}
            time={item.time}
          />
        );
      case PayloadTypes.ImageTemplate:
        return (
          <ImageTemplate isUser={isUser} payload={item.payload} style={style} />
        );
      case PayloadTypes.QuickButtonsTemplate:
        return (
          <QuickButtonsTemplateMessage
            payload={item.payload}
            time={item.time}
            scrollToLatest={scrollToLatest}
            isNewest={isNewest}
          />
        );
      case PayloadTypes.UrlButtonTemplate:
        return (
          <UrlButtonTemplateMessage time={item.time} payload={item.payload} />
        );
      case 'VideoTemplate':
        return (
          <VideoTemplateMessage
            payload={item.payload}
            isUser={isUser}
            style={style}
          />
        );
      case PayloadTypes.PersistentButtonsTemplate:
        return <PersistentButtonsTemplateMessage payload={item.payload} />;
      case PayloadTypes.CarouselTemplate:
        return <CarouselTemplateMessage payload={item.payload} style={style} />;
      case PayloadTypes.File:
        return <FileMessage payload={item.payload} isUser={isUser} />;
      case PayloadTypes.CallButtonTemplate:
        return (
          <CallButtonTemplateMessage time={item.time} payload={item.payload} />
        );
      default:
        return null;
    }
  }, [
    item.payload,
    item.status,
    item.time,
    isUser,
    isNewest,
    style,
    scrollToLatest,
  ]);

  return (
    <View>
      {!isSameDay(item.time, prevItemTime) && (
        <TimeDate timestamp={item.time} />
      )}
      {getMessageComponent()}
    </View>
  );
};

export default memo(MessageItem);
