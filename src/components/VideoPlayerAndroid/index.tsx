import VideoView from '../../utils/VideoView';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import styles from './styles';
interface Props {
  videoUrl: string;
  onPressBack: () => void;
}
const VideoPlayerAndroid = ({ videoUrl, onPressBack }: Props) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        hitSlop={50}
        style={styles.closeButton}
        onPress={onPressBack}
      >
        <Image
          source={require('../../assets/back.png')}
          tintColor={'#fff'}
          style={styles.closeImage}
        />
        <Text style={styles.closeText}>Back</Text>
      </TouchableOpacity>
      <VideoView style={styles.video} isPlaying={true} url={videoUrl} />
    </View>
  );
};

export default VideoPlayerAndroid;