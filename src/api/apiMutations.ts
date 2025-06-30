import { type FetchResult } from '@apollo/client';
import {
  CLEAR_EXTERNAL_CONVERSATION_HISTORY,
  DELIVERED_MUTATION,
  READ_MUTATION,
  SAVE_EXTERNAL_CONVERSATION_HISTORY,
  SEND_FILE,
  SEND_REFERRAL_MUTATION,
  SET_ACTIVE,
  SET_FCM_ANDROID,
  SET_FCM_APPLE,
  SET_INACTIVE,
  SIGNIN_MUTATION,
  SIGNUP_MUTATION,
  UPDATE_METADATA,
} from '../utils/mutations';
import { client, refreshClient } from '../utils/apollo-client';
import { Platform } from 'react-native';
import type {
  ClearExternalConversationHistoryResponse,
  ClearExternalConversationHistoryVariables,
  ExternalMessageInput,
  SaveExternalConversationHistoryResponse,
  SaveExternalConversationHistoryVariables,
  TSigninResponse,
  TSignupResponse,
} from '../types/api';
import { GET_MESSAGES } from '../utils/queries';
import type {
  CustomParamInput,
  MessagesMutationResponse,
} from '../types/queries';
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ZowieConfig } from 'react-native-zowiesdk';
import { ZowieAuthenticationType } from 'react-native-zowiesdk';
import { additionalMinuteInMs, maxMessagesPerPage } from '../utils/config';
import { getData } from '../utils/referralModificator';

const appId = Platform.OS === 'ios' ? 'herochat-ios' : 'herochat-android';

export const singUp = async (
  instanceId: string
): Promise<FetchResult<TSignupResponse>> => {
  return await client.mutate({
    mutation: SIGNUP_MUTATION,
    variables: { instanceId },
  });
};

export const singIn = async (
  instanceId: string,
  password: string,
  authorId: string,
  contextId?: string
): Promise<FetchResult<TSigninResponse>> => {
  return await client.mutate({
    mutation: SIGNIN_MUTATION,
    variables: {
      instanceId,
      appId,
      authType: 'Credentials',
      password,
      authorId,
      contextId,
    },
  });
};
export const singInJwt = async (
  instanceId: string,
  authToken: string,
  authorId: string,
  contextId?: string
): Promise<FetchResult<TSigninResponse>> => {
  return await client.mutate({
    mutation: SIGNIN_MUTATION,
    variables: {
      appId,
      instanceId,
      authToken,
      authType: 'Jwt',
      authorId,
      contextId,
    },
  });
};

export const sendReferral = async (
  conversationId: string,
  token: string,
  referralId?: string
) => {
  return await client.mutate({
    mutation: SEND_REFERRAL_MUTATION,
    variables: {
      conversationId: conversationId,
      referralId: referralId || 'start',
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

export interface MetaData {
  firstName?: string;
  lastName?: string;
  name?: string;
  locale?: string;
  timeZone?: string;
  phoneNumber?: string;
  email?: string;
  customParams?: CustomParamInput[];
}

export const updateMetaData = async (
  metadata: MetaData,
  token: string,
  conversationId: string
) => {
  return await client.mutate({
    mutation: UPDATE_METADATA,
    variables: {
      conversationId,
      ...metadata,
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

export const checkChatExits = async () => {
  try {
    const token = await AsyncStorage.getItem('@token');
    return !!token;
  } catch (e) {
    return false;
  }
};

export const deleteSession = async () => {
  await AsyncStorage.removeItem('@token');
};

const continueExistChat = async (
  instanceId: string,
  host: string,
  metaData?: MetaData,
  contextId?: string | undefined,
  fcmToken?: string | undefined,
  initSaveExternalConversation?:
    | {
        externalSystemId: string;
        externalMessages: ExternalMessageInput[];
      }
    | undefined
) => {
  try {
    const userId = await AsyncStorage.getItem('@userId');
    const password = await AsyncStorage.getItem('@password');
    const responseSignin = await singIn(
      instanceId,
      password || '',
      userId || '',
      contextId
    );
    if (responseSignin.data?.signin?.errors) {
      throw responseSignin.data?.signin.errors;
    }
    if (responseSignin.data) {
      const { token, conversationId } = responseSignin.data.signin.result;
      await AsyncStorage.setItem('@userId', userId || '');
      await AsyncStorage.setItem('@password', password || '');
      await AsyncStorage.setItem('@token', token);
      await AsyncStorage.setItem('@conversationId', conversationId);
      await refreshClient(host);
      if (metaData) {
        await updateMetaData(metaData, token, conversationId);
      }
      if (fcmToken) {
        await setFcmToken(fcmToken, token, conversationId);
      }
      if (initSaveExternalConversation) {
        const { externalSystemId, externalMessages } =
          initSaveExternalConversation;
        await saveExternalConversationHistory(
          externalSystemId,
          externalMessages
        );
      }
      return { conversationId, token, password, userId };
    } else return null;
  } catch (e) {
    throw e;
  }
};

export const initializeNewChat = async (
  instanceId: string,
  host: string,
  metaData?: MetaData,
  contextId?: string | undefined,
  fcmToken?: string | undefined,
  conversationInitReferral?: string | undefined,
  initSaveExternalConversation?:
    | {
        externalSystemId: string;
        externalMessages: ExternalMessageInput[];
      }
    | undefined
) => {
  try {
    const responseSignup = await singUp(instanceId);
    if (responseSignup.data) {
      const { password, userId } = responseSignup.data.signup;

      const responseSignin = await singIn(
        instanceId,
        password,
        userId,
        contextId
      );
      if (responseSignin.data?.signin?.errors) {
        throw responseSignin.data?.signin.errors;
      }

      if (responseSignin.data) {
        const { token, conversationId } = responseSignin.data.signin.result;
        await AsyncStorage.setItem('@userId', userId);
        await AsyncStorage.setItem('@password', password);
        await AsyncStorage.setItem('@token', token);
        await AsyncStorage.setItem('@conversationId', conversationId);
        await refreshClient(host);
        const referralId = await getData('@referralId');
        if (referralId) {
          await sendReferral(conversationId, token, referralId);
        } else if (!referralId && conversationInitReferral) {
          await sendReferral(conversationId, token, conversationInitReferral);
        } else {
          await sendReferral(conversationId, token);
        }

        if (metaData) {
          await updateMetaData(metaData, token, conversationId);
        }
        if (fcmToken) {
          await setFcmToken(fcmToken, token, conversationId);
        }
        if (initSaveExternalConversation) {
          const { externalSystemId, externalMessages } =
            initSaveExternalConversation;
          await saveExternalConversationHistory(
            externalSystemId,
            externalMessages
          );
        }
        return { conversationId, token, password, userId };
      }
    }
    return null;
  } catch (e) {
    throw e;
  }
};

export const initializeJwtChat = async (
  instanceId: string,
  authToken: string,
  authorId: string,
  host: string,
  metaData?: MetaData,
  contextId?: string | undefined,
  fcmToken?: string | undefined,
  conversationInitReferral?: string | undefined,
  initSaveExternalConversation?:
    | {
        externalSystemId: string;
        externalMessages: ExternalMessageInput[];
      }
    | undefined
) => {
  try {
    const responseSignin = await singInJwt(
      instanceId,
      authToken,
      authorId,
      contextId
    );
    if (responseSignin.data?.signin?.errors) {
      throw responseSignin.data?.signin.errors;
    }
    if (responseSignin.data) {
      const { token, conversationId } = responseSignin.data.signin.result;
      await AsyncStorage.setItem('@userId', authorId);
      await AsyncStorage.setItem('@token', token);
      await AsyncStorage.setItem('@conversationId', conversationId);

      await refreshClient(host);
      const timestamp = Date.now() + additionalMinuteInMs;
      const response = await getMessages(conversationId, timestamp, token);
      const isChatEmpty = response.data?.messages.edges.length === 0;
      if (isChatEmpty) {
        const referralId = await getData('@referralId');
        if (referralId) {
          await sendReferral(conversationId, token, referralId);
        } else if (!referralId && conversationInitReferral) {
          await sendReferral(conversationId, token, conversationInitReferral);
        } else {
          await sendReferral(conversationId, token);
        }
      }
      if (metaData) {
        await updateMetaData(metaData, token, conversationId);
      }
      if (fcmToken) {
        await setFcmToken(fcmToken, token, conversationId);
      }
      if (initSaveExternalConversation) {
        const { externalSystemId, externalMessages } =
          initSaveExternalConversation;
        await saveExternalConversationHistory(
          externalSystemId,
          externalMessages
        );
      }
      return { conversationId, token, password: '', userId: authorId };
    } else {
      return null;
    }
  } catch (e) {
    throw e;
  }
};

export const initializeChat = async (
  config: ZowieConfig,
  host: string,
  metaData?: MetaData
) => {
  const isChatExist = await checkChatExits();
  if (
    config.authenticationType === ZowieAuthenticationType.JwtToken &&
    config.authorId &&
    config.jwt
  ) {
    return await initializeJwtChat(
      config.instanceId,
      config.jwt,
      config.authorId,
      host,
      metaData,
      config.contextId,
      config.fcmToken,
      config.conversationInitReferral,
      config.initSaveExternalConversation
    );
  } else if (isChatExist) {
    return await continueExistChat(
      config.instanceId,
      host,
      metaData,
      config.contextId,
      config.fcmToken,
      config.initSaveExternalConversation
    );
  } else {
    return await initializeNewChat(
      config.instanceId,
      host,
      metaData,
      config.contextId,
      config.fcmToken,
      config.conversationInitReferral,
      config.initSaveExternalConversation
    );
  }
};

export const getMessages = async (
  conversationId: string,
  offset: number,
  token: string
): Promise<FetchResult<MessagesMutationResponse>> => {
  return await client.query({
    query: GET_MESSAGES,
    variables: {
      conversationId,
      offset,
      entriesPerPage: maxMessagesPerPage,
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

export const readMessage = async (
  conversationId: string,
  token: string,
  time: number
) => {
  return await client.mutate({
    mutation: READ_MUTATION,
    variables: {
      conversationId,
      time,
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

export const deliveredMessage = async (
  conversationId: string,
  token: string,
  time: number
) => {
  return await client.mutate({
    mutation: DELIVERED_MUTATION,
    variables: {
      conversationId,
      time,
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

export const sendFileMessage = async (
  conversationId: string,
  token: string,
  fileId: number
) => {
  return await client.mutate({
    mutation: SEND_FILE,
    variables: {
      conversationId,
      fileId,
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

export const sendActive = async (isActive: boolean) => {
  try {
    const token = await AsyncStorage.getItem('@token');
    const conversationId = await AsyncStorage.getItem('@conversationId');
    if (token && conversationId) {
      const response = isActive
        ? await client.mutate({
            mutation: SET_ACTIVE,
            variables: {
              conversationId,
              tabActivity: isActive,
            },
            context: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          })
        : await client.mutate({
            mutation: SET_INACTIVE,
            variables: {
              conversationId,
            },
            context: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          });
      return response;
    } else {
      throw `No token or conversationId, try first inint chat or clear session`;
    }
  } catch (e) {
    throw `ZowieChat setActive method error: ${e}`;
  }
};

export const setFcmToken = async (
  fcmToken: string,
  token: string,
  conversationId: string
) => {
  const isAndroid = Platform.OS === 'android';
  try {
    const response = await client.mutate({
      mutation: isAndroid ? SET_FCM_ANDROID : SET_FCM_APPLE,
      variables: {
        conversationId,
        deviceId: fcmToken,
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (response?.data?.enableAppleViaFcmNotifications?.errors) {
      throw `FCM token error [${response.data?.enableAppleViaFcmNotifications?.errors}]`;
    } else if (response?.data?.enableAndroidViaFcmNotifications?.errors) {
      throw `FCM token error [${response.data?.enableAndroidViaFcmNotifications?.errors}]`;
    } else return response;
  } catch (e) {
    throw `FCM token error [${e}]`;
  }
};

export const saveExternalConversationHistory = async (
  externalSystemId: string,
  externalMessages: ExternalMessageInput[]
): Promise<
  SaveExternalConversationHistoryResponse['saveExternalConversationHistory']
> => {
  try {
    const token = await AsyncStorage.getItem('@token');
    const conversationId = await AsyncStorage.getItem('@conversationId');

    if (!token || !conversationId) {
      throw new Error(
        `ZowieChat No token or conversationId, try first init chat or clear session`
      );
    }

    const { data } = await client.mutate<
      SaveExternalConversationHistoryResponse,
      SaveExternalConversationHistoryVariables
    >({
      mutation: SAVE_EXTERNAL_CONVERSATION_HISTORY,
      variables: {
        conversationId,
        externalSystemId,
        externalMessages,
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      fetchPolicy: 'no-cache',
    });

    if (!data) {
      throw new Error(' ZowieChat No data returned from mutation');
    }

    return data.saveExternalConversationHistory;
  } catch (e) {
    throw new Error(`ZowieChat saveExternalConversationHistory error: ${e}`);
  }
};

export const clearExternalConversationHistory = async (
  externalSystemId: string
): Promise<
  ClearExternalConversationHistoryResponse['clearExternalConversationHistory']
> => {
  try {
    const token = await AsyncStorage.getItem('@token');
    const conversationId = await AsyncStorage.getItem('@conversationId');

    if (!token || !conversationId) {
      throw new Error(
        `ZowieChat No token or conversationId, try first init chat or clear session`
      );
    } else {
      const { data } = await client.mutate<
        ClearExternalConversationHistoryResponse,
        ClearExternalConversationHistoryVariables
      >({
        mutation: CLEAR_EXTERNAL_CONVERSATION_HISTORY,
        variables: {
          externalSystemId,
          conversationId,
        },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        fetchPolicy: 'no-cache',
      });

      if (!data) {
        throw new Error('ZowieChat No data returned from mutation');
      }

      return data.clearExternalConversationHistory;
    }
  } catch (e) {
    throw new Error(`ZowieChat clearExternalConversationHistory error: ${e}`);
  }
};
