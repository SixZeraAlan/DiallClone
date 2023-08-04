import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import AskScreen from '../screens/AskScreen';
import WatchScreen from '../screens/WatchScreen';
import SearchScreen from '../screens/SearchScreen';

// Assigning constant names to each screen, to be used as route names
const askName = 'Ask';
const watchName = 'Watch';
const searchName = 'Search';

// Creating the bottom tab navigator
const Tab = createBottomTabNavigator();

// This is the main container that will wrap the app
function MainContainer() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName={askName}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let rn = route.name;

            if (rn === watchName) {
              iconName = focused ? 'ios-home' : 'ios-home-outline';
            } else if (rn === askName) {
              iconName = focused ? 'ios-chatbubble' : 'ios-chatbubble-outline';
            } else if (rn === searchName) {
              iconName = focused ? 'search-circle' : 'search-circle-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarLabelStyle: { paddingBottom: 20, fontSize: 10 },
          tabBarStyle: {
            height: 83,
            backgroundColor: '#000000',
            paddingBottom: 0, // removing any potential bottom padding
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name={watchName} component={WatchScreen} />
        <Tab.Screen name={askName} component={AskScreen} />
        <Tab.Screen name={searchName} component={SearchScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default MainContainer;
