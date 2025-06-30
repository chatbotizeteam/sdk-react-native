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
- **onPressLink** ((url: string) => void, optional): Function for custom handling all links in application (without phone call and file buttons)
- **handleNewMessage** ((message: Message) void, optional): Function to which the latest message is passed when the component is running

### ZowieConfig Type
```ts
interface ZowieConfig {
  authenticationType: ZowieAuthenticationType;
  instanceId: string;
  jwt?: string;
  authorId?: string;
  contextId?: string;
  fcmToken?: string;
  conversationInitReferral?: string;
  initSaveExternalConversation?: { //check also saveExternalConversationHistory function below
    externalSystemId: string;
    externalMessages: ExternalMessageInput[];
  };
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



### clearSession()
This function allows you to reset anonymous chat session. Should be called before mount chat component.
```js
import { clearSession } from './react-native-zowiesdk';

await clearSession();
```
### setReferral(referralId: string)
This function allows you to set new referralId. Setting referral before mount new chat will the value will be overwritten ```conversationInitReferral``` from ```ZowieConfig``` to the clean session. Call setReferral when chat is mounted will send new referralId immediately
```js
import { setReferral } from './react-native-zowiesdk';

await setReferral(my_new_referral_string);
```

### Make sure that you are using below functions when component is mounted

### saveExternalConversationHistory(externalSystemId: string,externalMessages: ExternalMessageInput[])
This function allows you to save your external conversation. You can also use ```initSaveExternalConversation``` from ```ZowieConfig``` to save external conversation automatically after component mount.
```ts
import { saveExternalConversationHistory, type ExternalMessageInput } from './react-native-zowiesdk';

const externalConv: ExternalMessageInput[] = [
  {
    author: {authorId: 'id', type: 'System', name: 'name'},
    messageId: 'msg2',
    time: 2000,
    payload: {text: 'msg 2 text from system', additionalParams: []},
  },
];

await saveExternalConversationHistory('uniq_external_id', externalConv);
```

### clearExternalConversationHistory(externalSystemId: string)
This function allows you to clear a previously saved external conversation based on the externalId you have completed.
```ts
import { clearExternalConversationHistory } from './react-native-zowiesdk';

await clearExternalConversationHistory('uniq_external_id',);
```

### getExternalConversationHistory(variables: {offset: number,enentriesPerPage: number,externalSystemId: string}): GetExternalConversationHistoryResponse
This function allows you to get external conversation if was previously saved on current conversation.
```ts
import { getExternalConversationHistory, type GetExternalConversationHistoryResponse } from './react-native-zowiesdk';
const offset: number = 3000 // A Unix timestamp in milliseconds. The function will return up to entriesPerPage messages created before the given offset, sorted in descending order (from newest to oldest).
const enentriesPerPage: number = 100;
const externalSystemId: string = "uniq_external_id"
await getExternalConversationHistory({offset,enentriesPerPage,externalSystemId});
```
GetExternalConversationHistoryResponse type
```ts
export interface ConversationHistoryResponse {
  messages: ConversationHistoryMessage[];
  currentOffset: number;
  nextOffset?: number;
}

export interface GetExternalConversationHistoryResponse {
  getExternalConversationHistory: ConversationHistoryResponse;
}
```
### getZowieConversationHistory(variables: {offset: number,enentriesPerPage: number}): GetZowieConversationHistoryResponse
This function allows you to get current zowie conversation.
```ts
import { getZowieConversationHistory, type GetZowieConversationHistoryResponse } from './react-native-zowiesdk';
const offset: number = 3000 // A Unix timestamp in milliseconds. The function will return up to entriesPerPage messages created before the given offset, sorted in descending order (from newest to oldest).
const enentriesPerPage: number = 100;
await getZowieConversationHistory({offset, enentriesPerPage});
```
GetZowieConversationHistoryResponse type
```ts
export interface ConversationHistoryResponse {
  messages: ConversationHistoryMessage[];
  currentOffset: number;
  nextOffset?: number;
}

export interface GetZowieConversationHistoryResponse {
  getZowieConversationHistory: ConversationHistoryResponse;
}
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
