# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-06-30

### Added
- 4 new functions for converse status management ```getExternalConversationHistory``` ```getZowieConversationHistory``` ```clearExternalConversationHistory``` ```saveExternalConversationHistory```
- New optional props ```onNewTextMessage``` for handling all text messages coming in while the component is running.
- New optional property ```initSaveExternalConversation``` in object ```ZowieConfig``` to support automation ```saveExternalConversationHistory```

## [2.0.4] - 2025-06-10

### Fixed
- Problem with ios build when react-native new architecture is on https://github.com/chatbotizeteam/sdk-react-native/issues/7

## [2.0.3] - 2025-03-26

### Changed
- Portrait images in carusel show up in full

### Fixed
- Default onPressLink support no longer causes errors


## [2.0.2] - 2025-03-03

### Added
- New optional props ```onPressLink``` for handling all links in library without file and phone call buttons

## [2.0.1] - 2025-02-25

### Fixed
- Adjusting buttons in carusel view
- Improved deeplink support

## [2.0.0] - 2025-02-17

### Added
- New additional function setReferral
- ZowieConfig object have new property ```conversationInitReferral```

### Changed
- Remove parameters from cleanSession function. New session will be using props from ZowieChat component.
- Announcement message handling macro links. ```[click here](https://github.com/)``` will be displayed as [click here](https://github.com/)

### Fixed
- Send QuickButton - from now press button sending sendButton with button id instead of sendText.


## [1.1.1] - 2024-03-15

### Changed
- Expandable input of a new message (max 4 lines)

### Fixed
- Keyboard - submit should be replaced with 'newline' button, and kept opened
- Send button caption is not saved in conversation history after click
- Retrials of attachments
- Email address domain is interpreted as URL

## [1.1.0] - 2024-03-12

### Added

- ZowieConfig have new optional attribute ```fcmToken``` to set up FCM token
- ZowieConfig have new optional attribute ```contextId``` to set the context of the cha
- Props ```translations``` to set custom translations for component texts
- Props ```onStartChatError``` that returns information about chat initialization errors
- Props ```theme``` to set a few additional message and quick buttons styles
- Support for "Announcement" messages
- Keeping the user activity

### Changed
- Update readme.md with description of new features and initialization errors in Troubleshooting
- New optional colors in theme with default values:
```
  messageErrorColor: '#EB5249'
  announcementTextColor: '#666666'
  announcementBackgroundColor: 'transparent'
  announcementBorderColor: '#f2f2f2'
```
- Enabling import of new types: Colors, MetaData, Translations, Theme
- clearSession function have now new optional arguments: ```metaData?: MetaData, contextId?: string, fcmToken?: string```


### Fixed

- Apollo warnings after component mount
- Warning when CarouselTemplate shows
- Message preview still visible after sending message
- MetaData passing problem

## [1.0.1] - 2024-02-22

### Added

- Attachment handling
- Monitoring and displaying information about the status of the Internet connection
- Support for resending error messages
- This CHANGELOG

### Changed

- New required theme property ```messageErrorColor``` with default value: ```'#EB5249'```
- Updated README.md documentation with additional required post-install steps for iOS  ```pod install``` and add ```NSPhotoLibraryUsageDescription``` key to your ```Info.plist```.

### Fixed

- Handling potential problems with interpretation of property hitSlop for iOS
- Problem with ```Changing onViewableItems on the fly is not supported``` in ```markNewMessageAsRead```
- Draft messages order

## [0.1.8] - 2024-02-05

### Added
- Init repo
