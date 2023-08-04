import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Button,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import SvgInfoComponent from '../../assets/svgInfo';
import { Amplify, Storage } from 'aws-amplify';
import { useNavigation } from '@react-navigation/native';

export default function AskScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const cameraRef = useRef(null);
  const recordingTimeoutRef = useRef();
  const navigation = useNavigation();
  const videoRef = useRef(null);

  // Request for camera and audio permissions on mount

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(
        cameraStatus.status === 'granted' && audioStatus.status === 'granted'
      );
    })();
  }, []);

  // Clean up the recording timeout on unmount

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  // Pause the video and reset videoUri when the component loses focus

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
      setVideoUri(null); // Reset the video
    });

    return unsubscribe; // Return the unsubscribe function to clean up on unmount
  }, [navigation]);

  // Return empty View if permissions are not determined yet
  if (hasPermission === null) {
    return <View />;
  }
  // Show no access text if permissions are denied
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  // Handle start/stop recording
  const handleRecord = async () => {
    if (!cameraRef.current) return;
    if (recording) {
      cameraRef.current.stopRecording();
      setRecording(false);
    } else {
      setRecording(true);
      let video = await cameraRef.current.recordAsync();
      setVideoUri(video.uri);
      recordingTimeoutRef.current = setTimeout(() => {
        if (recording) {
          handleRecord();
        }
      }, 15000); // stop recording after 15 seconds
    }
  };

  // Delete the recorded video
  const deleteRecording = () => {
    setVideoUri(null);
    setTitle('');
  };

  // Send the recorded video to AWS S3
  const handleSend = async () => {
    console.log('handleSend is being called');
    if (title === '') {
      Alert.alert(
        'Title Required',
        'Please enter a title before sending the video.'
      );
    } else {
      try {
        // extract the file extension
        let fileType = videoUri.substr(videoUri.lastIndexOf('.') + 1);

        // Configure options for the upload
        const options = {
          contentType: `video/${fileType}`, // update with your video type e.g video/mp4, video/quicktime etc
        };

        // Create blob
        const blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            resolve(xhr.response);
          };
          xhr.onerror = function () {
            reject(new TypeError('Network request failed'));
          };
          xhr.responseType = 'blob';
          xhr.open('GET', videoUri, true);
          xhr.send(null);
        });

        // Fetch blob data
        const data = new FileReader();
        data.readAsDataURL(blob);
        data.onloadend = async () => {
          const base64data = data.result.split(',')[1];

          // Get a key for the upload
          const key = `${title}-${Date.now()}.${fileType}`;

          // Upload the video to S3
          const video = await Storage.put(key, base64data, options);

          console.log('video uploaded successfully: ', video);

          // Navigate to the WatchScreen after successful upload
          navigation.navigate('Watch');
        };
      } catch (error) {
        console.log('Error caught:', error);
        console.log('Error uploading video: ', error);
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {!videoUri ? (
        <Camera style={{ flex: 1 }} type={type} ref={cameraRef}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity
              style={{
                borderWidth: 6,
                borderColor: 'white',
                borderRadius: 50,
                height: 90,
                width: 90,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
              onPress={handleRecord}
            >
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
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: 10,
              top: 60,
            }}
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
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: [
                { translateX: -160 }, // This value should be half of your TextInput width
                { translateY: -220 }, // This value should be half of your TextInput height
              ],
            }}
          >
            <TextInput
              style={{
                height: 60,
                borderColor: 'white',
                borderWidth: 2,
                width: 260,
                borderRadius: 8,
              }}
              onChangeText={(text) => setTitle(text)}
              value={title}
              maxLength={40}
            />
          </View>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                left: 15,
                top: -710,
              }}
              onPress={deleteRecording}
            >
              <Ionicons name='close' size={38} color='white' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => console.log('outer touchable pressed')}
              style={{
                position: 'absolute',
                left: 130,
                bottom: 100,
                backgroundColor: 'yellowgreen',
                padding: 40, // Adjust this to increase/decrease button size
                borderRadius: 50, // For rounded corners
              }}
            >
              <Button
                onPress={() => {
                  console.log('Send It button pressed');
                  handleSend();
                }}
                title='Send It'
                color='#841584'
              />
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
          style={{
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
          onPress={() => setModalVisible(!modalVisible)}
        >
          <View
            style={{
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
            }}
          >
            <Text style={{ marginBottom: 15, textAlign: 'center' }}>
              Info Content Goes Here
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
