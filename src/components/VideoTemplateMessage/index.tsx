import {
  Dimensions,
  Image,
  ImageBackground,
  InteractionManager,
  NativeModules,
  Platform,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import type { VideoTemplatePayload } from '../../types/queries';
import { useColors } from '../../hooks/colors';
import { prepareJpegBase64, screenWidth } from '../../utils/functions';
import { useVideo } from '../../hooks/video';
import ActionButtonList from '../AcitonButtonList';
import styles from './styles';
import { useTheme } from '../../hooks/theme';

interface Props {
  payload: VideoTemplatePayload;
  style?: ViewStyle;
  isUser: boolean;
  onSend: (clearInput: boolean, messageText?: string) => Promise<void>;
}

const { Zowiesdk } = NativeModules;
const { VideoPlayerBridge } = NativeModules;

const VideoTemplateMessage = ({ payload, style, isUser, onSend }: Props) => {
  const { colors } = useColors();
  const { theme } = useTheme();
  const { setShow, setVideoUrl } = useVideo();
  const [imageBase64, setImageBase64] = useState('');
  const [imgHeight, setImgHeight] = useState(0);
  const [imgWidth, setImgWidth] = useState(0);
  const [loading, setLoading] = useState(false);
  const showButtons = payload.buttons?.length > 0;

  const getWindowWidth = useMemo(() => {
    let windowWidth = 0;
    if (style?.width) {
      if (typeof style.width === 'string') {
        windowWidth = (parseFloat(style.width) / 100) * screenWidth;
      } else {
        windowWidth = screenWidth;
      }
    } else {
      windowWidth = Dimensions.get('window').width;
    }
    return windowWidth;
  }, [style]);

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    let width = getWindowWidth - Math.round(getWindowWidth * 0.23 + 20);
    setImgWidth(width);
    (async () => {
      try {
        let base64 = '';
        try {
          base64 = await Zowiesdk.generateThumbnailFromURL(payload.url);
        } catch (e) {
          await sleep(100);
          base64 = await Zowiesdk.generateThumbnailFromURL(payload.url);
        }
        if (base64 === '') {
          return;
        }
        const jpegBase64 = prepareJpegBase64(base64);
        Image.getSize(jpegBase64, (w, h) => {
          const imgRatio = h / w;
          let height = width * imgRatio;
          if (height > width) {
            height = width;
            width = height / imgRatio;
            setImgWidth(width);
            setImgHeight(height);
            setImageBase64(jpegBase64);
          } else {
            setImgHeight(height);
            setImageBase64(jpegBase64);
          }
        });
      } catch (e) {}
    })();
  }, [getWindowWidth, payload.url]);

  function openVideoIos(url: string) {
    return new Promise<void>((resolve, reject) => {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(
          () => {
            VideoPlayerBridge.renderVideoFromUrl(url)
              .then(() => resolve())
              .catch(reject);
          },
          Platform.OS === 'ios' ? 0 : 0
        );
      });
    });
  }

  const onOpenVideo = async (url: string) => {
    if (Platform.OS === 'ios') {
      setLoading(true);
      try {
        await openVideoIos(url);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    } else {
      setVideoUrl(url);
      setShow(true);
    }
  };
  return (
    <View
      style={[
        isUser ? styles.userMessageContainer : styles.incomingMessageContainer,
        {
          width: imgWidth,
          backgroundColor: isUser
            ? colors.userMessageBackgroundColor
            : colors.incomingMessageBackgroundColor,
          borderRadius: theme?.messageRadius || 12,
          height: showButtons ? undefined : imgHeight,
        },
      ]}
    >
      <TouchableOpacity
        onPress={async () => {
          await onOpenVideo(payload.url);
        }}
        disabled={loading}
      >
        {imageBase64 !== '' && (
          <ImageBackground
            source={{
              uri:
                payload.url.startsWith('file://') ||
                payload.url.startsWith('content:')
                  ? payload.url
                  : imageBase64,
              cache: 'force-cache',
            }}
            imageStyle={
              showButtons
                ? {
                    borderTopLeftRadius: theme?.messageRadius || 12,
                    borderTopRightRadius: theme?.messageRadius || 12,
                  }
                : { borderRadius: theme?.messageRadius || 12 }
            }
            style={[
              styles.imageBg,
              {
                width: imgWidth,
                height: imgHeight,
              },
            ]}
          >
            <Image
              source={require('../../assets/videoPlay.png')}
              style={styles.playButton}
            />
          </ImageBackground>
        )}
      </TouchableOpacity>
      {showButtons && (
        <ActionButtonList buttons={payload.buttons} onSend={onSend} />
      )}
    </View>
  );
};

export default VideoTemplateMessage;
