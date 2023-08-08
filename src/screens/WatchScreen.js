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
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { useIsFocused } from '@react-navigation/native';
import { SERVER_URL } from '@env';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WatchScreen({ navigation, route }) {
  // State to keep track of the current index of video being played in the list
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Using refs to keep references to multiple video components for play/pause functionality
  const videoRefs = React.useRef([]);

  // State to keep track of which videos are currently playing
  const [playingStatus, setPlayingStatus] = React.useState({});

  // Extracting the uploaded video from the navigation route params
  const uploadedVideo = route.params?.uploadedVideo;

  // Ref callback that updates the current index based on the most visible item in the FlatList
  const onViewRef = React.useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  });

  // Configuration for FlatList's onViewableItemsChanged, to determine when items are considered viewable
  const viewConfigRef = React.useRef({ viewAreaCoveragePercentThreshold: 50 });

  // Callback function to toggle the play state of the video at a given index
  const togglePlay = React.useCallback(async (index) => {
    try {
      if (videoRefs.current[index]) {
        const status = await videoRefs.current[index].getStatusAsync();
        if (status.isPlaying) {
          await videoRefs.current[index].pauseAsync();
          setPlayingStatus((prevState) => ({
            ...prevState,
            [index]: false,
          }));
        } else {
          await videoRefs.current[index].playAsync();
          setPlayingStatus((prevState) => ({
            ...prevState,
            [index]: true,
          }));
        }
      }
    } catch (error) {
      console.error(`Error playing or pausing video: ${error.message}`);
    }
  }, []);

  // Function to share the video using the built-in Share module
  const onShare = async (uri) => {
    try {
      await Share.share({
        message: `Check out this awesome video: ${uri}`,
      });
    } catch (error) {
      alert(`Error sharing: ${error.message}`);
    }
  };

  // State for bookmarked videos

  const [bookmarked, setBookmarked] = React.useState({});
  // State to hold the list of videos fetched from the server
  const [videoData, setVideoData] = React.useState([]);

  // Fetch videos from the AWS S3
  const fetchData = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/videos`);
      if (response && 'data' in response) {
        if (uploadedVideo) {
          setVideoData([uploadedVideo, ...response.data]);
        } else {
          setVideoData(response.data);
        }
      } else {
        console.error('No data in response');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch data when the component mounts or uploadedVideo changes

  React.useEffect(() => {
    fetchData();
  }, [uploadedVideo]);

  // Generating repeated video data for the infinite scroll effect
  const repeatData = React.useMemo(
    () => [...Array(100)].flatMap(() => videoData),
    [videoData, uploadedVideo] // include uploadedVideo in the dependency array
  );

  // Using the useIsFocused hook from react-navigation to determine if the screen is currently in focus or not
  const isFocused = useIsFocused();

  // Effect to play or pause video when the screen comes into or goes out of focus
  React.useEffect(() => {
    setPlayingStatus((prevState) => ({
      ...prevState,
      [currentIndex]: isFocused,
    }));
    if (isFocused) {
      // If screen comes into focus, play the current video
      videoRefs.current[currentIndex]?.playAsync();
    } else {
      // If screen goes out of focus, pause the current video
      videoRefs.current[currentIndex]?.pauseAsync();
    }
  }, [isFocused, currentIndex]);

  // extract the title
  const extractTitleFromURI = (uri) => {
    const matches = uri?.match(/public\/(.*?)-/);
    return matches && matches[1];
  };

  const extractTherapistNameFromURI = (uri) => {
    const matches = uri?.match(/_(.*?)\./);
    return matches && matches[1];
  };

  // encode the URI:
  const encodeURIWithSpaces = (uri) => {
    if (!uri) return '';
    return encodeURI(uri);
  };

  const getFileTypeFromURI = (uri) => {
    const extension = uri?.split('.').pop();
    return extension;
  };

  const extractTextFromURI = (uri) => {
    const matches = uri?.match(/public\/(.*?)-/);
    return matches && matches[1];
  };

  return (
    <View style={styles.container}>
      {/* FlatList to display and scroll through the list of videos */}
      <FlatList
        // Data source for the list, uses repeated video data for infinite scroll effect
        data={repeatData}
        // Key extractor to uniquely identify each item in the list
        keyExtractor={(_, index) => index.toString()}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        renderItem={({ item, index }) => (
          // Wraps the video item with a touchable wrapper to detect taps and toggle play/pause
          <TouchableWithoutFeedback onPress={() => togglePlay(index)}>
            {/* Container for individual video */}
            <View style={styles.videoContainer}>
              {/* Conditional rendering of the video if there's a valid URI */}
              {(getFileTypeFromURI(item?.uri) === 'mov' ||
                getFileTypeFromURI(item?.uri) === 'mp4') && (
                <>
                  <Video
                    ref={(ref) => (videoRefs.current[index] = ref)}
                    style={styles.video}
                    // source={{ uri: item.uri }}
                    source={{ uri: encodeURIWithSpaces(item.uri) }}
                    resizeMode='cover'
                    shouldPlay={currentIndex === index}
                    isLooping
                    onPlaybackStatusUpdate={(status) => {
                      if (status.didJustFinish && !status.isLooping) {
                        setCurrentIndex(0);
                      }
                    }}
                  />
                  {playingStatus.hasOwnProperty(index) &&
                    !playingStatus[index] && (
                      <Ionicons
                        name='play'
                        size={70}
                        color='white'
                        style={styles.pauseIcon}
                      />
                    )}
                  <Text style={styles.videoUser}>
                    @Username #replyed by{' '}
                    {extractTherapistNameFromURI(item?.uri)}
                  </Text>
                  <Text style={styles.videoTitle}>
                    {extractTitleFromURI(item?.uri)}
                  </Text>
                  {/* Button to share the video */}
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => item?.uri && onShare(item.uri)}
                  >
                    <FontAwesome name='share' size={32} color='white' />
                  </TouchableOpacity>
                  {/* Toggle button for bookmarking videos */}
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
                </>
              )}
              {getFileTypeFromURI(item?.uri) === 'txt' && (
                <View>
                  <Text style={styles.textReference}>Question:</Text>
                  <Text style={styles.textDisplay}>
                    {extractTextFromURI(item.uri)}
                  </Text>
                  <Text style={styles.textUser}>
                    @Username #replyed by{' '}
                    {extractTherapistNameFromURI(item?.uri)}
                  </Text>
                  <TouchableOpacity
                    style={styles.shareButtonText}
                    onPress={() => item?.uri && onShare(item.uri)}
                  >
                    <FontAwesome name='share' size={32} color='black' />
                  </TouchableOpacity>
                  {/* Toggle button for bookmarking videos */}
                  <TouchableOpacity
                    style={styles.bookmarkButtonText}
                    onPress={() =>
                      setBookmarked((prevState) => ({
                        ...prevState,
                        [index]: !prevState[index],
                      }))
                    }
                  >
                    {bookmarked[index] ? (
                      <Ionicons name='bookmark' size={36} color='black' />
                    ) : (
                      <Ionicons
                        name='bookmark-outline'
                        size={36}
                        color='black'
                      />
                    )}
                  </TouchableOpacity>
                </View>
              )}
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
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  shareButton: {
    position: 'absolute',
    bottom: 80,
    right: 15,
  },
  bookmarkButton: {
    position: 'absolute',
    bottom: 140,
    right: 15,
  },
  shareButtonText: {
    position: 'absolute',
    top: 660,
    right: 15,
  },
  bookmarkButtonText: {
    position: 'absolute',
    top: 600,
    right: 15,
  },
  textReference: {
    color: 'black',
    fontSize: 28,
    paddingLeft: 30,
    paddingTop: 80,
  },
  textDisplay: {
    color: 'black',
    fontSize: 24,
    paddingLeft: 30,
    paddingTop: 20,
  },
  textUser: {
    position: 'absolute',
    top: 710,
    left: 10,
    color: 'black',
    backgroundColor: 'transparent',
    padding: 5,
    fontWeight: 'bold',
  },
});
