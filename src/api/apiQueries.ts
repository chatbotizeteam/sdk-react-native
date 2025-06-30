import type {
  GetConversationHistoryVariables,
  GetExternalConversationHistoryResponse,
  GetExternalConversationHistoryVariables,
  GetZowieConversationHistoryResponse,
} from '../types/api';
import { client } from '../utils/apollo-client';
import {
  GET_EXTERNAL_CONVERSATION_HISTORY,
  GET_ZOWIE_CONVERSATION_HISTORY,
} from '../utils/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getExternalConversationHistory = async (
  variables: Omit<GetExternalConversationHistoryVariables, 'conversationId'>
): Promise<
  GetExternalConversationHistoryResponse['getExternalConversationHistory']
> => {
  try {
    const token = await AsyncStorage.getItem('@token');
    const conversationId = await AsyncStorage.getItem('@conversationId');

    if (!token || !conversationId) {
      throw new Error('Token or conversationId not found in AsyncStorage');
    }

    const { data } = await client.query<
      GetExternalConversationHistoryResponse,
      GetExternalConversationHistoryVariables
    >({
      query: GET_EXTERNAL_CONVERSATION_HISTORY,
      variables: {
        ...variables,
        conversationId,
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      fetchPolicy: 'no-cache',
    });

    if (!data) throw new Error('ZowieChat No data returned');
    return data.getExternalConversationHistory;
  } catch (e) {
    throw new Error(`ZowieChat getExternalConversationHistory failed: ${e}`);
  }
};

export const getZowieConversationHistory = async (
  variables: Omit<GetConversationHistoryVariables, 'conversationId'>
): Promise<
  GetZowieConversationHistoryResponse['getZowieConversationHistory']
> => {
  try {
    const token = await AsyncStorage.getItem('@token');
    const conversationId = await AsyncStorage.getItem('@conversationId');

    if (!token || !conversationId) {
      throw new Error('Token or conversationId not found in AsyncStorage');
    }

    const { data } = await client.query<
      GetZowieConversationHistoryResponse,
      GetConversationHistoryVariables
    >({
      query: GET_ZOWIE_CONVERSATION_HISTORY,
      variables: {
        ...variables,
        conversationId,
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      fetchPolicy: 'no-cache',
    });

    if (!data) throw new Error('ZowieChat No data returned');
    return data.getZowieConversationHistory;
  } catch (e) {
    throw new Error(`ZowieChat getZowieConversationHistory failed: ${e}`);
  }
};
