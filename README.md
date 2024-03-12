# react-native-zowiesdk

## Overview
ZowieChat is a React Native component designed to integrate a chat interface into your application. It uses Apollo Client for data management and provides a customizable UI, with support for handling keyboard offsets on both iOS and Android devices. The component is structured to use several hooks and providers to manage colors, user information, and video functionalities.
The component is not supported by expo.

## Installation
Before you can use ZowieChat, ensure you have installed AsyncStorage in your project. Then, install the required dependencies:
```sh
npm install @react-native-async-storage/async-storage
```
```sh
npm install react-native-zowiesdk
```
### iOS
```sh
npx pod-install
```

## Post-install Steps

### iOS
The requirement is to add ```NSPhotoLibraryUsageDescription``` key to your ```Info.plist``` for attachments handling.

## Usage
```js
import { ZowieChat,ZowieAuthenticationType, ZowieConfig } from 'react-native-zowiesdk';


const myConfigAnonymous: ZowieConfig = {
  instanceId: 'your_instance_id',
  authenticationType: ZowieAuthenticationType.Anonymous
}

<ZowieChat
  host="example.chat.getzowie.com/api/v1/core"
  config={myConfigAnonymous}
  style={customStyle}
  iosKeyboardOffset={20}
  androidKeyboardOffset={20}
  customColors={yourCustomColors}
  metaData={yourMetaData}
  theme={customButtonsTheme}
  onStartChatError={(error) => {console.log(error)}}
/>
```
or you can use JWT authorization
```ts
const myConfigJwt: ZowieConfig = {
  instanceId: 'your_instance_id',
  authenticationType: ZowieAuthenticationType.JwtToken,
  authorId: 'your_author_id',
  jwt: 'your_token',
}
```
## Props
- **host** (string): Your host url address ```example.chat.getzowie.com/api/v1/core```
- **config** (ZowieConfig): Cofiguration from your account.
- **style** (ViewStyle, optional): Custom styles for the chat component.
- **iosKeyboardOffset** (number, optional): Offset value to adjust the keyboard on iOS devices. Default is 0.
- **androidKeyboardOffset** (number, optional): Offset value to adjust the keyboard on Android devices. Default is 0.
- **customColors** (Colors, optional): Custom color scheme for the chat UI.
- **metaData** (MetaData, optional): Additional metadata to be used within the chat.
- **translations** (Translations, optional): Custom translations of texts used in the component (default EN)
- **onStartChatError** ((error: string) => void, optional): A function that is called when there is an error during the initialization of an existing or new chat session.
The error argument is a string describing the nature of the error encountered. More info in Troubleshooting
- **theme** (Theme, optional): A few additional styles for messages and quick buttons

### ZowieConfig Type
```ts
interface ZowieConfig {
  authenticationType: ZowieAuthenticationType;
  instanceId: string;
  jwt?: string;
  authorId?: string;
  contextId?: string;
  fcmToken?: string;
}
```

### ZowieAuthenticationType
```ts
export enum ZowieAuthenticationType {
  Anonymous = 'Anonymous',
  JwtToken = 'JwtToken'
}
```

### Default chat UI colors
```js
const defaultColors: Colors = {
  incomingMessageBackgroundColor: '#F2F2F2',
  incomingMessagePrimaryTextColor: '#333333',
  incomingMessageSecondaryTextColor: '#666666',
  incomingMessageLinksColor: '#1473E6',
  userMessagePrimaryTextColor: '#FFFFFF',
  userMessageBackgroundColor: '#403AEE',
  backgroundColor: '#FFFFFF',
  newMessageTextColor: '#333333',
  sendTextButtonColor: '#403AEE',
  sendTextButtonDisabledColor: '#999999',
  separatorColor: '#EBEBEB',
  quickButtonBackgroundColor: '#d6b6fb4d',
  quickButtonTextColor: '#403AEE',
  zowieLogoButtonBackgroundColor: '#FFFFFF',
  typingAnimationColor: '#999999',
  typingAnimationBackgroundColor: '#F2F2F2',
  urlTemplateButtonBackgroundColor: '#FFFFFF',
  urlTemplateButtonTextColor: '#403AEE',
  actionButtonTextColor: '#403AEE',
  actionButtonBackgroundColor: '#FFFFFF',
  placeholderTextColor: '#999999',
  messageErrorColor: '#EB5249',
  announcementTextColor: '#666666',
  announcementBackgroundColor: 'transparent',
  announcementBorderColor: '#f2f2f2',
};
```

### MetaData type
```ts
interface MetaData {
  firstName?: string;
  lastName?: string;
  name?: string;
  locale?: string;
  timeZone?: string;
  phoneNumber?: string;
  email?: string;
  customParams?: CustomParamInput[];
};

interface CustomParamInput {
  name: string;
  value: string;
};
```

### Theme type
```ts
export type Theme = {
  messageRadius?: number | undefined;
  quickButtonRadius?: number | undefined;
  quickButtonBorderWidth?: number | undefined;
  quickButtonBorderColor?: ColorValue | undefined;

  sendButtonImg?: ImageSourcePropType | undefined;
  sendButtonImgWidth?: number | undefined;
  sendButtonImgHeight?: number | undefined;
  sendButtonImgTintColor?: ColorValue | undefined;

  galleryButtonImg?: ImageSourcePropType | undefined;
  galleryButtonImgWidth?: number | undefined;
  galleryButtonImgHeight?: number | undefined;
  galleryButtonImgTintColor?: ColorValue | undefined;

  fileButtonImg?: ImageSourcePropType | undefined;
  fileButtonImgWidth?: number | undefined;
  fileButtonImgHeight?: number | undefined;
  fileButtonImgTintColor?: ColorValue | undefined;
};
```

### Translations type and default values
```ts
export type Translations = {
  problemWithSendMessage: string;
  tryAgainSendMessage: string;
  attachment: string;
  downloadAttachment: string;
  internetConnectionLost: string;
  internetConnectionRestored: string;
  newMessagePlaceHolder: string;
  videoPlayerAndroidBack: string;
  maxAttachmentSize20MB: string;
  sent: string;
  delivered: string;
  read: string;
};

const defaultTexts = {
  problemWithSendMessage: 'We couldn’t sent your message.',
  tryAgainSendMessage: 'Try again',
  attachment: 'Attachment',
  downloadAttachment: 'Download attachment',
  internetConnectionLost: 'We couldn’t connect to our servers',
  internetConnectionRestored: 'Connection restored',
  newMessagePlaceHolder: 'Your message...',
  videoPlayerAndroidBack: 'Back',
  maxAttachmentSize20MB: 'Maximum file size 20MB',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
};
```


## Additional Functions
### clearSession(instanceId: string, host: string, metaData?: MetaData, contextId?: string, fcmToken?: string)
This function allows you to reset anonymous chat session. Should be called before mount chat component.
```js
import { clearSession } from './react-native-zowiesdk';

await clearSession(instanceId, host);
```

## Troubleshooting

### Description of possible errors returned by the _onStartChatError_ props
  1. ```FCM token error [some description]``` - probably not the correct value of fcm token
  2. ```InvalidCredentials``` - some of the authorization values in config props (such as: authorId, instanceId, jwt) are not correct
  3. ```ApolloError: Response not successful: Received status code 404``` - probably host props is not correct

### When keyboard is visable then input is under keyboard

There are several cases in which this behavior may occur
1. You are using a header with react-navigation (mainly an android problem), you should then in the props androidKeyboardOffset pass the height of the header


```js
import { ZowieChat } from 'react-native-zowiesdk';
import {useHeaderHeight} from '@react-navigation/elements';

export const Home = () => {
  const hh = useHeaderHeight();

  return (
    <SafeAreaView style={styles.container}>
      <ZowieChat
        host="example.chat.getzowie.com/api/v1/core"
        config={myConfigAnonymous}
        androidKeyboardOffset={hh}
      />
    </SafeAreaView>
  );
};
```
2. You are using flex: 1 and SafeArenaView (mainly an ios problem), you should then pass the height of safeArenaInstents in the iosKeyboardOffset props
```js
import { ZowieChat } from 'react-native-zowiesdk';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export const Home = () => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <ZowieChat
        host="example.chat.getzowie.com/api/v1/core"
        config={myConfigAnonymous}
        iosKeyboardOffset={insets.bottom + insets.top}
      />
    </SafeAreaView>
  );
};
```
3. For other problems, you can strictly define the height and width of the chat component in the style props
