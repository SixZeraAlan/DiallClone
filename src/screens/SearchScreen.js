import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  Share,
} from 'react-native';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { firebase } from '../../firebase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export default function SearchScreen() {
  const [therapists, setTherapists] = useState([]);
  const [filteredTherapists, setFilteredTherapists] = useState([]);
  const [searchText, setSearchText] = useState('');

  const therapistRef = firebase.firestore().collection('therapists');
  const searchInputRef = useRef(null);

  const navigation = useNavigation();

  // Function to share
  const onShare = async () => {
    try {
      const result = await Share.share({
        message: 'Shared with your therapist',
      });
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    const fetchTherapists = async () => {
      therapistRef.onSnapshot((querySnapShot) => {
        const therapistsList = [];
        querySnapShot.forEach(
          (doc) => {
            const { profilePic, username, keywords } = doc.data();
            therapistsList.push({
              id: doc.id,
              profilePic,
              username,
              keywords,
            });
          },
          (error) => {
            console.error('Snapshot listener error: ', error);
          }
        );
        setTherapists(therapistsList);
      });
    };

    fetchTherapists();
  }, []);

  useEffect(() => {
    // This effect runs whenever the user's input or the therapists list changes
    const results = therapists.filter(
      (therapist) =>
        therapist.username.toLowerCase().includes(searchText.toLowerCase()) ||
        therapist.keywords.some((keyword) =>
          keyword.toLowerCase().includes(searchText.toLowerCase())
        )
    );

    setFilteredTherapists(results);
  }, [searchText, therapists]);

  useFocusEffect(
    React.useCallback(() => {
      // Focus the TextInput every time the screen is focused
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [])
  );

  return (
    <View style={styles.container}>
      <TextInput
        ref={searchInputRef}
        style={styles.searchBar}
        placeholder='Search for therapists...'
        onChangeText={setSearchText}
        value={searchText}
        // autoFocus={true}
      />

      {filteredTherapists.length === 0 && searchText ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.noMatches}>Don't see your therapist</Text>
          <Pressable onPress={onShare} style={{ marginTop: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <FontAwesome name='share-square-o' size={24} color='black' />
              <Text style={{ color: '#888' }}> Invite your therapist</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredTherapists}
          keyExtractor={(item) => item.username}
          renderItem={({ item }) => (
            <View style={styles.therapistContainer}>
              <Image
                source={{ uri: item.profilePic }}
                style={styles.profilePic}
              />
              <View style={styles.details}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.keywords}>{item.keywords.join(', ')}</Text>
              </View>
              <Pressable
                onPress={() => {
                  navigation.navigate('Ask', {
                    fromSearch: true,
                    askedTherapistName: item.username,
                  });
                }}
                style={styles.cameraButton}
              >
                <AntDesign name='camerao' size={24} color='black' />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: 60,
  },
  searchBar: {
    backgroundColor: '#e5e5e5',
    borderRadius: 25,
    paddingLeft: 15,
    margin: 10,
    height: 40,
  },
  noMatches: {
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
  },
  therapistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    height: 80,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 6,
  },
  details: {
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
  },
  keywords: {
    color: '#777',
    flexWrap: 'wrap',
  },
  cameraButton: {
    marginRight: 5,
  },
});
