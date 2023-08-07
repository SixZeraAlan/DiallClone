import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import SvgInfoComponent from '../../assets/svgInfo';
import { Amplify, Storage } from 'aws-amplify';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_VIDEO_URI } from '@env';

export default function AskScreen() {
  // States for handling permissions, camera type, recording status, and more
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');

  // References to manage the camera, recording timeout, and video player
  const cameraRef = useRef(null);
  const recordingTimeoutRef = useRef();
  const navigation = useNavigation();
  const videoRef = useRef(null);
  const route = useRoute();
  const [currentTherapistName, setCurrentTherapistName] = useState('anonymous');

  // Request for camera and microphone permissions once the component is mounted
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(
        cameraStatus.status === 'granted' && audioStatus.status === 'granted'
      );
    })();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      // Check if navigation is from search page
      if (route.params?.fromSearch) {
        setCurrentTherapistName(route.params.askedTherapistName);
      }
    };

    // Subscribe to focus event to set the therapist name
    const focusSubscription = navigation.addListener('focus', handleFocus);

    // Subscribe to blur event to reset fromSearch
    const blurSubscription = navigation.addListener('blur', () => {
      setCurrentTherapistName('anonymous');
      if (route.params) {
        route.params.fromSearch = false;
      }
    });

    // Cleanup subscriptions
    return () => {
      focusSubscription();
      blurSubscription();
    };
  }, [navigation, route.params]);

  // Clean up the recording timeout on component unmount

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  // Pause the video and reset its URI when the screen/component loses focus

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
      setVideoUri(null); // Reset the video
    });

    // Unsubscribe from the navigation event on unmount
    return unsubscribe;
  }, [navigation]);

  // Return empty View if permissions are not determined yet
  if (hasPermission === null) {
    return <View />;
  }
  // Show no access text if permissions are denied
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  // Handle video recording start and stop

  const handleRecord = async () => {
    if (!cameraRef.current) return;
    if (recording) {
      cameraRef.current.stopRecording();
      setRecording(false);
    } else {
      setRecording(true);
      let video = await cameraRef.current.recordAsync();
      setVideoUri(video.uri);
      // Set a timeout to automatically stop recording after 15 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        if (recording) {
          handleRecord();
        }
      }, 15000);
    }
  };

  // Delete the recorded video and reset the title
  const deleteRecording = () => {
    setVideoUri(null);
    setTitle('');
  };

  // Upload the video to S3 and navigate to the WatchScreen after successful upload
  const handleSend = async () => {
    console.log('handleSend is being called');
    if (title === '') {
      Alert.alert(
        'Title Required',
        'Please enter a title before sending the video.'
      );
    } else {
      try {
        // Extract the file extension from the video URI
        let fileType = videoUri.substr(videoUri.lastIndexOf('.') + 1);

        // Generate a unique key for the upload based on the title and current timestamp
        const key = `${title}-${Date.now()}_${currentTherapistName}.${fileType}`;

        // Configuration options for the S3 upload
        const options = {
          level: 'public',
          contentType: `video/${fileType}`,
        };

        // Convert the video into a blob and upload to S3
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const video = await Storage.put(key, blob, options);

        console.log('video uploaded successfully: ', video);
        setTitle('');

        const videoURL = `${BASE_VIDEO_URI}/${video.key}`;

        // Redirect to the WatchScreen after a successful upload
        navigation.navigate('Watch', {
          uploadedVideo: {
            uri: videoURL,
            user: 'username',
            therapist: currentTherapistName,
            title: title,
          },
        });
      } catch (error) {
        console.log('Error caught:', error);
        console.log('Error uploading video: ', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Conditional rendering to either show the camera or the recorded video */}
      {!videoUri ? (
        <Camera style={styles.camera} type={type} ref={cameraRef}>
          {/* UI elements and controls for recording */}
          <View style={styles.recordContainer}>
            {/* The added Text component */}
            {!recording && (
              <>
                <Text style={styles.recordTextAbove}>Tap to record</Text>
                <Text style={styles.recordTextBelow}>your question</Text>
              </>
            )}

            <TouchableOpacity
              style={styles.recordButton}
              onPress={handleRecord}
            >
              {/* Visual indication for recording status */}
              <View
                style={{
                  height: recording ? 50 : 0,
                  width: recording ? 50 : 0,
                  borderRadius: 5,
                  backgroundColor: recording ? 'white' : 'transparent',
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Button to display the information modal */}
          <TouchableOpacity
            style={styles.inforIcon}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons
              name='information-circle-outline'
              size={30}
              color='white'
            />
          </TouchableOpacity>
        </Camera>
      ) : (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          {/* Video player for the recorded video */}
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode='cover'
            shouldPlay={true}
            isLooping
            style={{ flex: 1 }}
          />

          {/* UI elements for video title and controls */}
          <View style={styles.titleContainer}>
            <TextInput
              style={styles.titleInput}
              onChangeText={(text) => setTitle(text)}
              value={title}
              maxLength={40}
              placeholder='Title of your question...'
              placeholderTextColor='white'
            />
          </View>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={deleteRecording}
            >
              <Ionicons name='close' size={38} color='white' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                console.log('Send It button pressed');
                handleSend();
              }}
              style={styles.sendButton}
            >
              <Text style={styles.sendButtonText}>Send It</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        animationType='slide'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={() => setModalVisible(!modalVisible)}
        >
          <View style={styles.infoContentContainer}>
            <Text style={styles.infoContentText}>Info Content</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textInput: {
    height: 60,
    borderColor: 'white',
    borderWidth: 3,
    width: 260,
    borderRadius: 20,
    paddingLeft: 10,
    paddingTop: 12,
    fontSize: 20,
    color: 'white',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  recordContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  recordTextAbove: {
    color: 'white',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 500,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  recordTextBelow: {
    color: 'white',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 500,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  recordButton: {
    borderWidth: 6,
    borderColor: 'white',
    borderRadius: 50,
    height: 90,
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  inforIcon: {
    position: 'absolute',
    right: 10,
    top: 60,
  },
  titleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -160 }, { translateY: -220 }],
  },
  titleInput: {
    height: 80,
    borderColor: 'white',
    borderWidth: 3,
    width: 320,
    borderRadius: 40,
    paddingLeft: 10,
    fontSize: 20,
    color: 'white',
    justifyContent: 'center',
  },
  deleteButton: {
    position: 'absolute',
    left: 15,
    top: -710,
  },
  sendButton: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'yellowgreen',
    padding: 40,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  infoContentContainer: {
    marginTop: 60,
    marginRight: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoContentText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});
