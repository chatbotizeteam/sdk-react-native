import { gql } from '@apollo/client';

export const SIGNUP_MUTATION = gql`
  mutation Signup($instanceId: String!) {
    signup(instanceId: $instanceId) {
      instanceId
      userId
      password
    }
  }
`;

export const SIGNIN_MUTATION = gql`
  mutation Signin(
    $instanceId: String!
    $appId: String!
    $authorId: String!
    $authType: AuthType!
    $authToken: String
    $password: String
    $contextId: String
  ) {
    signin(
      instanceId: $instanceId
      appId: $appId
      authorId: $authorId
      authType: $authType
      authToken: $authToken
      password: $password
      contextId: $contextId
    ) {
      result {
        token
        conversationId
        sendReferral
      }
      errors
    }
  }
`;

export const SEND_REFERRAL_MUTATION = gql`
  mutation SendReferral($conversationId: String!, $referralId: String!) {
    sendReferral(conversationId: $conversationId, referralId: $referralId) {
      id
      author {
        userId
      }
      time
      payload {
        ... on Referral {
          referralId
        }
      }
      status
      userInput
    }
  }
`;

export const SEND_TEXT_MUTATION = gql`
  mutation SendText($conversationId: String!, $text: String!) {
    sendText(conversationId: $conversationId, text: $text) {
      id
      author {
        userId
      }
      time
      payload {
        ... on Text {
          value
        }
      }
      status
      userInput
    }
  }
`;

export const SEND_BUTTON_MUTATION = gql`
  mutation SendButtonMutation($conversationId: String!, $buttonId: String!) {
    sendButton(conversationId: $conversationId, buttonId: $buttonId) {
      id
      author {
        userId
      }
      time
      payload {
        ... on Button {
          buttonId
        }
      }
      status
    }
  }
`;

export const UPDATE_METADATA = gql`
  mutation UpdateMetadata(
    $conversationId: String!
    $firstName: String
    $lastName: String
    $name: String
    $phoneNumber: String
    $email: String
    $customParams: [CustomParamInput!]
    $locale: String
    $timeZone: String
  ) {
    metadata(
      conversationId: $conversationId
      firstName: $firstName
      lastName: $lastName
      name: $name
      phoneNumber: $phoneNumber
      email: $email
      customParams: $customParams
      locale: $locale
      timeZone: $timeZone
    ) {
      errors
    }
  }
`;

export const READ_MUTATION = gql`
  mutation Read($time: Long!, $conversationId: String!) {
    read(time: $time, conversationId: $conversationId)
  }
`;

export const DELIVERED_MUTATION = gql`
  mutation Delivered($time: Long!, $conversationId: String!) {
    delivered(time: $time, conversationId: $conversationId)
  }
`;

export const UPDATE_MESSAGE_PREVIEW = gql`
  mutation UpdateMessagePreview(
    $conversationId: String!
    $previewText: String!
  ) {
    updateMessagePreview(
      conversationId: $conversationId
      previewText: $previewText
    )
  }
`;

export const SEND_FILE = gql`
  mutation SendFile($conversationId: String!, $fileId: String!) {
    sendFile(conversationId: $conversationId, fileId: $fileId) {
      author {
        userId
        metadata {
          firstName
          lastName
          profilePictureUrl
        }
        instanceId
      }
      time
      id
      status
      payload {
        ... on File {
          fileId
          url
          type
          dimensions {
            height
            width
          }
        }
      }
    }
  }
`;

export const SET_ACTIVE = gql`
  mutation Active($conversationId: String!, $tabActivity: Boolean) {
    active(conversationId: $conversationId, tabActivity: $tabActivity) {
      errors
    }
  }
`;

export const SET_INACTIVE = gql`
  mutation Inactive($conversationId: String!) {
    inactive(conversationId: $conversationId) {
      errors
    }
  }
`;

export const SET_FCM_APPLE = gql`
  mutation EnableAppleViaFcmNotifications(
    $conversationId: String!
    $deviceId: String!
  ) {
    enableAppleViaFcmNotifications(
      conversationId: $conversationId
      deviceId: $deviceId
    ) {
      errors
    }
  }
`;

export const SET_FCM_ANDROID = gql`
  mutation EnableAndroidViaFcmNotifications(
    $conversationId: String!
    $deviceId: String!
  ) {
    enableAndroidViaFcmNotifications(
      conversationId: $conversationId
      deviceId: $deviceId
    ) {
      errors
    }
  }
`;

export const SAVE_EXTERNAL_CONVERSATION_HISTORY = gql`
  mutation SaveExternalConversationHistory(
    $externalSystemId: String!
    $conversationId: String!
    $externalMessages: [ExternalMessageInput!]!
  ) {
    saveExternalConversationHistory(
      externalSystemId: $externalSystemId
      conversationId: $conversationId
      externalMessages: $externalMessages
    ) {
      result
      errors
    }
  }
`;

export const CLEAR_EXTERNAL_CONVERSATION_HISTORY = gql`
  mutation ClearExternalConversationHistory(
    $externalSystemId: String!
    $conversationId: String!
  ) {
    clearExternalConversationHistory(
      externalSystemId: $externalSystemId
      conversationId: $conversationId
    ) {
      result
      errors
    }
  }
`;
