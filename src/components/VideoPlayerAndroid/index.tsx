import React, { useEffect } from 'react';
import { View, DeviceEventEmitter } from 'react-native';
import VideoView from '../../utils/VideoView';
import styles from './styles';

interface Props {
  videoUrl: string;
  onPressBack: () => void;
}

const VideoPlayerAndroid = ({ videoUrl, onPressBack }: Props) => {
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('VideoPlayerClosed', () => {
      onPressBack?.();
    });
    return () => sub.remove();
  }, [onPressBack]);

  return (
    <View style={styles.container}>
      <VideoView style={styles.video} url={videoUrl} isPlaying={true} />
    </View>
  );
};

export default VideoPlayerAndroid;
