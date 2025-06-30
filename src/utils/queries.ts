import { gql } from '@apollo/client';

export const GET_MESSAGES = gql`
  query GetMessages(
    $conversationId: String!
    $offset: Long!
    $entriesPerPage: Int!
  ) {
    messages(
      conversationId: $conversationId
      offset: $offset
      entriesPerPage: $entriesPerPage
    ) {
      edges {
        node {
          id
          author {
            instanceId
            appId
            userId
            metadata {
              instanceId
              appId
              userId
              firstName
              lastName
              profilePictureUrl
            }
          }
          time
          sequence
          payload {
            ... on Text {
              value
            }
            ... on File {
              fileId
              url
              type
              dimensions {
                width
                height
              }
            }
            ... on Button {
              buttonId
            }
            ... on Referral {
              referralId
            }
            ... on Location {
              latitude
              longitude
            }
            ... on UrlButtonTemplate {
              message
              caption
              url
            }
            ... on CallButtonTemplate {
              message
              caption
              phoneNumber
            }
            ... on LocationTemplate {
              message
            }
            ... on QuickButtonsTemplate {
              message
              buttons {
                caption
                buttonId
              }
            }
            ... on PersistentButtonsTemplate {
              message
              buttons {
                ... on ActionButtonDefault {
                  caption
                  buttonId
                }
                ... on ActionButtonUrl {
                  caption
                  url
                }
                ... on ActionButtonCall {
                  caption
                  phoneNumber
                }
              }
            }
            ... on CarouselTemplate {
              elements {
                title
                subtitle
                imageUrl
                defaultAction {
                  ... on DefaultActionUrl {
                    value
                  }
                  ... on DefaultActionReferral {
                    value
                  }
                }
                buttons {
                  ... on ActionButtonDefault {
                    caption
                    buttonId
                  }
                  ... on ActionButtonUrl {
                    caption
                    url
                  }
                  ... on ActionButtonCall {
                    caption
                    phoneNumber
                  }
                }
              }
              ratio
            }
            ... on ImageTemplate {
              url
              buttons {
                ... on ActionButtonDefault {
                  caption
                  buttonId
                }
                ... on ActionButtonUrl {
                  caption
                  url
                }
                ... on ActionButtonCall {
                  caption
                  phoneNumber
                }
              }
              dimensions {
                width
                height
              }
            }
            ... on VideoTemplate {
              url
              buttons {
                ... on ActionButtonDefault {
                  caption
                  buttonId
                }
                ... on ActionButtonUrl {
                  caption
                  url
                }
                ... on ActionButtonCall {
                  caption
                  phoneNumber
                }
              }
            }
            ... on AudioTemplate {
              url
              buttons {
                ... on ActionButtonDefault {
                  caption
                  buttonId
                }
                ... on ActionButtonUrl {
                  caption
                  url
                }
                ... on ActionButtonCall {
                  caption
                  phoneNumber
                }
              }
            }
            ... on Announcement {
              text
              visibility
            }
            ... on TypingOn {
              placeholder
            }
            ... on TypingOff {
              placeholder
            }
          }
          status
          userInput
        }
      }
      prev
      next
    }
  }
`;

export const GET_EXTERNAL_CONVERSATION_HISTORY = gql`
  query GetExternalConversationHistory(
    $externalSystemId: String!
    $conversationId: String!
    $offset: Long!
    $entriesPerPage: Int!
  ) {
    getExternalConversationHistory(
      externalSystemId: $externalSystemId
      conversationId: $conversationId
      offset: $offset
      entriesPerPage: $entriesPerPage
    ) {
      messages {
        messageId
        time
        author {
          type
          authorId
          name
        }
        payload {
          ... on TextMessage {
            text
          }
          ... on FileMessage {
            url
            filename
          }
          ... on CustomMessage {
            additionalParams {
              key
              value
            }
          }
        }
      }
      currentOffset
      nextOffset
    }
  }
`;

export const GET_ZOWIE_CONVERSATION_HISTORY = gql`
  query GetZowieConversationHistory(
    $conversationId: String!
    $offset: Long!
    $entriesPerPage: Int!
  ) {
    getZowieConversationHistory(
      conversationId: $conversationId
      offset: $offset
      entriesPerPage: $entriesPerPage
    ) {
      messages {
        messageId
        time
        author {
          type
          authorId
          name
        }
        payload {
          ... on TextMessage {
            text
          }
          ... on FileMessage {
            url
            filename
          }
          ... on CustomMessage {
            additionalParams {
              key
              value
            }
          }
        }
      }
      currentOffset
      nextOffset
    }
  }
`;
