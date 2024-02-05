import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  userMessageContainer: {
    marginLeft: '23%',
    marginRight: 20,
    borderRadius: 12,
    marginVertical: 4,
  },
  incomingMessageContainer: {
    marginLeft: 20,
    marginRight: '23%',
    borderRadius: 12,
    marginVertical: 4,
  },
  imageWithButtons: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  image: {
    borderRadius: 12,
  },
  imageBg: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 100,
    height: 100,
  },
});

export default styles;
