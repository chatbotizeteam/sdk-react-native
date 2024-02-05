import React, { memo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { QuickButtonsTemplatePayload } from '../../types/queries';
import { TextMessage } from '../TextMessage';
import { useMutation } from '@apollo/client';
import { SEND_TEXT_MUTATION } from '../../utils/mutations';
import { useUserInfo } from '../../hooks/userInfo';
import styles from './styles';
import { useColors } from '../../hooks/colors';
interface Props {
  payload: QuickButtonsTemplatePayload;
  scrollToLatest: () => void;
  isNewest: boolean;
  time: number;
}

const QuickButtonsTemplateMessage = ({
  payload,
  scrollToLatest,
  isNewest,
  time,
}: Props) => {
  const { userInfo } = useUserInfo();
  const { colors } = useColors();

  const [sendText] = useMutation(SEND_TEXT_MUTATION);

  const onSend = async (text: string) => {
    await sendText({
      variables: {
        conversationId: userInfo.conversationId,
        text,
      },
      context: {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      },
    });
    scrollToLatest();
  };
  return (
    <View style={styles.container}>
      <TextMessage time={time} text={payload.message} isUser={false} />
      {isNewest && (
        <ScrollView
          horizontal={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {payload.buttons.map((btn) => (
            <TouchableOpacity
              key={btn.buttonId}
              style={[
                styles.button,
                {
                  backgroundColor: colors.quickButtonBackgroundColor,
                },
              ]}
              onPress={async () => await onSend(btn.caption)}
            >
              <Text
                style={[styles.text, { color: colors.quickButtonTextColor }]}
              >
                {btn.caption}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default memo(QuickButtonsTemplateMessage);
