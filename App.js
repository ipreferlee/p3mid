import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from './screens/LoginScreen';
import HomePage from './screens/HomePage'; // Correct import
import Register from './screens/Register';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Define your MainTabs component
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarStyle: { backgroundColor: 'black' },
        tabBarActiveTintColor: '#1DA1F2',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: 'black' },
        headerTintColor: 'white',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomePage} // Fixed: use correct HomePage component
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      {/* Add other screens */}
      <Tab.Screen 
        name="Profile" 
        component={PlaceholderScreen} // Replace with your actual screen
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Placeholder screen
const PlaceholderScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Screen coming soon!</Text>
  </View>
);

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
