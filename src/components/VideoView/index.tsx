import React from 'react';
import { requireNativeComponent, type ViewProps } from 'react-native';

type NativeProps = ViewProps & {
  url: string;
  isPlaying?: boolean;
};

const RCTVideoView = requireNativeComponent<NativeProps>('VideoView');

const VideoView: React.FC<NativeProps> = (props) => {
  return <RCTVideoView {...props} />;
};

export default VideoView;
