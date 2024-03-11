# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0]

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
