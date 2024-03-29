import { gql } from '@apollo/client';

export const NEW_MESSAGE = gql`
  subscription NewMessage($conversationId: String!) {
    newMessage(conversationId: $conversationId) {
      id
      author {
        userId
        metadata {
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
`;

export const NEW_STATUS_SUBSCRIPTION = gql`
  subscription NewStatus($conversationId: String!) {
    newStatus(conversationId: $conversationId) {
      id
      author {
        userId
      }
      time
      offset
      status
    }
  }
`;
