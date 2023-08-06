import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableWithoutFeedback,
  Dimensions,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const videoData = [
  {
    uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    user: 'User1',
    title: 'Description of User1',
  },
  {
    uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    user: 'User2',
    title: 'Description of User2',
  },
  {
    uri: 'https://diallclone65bac59de67a4901a7dfca360c0ba623214331-dev.s3.us-west-2.amazonaws.com/public/IMG_5146.MOV',
    user: 'User3',
    title: 'Description of User3',
  },
  {
    uri: 'https://diallclone65bac59de67a4901a7dfca360c0ba623214331-dev.s3.us-west-2.amazonaws.com/public/IMG_5147.MOV',
    user: 'User4',
    title: 'Description of User4',
  },

  // More videos...
];

const repeatData = [...Array(100)].flatMap(() => videoData);

export default function SearchScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const videoRefs = React.useRef([]);
  const [playingStatus, setPlayingStatus] = React.useState({});

  const onViewRef = React.useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  });

  const viewConfigRef = React.useRef({ viewAreaCoveragePercentThreshold: 50 });

  const togglePlay = React.useCallback(async (index) => {
    if (videoRefs.current[index]) {
      const status = await videoRefs.current[index].getStatusAsync();
      if (status.isPlaying) {
        videoRefs.current[index].pauseAsync();
        setPlayingStatus((prevState) => ({
          ...prevState,
          [index]: false,
        }));
      } else {
        videoRefs.current[index].playAsync();
        setPlayingStatus((prevState) => ({
          ...prevState,
          [index]: true,
        }));
      }
    }
  }, []);

  const onShare = async (uri) => {
    try {
      await Share.share({
        message: `Check out this awesome video: ${uri}`,
      });
    } catch (error) {
      alert(`Error sharing: ${error.message}`);
    }
  };

  const [bookmarked, setBookmarked] = React.useState({});

  return (
    <View style={styles.container}>
      <FlatList
        data={repeatData} // using the new data array
        keyExtractor={(_, index) => index.toString()}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        renderItem={({ item, index }) => (
          <TouchableWithoutFeedback onPress={() => togglePlay(index)}>
            <View style={styles.videoContainer}>
              <Video
                ref={(ref) => (videoRefs.current[index] = ref)}
                style={styles.video}
                source={{ uri: item.uri }}
                resizeMode='cover'
                shouldPlay={currentIndex === index}
                isLooping
                onPlaybackStatusUpdate={(status) => {
                  if (status.didJustFinish && !status.isLooping) {
                    setCurrentIndex(0);
                  }
                }}
              />
              {playingStatus.hasOwnProperty(index) && !playingStatus[index] && (
                <Ionicons
                  name='play'
                  size={70}
                  color='white'
                  style={styles.pauseIcon}
                />
              )}

              <Text style={styles.videoUser}>@{item.user}</Text>
              <Text style={styles.videoTitle}>{item.title}</Text>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => onShare(item.uri)}
              >
                <FontAwesome name='share' size={32} color='white' />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={() =>
                  setBookmarked((prevState) => ({
                    ...prevState,
                    [index]: !prevState[index],
                  }))
                }
              >
                {bookmarked[index] ? (
                  <Ionicons name='ios-bookmark' size={36} color='white' />
                ) : (
                  <Ionicons
                    name='ios-bookmark-outline'
                    size={36}
                    color='white'
                  />
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        )}
      />
      <StatusBar style='auto' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: 769,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoUser: {
    position: 'absolute',
    bottom: 50,
    left: 10,
    color: 'white',
    backgroundColor: 'transparent',
    padding: 5,
    fontWeight: 'bold',
  },
  videoTitle: {
    position: 'absolute',
    bottom: 25,
    left: 10,
    color: 'white',
    backgroundColor: 'transparent',
    padding: 5,
  },
  pauseIcon: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [
      { translateX: -25 }, // half the size
      { translateY: -25 }, // half the size
    ],
  },
  shareButton: {
    position: 'absolute',
    bottom: 120,
    right: 15,
  },
  bookmarkButton: {
    position: 'absolute',
    bottom: 180,
    right: 15,
  },
});
