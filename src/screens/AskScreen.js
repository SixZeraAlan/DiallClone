import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';
import { Ionicons, AntDesign } from '@expo/vector-icons';
// import svgInfoBox from '../../assets/svgInfoBox';
import { Amplify, Storage } from 'aws-amplify';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_VIDEO_URI } from '@env';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';

export default function AskScreen() {
  // States for handling permissions, camera type, recording status, and more
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [currentTherapistName, setCurrentTherapistName] = useState('anonymous');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [messageText, setMessageText] = useState('');

  // References to manage the camera, recording timeout, and video player
  const cameraRef = useRef(null);
  const recordingTimeoutRef = useRef();
  const navigation = useNavigation();
  const videoRef = useRef(null);
  const route = useRoute();
  const titleInputRef = useRef(null);

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
      setIsExpanded(false);
      setTitle('');
      setMessageText('');
      setShowMessageInput(false);
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

    // Toggle the timer playing state and start recording
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
  const handleVideoSend = async () => {
    console.log('handleVideoSend is being called');
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

  // Function to handle text message upload to AWS S3
  const handleMsgSend = async () => {
    console.log('handleMsgSend is being called');
    if (messageText === '') {
      Alert.alert('Message Required', 'Please enter a message before sending.');
      return;
    }

    try {
      // Generate a unique key for the upload based on the title and current timestamp
      const key = `${messageText}-${Date.now()}_${currentTherapistName}.txt`;

      // Configuration options for the S3 upload
      const options = {
        level: 'public',
        contentType: 'text/plain',
      };

      // Upload the text to S3
      const textUpload = await Storage.put(key, messageText, options);

      console.log('Message uploaded successfully: ', textUpload);
      setMessageText('');
      setShowMessageInput(false);

      const textURL = `${BASE_VIDEO_URI}/${textUpload.key}`;

      // Redirect to the WatchScreen after a successful upload
      navigation.navigate('Watch', {
        uploadedVideo: {
          uri: textURL,
          user: 'username',
          therapist: currentTherapistName,
          title: title,
        },
      });
    } catch (error) {
      console.log('Error caught:', error);
      console.log('Error uploading message: ', error);
    }
  };

  const handleTitleChange = (text) => {
    setTitle(text);

    if (text.length > 20) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  };

  const handleShowMessageInput = () => {
    setShowMessageInput(!showMessageInput);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.msgContainer}>
        {showMessageInput ? (
          <>
            <TouchableOpacity
              style={styles.deleteMsgButton}
              onPress={() => setShowMessageInput(false)}
            >
              <Ionicons name='close' size={38} color='black' />
            </TouchableOpacity>
            <TextInput
              style={styles.messageInput}
              maxLength={500}
              multiline
              numberOfLines={6}
              placeholder='Enter your question here...'
              blurOnSubmit={true}
              returnKeyType='done'
              placeholderTextColor='#6a6b69'
              paddingTop={12}
              onChangeText={(text) => setMessageText(text)}
              value={messageText}
            />
            <TouchableOpacity
              onPress={() => {
                console.log('Send message button pressed');
                handleMsgSend();
              }}
              style={styles.sendMsgButton}
            >
              <Text style={styles.sendMsgButtonText}>Send It</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {!videoUri ? (
              <Camera style={styles.camera} type={type} ref={cameraRef}>
                <View style={styles.recordContainer}>
                  {!recording && (
                    <>
                      <Text style={styles.recordTextAbove}>
                        Tap to record/enter
                      </Text>
                      <Text style={styles.recordTextBelow}>your question</Text>
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={styles.notRecordButton}
                          onPress={handleRecord}
                        ></TouchableOpacity>
                        <TouchableOpacity
                          style={styles.msgButton}
                          onPress={handleShowMessageInput}
                        >
                          <AntDesign name='message1' size={90} color='white' />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                  {recording && (
                    <>
                      <TouchableOpacity
                        style={styles.recordButton}
                        onPress={handleRecord}
                      >
                        <CountdownCircleTimer
                          isPlaying={recording}
                          duration={15}
                          colors={'red'}
                          size={90}
                          strokeWidth={6}
                          trailStrokeWidth={6}
                          trailColor={'transparent'}
                          onComplete={() => {
                            if (recording) {
                              handleRecord();
                            }
                          }}
                        >
                          {({ remainingTime }) => (
                            <Text
                              style={{
                                color: 'red',
                                fontSize: 26,
                                fontWeight: '600',
                              }}
                            >
                              {remainingTime}
                            </Text>
                          )}
                        </CountdownCircleTimer>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
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
                <View style={styles.titleContainer}>
                  {title === '' && (
                    <Text style={styles.titlePlaceholderText}>
                      Title of your question...
                    </Text>
                  )}
                  <TextInput
                    ref={titleInputRef}
                    style={[
                      isExpanded
                        ? styles.titleInputExpanded
                        : styles.titleInput,
                    ]}
                    onChangeText={handleTitleChange}
                    value={title}
                    maxLength={40}
                    placeholderTextColor='white'
                    multiline
                    numberOfLines={2}
                    fontFamily='Menlo'
                    blurOnSubmit={true}
                    returnKeyType='done'
                    onSubmitEditing={() => titleInputRef.current.blur()}
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
                      console.log('Send video button pressed');
                      handleVideoSend();
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
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  msgContainer: {
    flex: 1,
    backgroundColor: 'transparent',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
  },
  msgButton: {
    backgroundColor: 'transparent',
    paddingBottom: 10,
    borderRadius: 5,
  },
  msgButtonText: {
    color: 'white',
    fontSize: 18,
    backgroundColor: 'transparent',
  },
  messageInput: {
    position: 'absolute',
    top: 100,
    left: '5%',
    right: '5%',
    padding: 15,
    fontSize: 18,
    borderColor: 'black',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderRadius: 20,
  },
  notRecordButton: {
    borderWidth: 6,
    borderColor: 'white',
    borderRadius: 50,
    height: 90,
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  recordButton: {
    borderWidth: 6,
    borderColor: 'transparent',
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
    left: 220,
    transform: [{ translateX: -160 }, { translateY: -220 }],
  },
  titlePlaceholderText: {
    position: 'absolute',
    left: 10,
    top: 18,
    fontSize: 20,
    color: 'white',
    fontWeight: '500',
  },
  titleInput: {
    height: 60,
    borderColor: 'white',
    borderWidth: 3,
    width: 260,
    borderRadius: 20,
    paddingTop: 15,
    paddingLeft: 5,
    // paddingRight: 10,
    fontSize: 20,
    color: 'white',
    justifyContent: 'center',
    fontWeight: '500',
    backgroundColor: 'rgba(52, 52, 52, 0.8)',
  },
  titleInputExpanded: {
    height: 80, // Height for two lines
    borderColor: 'white',
    borderWidth: 3,
    width: 260,
    borderRadius: 20,
    paddingTop: 15,
    paddingLeft: 5,
    // paddingRight: 10,
    fontSize: 20,
    color: 'white',
    justifyContent: 'center',
    fontWeight: '500',
    backgroundColor: 'rgba(52, 52, 52, 0.8)',
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
  deleteMsgButton: {
    position: 'absolute',
    left: 15,
    top: 45,
  },
  sendMsgButton: {
    position: 'absolute',
    left: 115,
    bottom: 100,
    backgroundColor: 'yellowgreen',
    padding: 40,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendMsgButtonText: {
    color: 'white',
    fontSize: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
