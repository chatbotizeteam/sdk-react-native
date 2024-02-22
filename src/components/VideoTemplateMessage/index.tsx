import {
  Dimensions,
  Image,
  ImageBackground,
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

interface Props {
  payload: VideoTemplatePayload;
  style?: ViewStyle;
  isUser: boolean;
}

const { Zowiesdk } = NativeModules;
const { VideoPlayerBridge } = NativeModules;

const VideoTemplateMessage = ({ payload, style, isUser }: Props) => {
  const { colors } = useColors();
  const { setShow, setVideoUrl } = useVideo();
  const [imageBase64, setImageBase64] = useState('');
  const [imgHeight, setImgHeight] = useState(0);
  const [imgWidth, setImgWidth] = useState(0);
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

  useEffect(() => {
    let width = getWindowWidth - Math.round(getWindowWidth * 0.23 + 20);
    setImgWidth(width);
    (async () => {
      try {
        const base64 = await Zowiesdk.generateThumbnailFromURL(payload.url);
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

  const onOpenVideo = () => {
    if (Platform.OS === 'ios') {
      try {
        VideoPlayerBridge.renderVideoFromUrl(payload.url);
      } catch (e) {}
    } else {
      setVideoUrl(payload.url);
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

          height: showButtons ? undefined : imgHeight,
        },
      ]}
    >
      <TouchableOpacity onPress={onOpenVideo}>
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
            imageStyle={showButtons ? styles.imageWithButtons : styles.image}
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
      {showButtons && <ActionButtonList buttons={payload.buttons} />}
    </View>
  );
};

export default VideoTemplateMessage;
