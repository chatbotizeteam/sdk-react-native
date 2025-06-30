export interface TSignupResponse {
  signup: {
    __typename: string;
    instanceId: string;
    password: string;
    userId: string;
  };
}

export interface TSigninResponse {
  signin: {
    result: Result;
    errors: any;
  };
}

export interface Result {
  token: string;
  conversationId: string;
  sendReferral: boolean;
}

export interface SaveExternalConversationHistoryVariables {
  externalSystemId: string;
  conversationId: string;
  externalMessages: ExternalMessageInput[];
}

export interface ExternalMessageInput {
  messageId: string;
  time: number;
  author: AuthorInput;
  payload: MessagePayloadInput;
}

export enum AuthorType {
  Bot = 'Bot',
  User = 'User',
  Agent = 'Agent',
  System = 'System',
}

export interface AuthorInput {
  type: AuthorType;
  authorId?: string;
  name?: string;
}

export interface MessagePayloadInput {
  text?: string;
  url?: string;
  filename?: string;
  additionalParams: KeyValueInput[];
}

export interface KeyValueInput {
  key: string;
  value: string;
}

export interface SaveExternalConversationHistoryResponse {
  saveExternalConversationHistory: {
    result: string;
    error?: string | null;
  };
}

export interface ClearExternalConversationHistoryVariables {
  externalSystemId: string;
  conversationId: string;
}

export interface ClearExternalConversationHistoryResponse {
  clearExternalConversationHistory: {
    result: string;
    error?: string | null;
  };
}

export interface GetConversationHistoryVariables {
  offset: number;
  entriesPerPage: number;
  conversationId: string;
}

export interface GetExternalConversationHistoryVariables
  extends GetConversationHistoryVariables {
  externalSystemId: string;
}
export interface ConversationHistoryMessage {
  messageId: string;
  time: number;
  author: {
    type: 'BOT' | 'USER' | 'AGENT' | 'SYSTEM';
    authorId?: string;
    name?: string;
  };
  payload: {
    __typename: 'TextMessage' | 'FileMessage' | 'CustomMessage';
    text?: string;
    url?: string;
    filename?: string;
    additionalParams: {
      key: string;
      value: string;
    }[];
  };
}

export interface ConversationHistoryResponse {
  messages: ConversationHistoryMessage[];
  currentOffset: number;
  nextOffset?: number;
}

export interface GetExternalConversationHistoryResponse {
  getExternalConversationHistory: ConversationHistoryResponse;
}

export interface GetZowieConversationHistoryResponse {
  getZowieConversationHistory: ConversationHistoryResponse;
}
