import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { StackActions } from '@react-navigation/native';

const API_ENDPOINT = 'https://backend-8-br78.onrender.com/api';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        navigation.dispatch(StackActions.replace("MainTabs"));
      }
    };
    checkLogin();
  }, [navigation]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log("Attempting to login with:", API_ENDPOINT);
      
      const response = await axios.post(`${API_ENDPOINT}/auth/login`, { 
        username, 
        password 
      });
  
      console.log("Login response:", response.data);
      
      await AsyncStorage.setItem('token', JSON.stringify(response.data.token));
      setError('');
      setLoading(false);
  
      navigation.dispatch(StackActions.replace("MainTabs"));
    } catch (error) {
      setLoading(false);
      console.log("Login error:", error);
      
      if (error.response) {
        console.log("Server responded with:", error.response.data);
        setError(error.response.data?.message || 'Invalid username or password');
      } else if (error.request) {
        console.log("No response received");
        setError("Network error. Please check your connection.");
      } else {
        console.log("Error:", error.message);
        setError(`Request error: ${error.message}`);
      }
      
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid username or password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <TextInput 
        style={styles.input}
        placeholder="Enter Username"
        value={username}
        onChangeText={setUsername}
      />
      
      <TextInput 
        style={styles.input}
        placeholder="Enter Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.linkText}>Don't have an account? Register here.</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1DA1F2',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  button: {
    width: '100%',
    backgroundColor: "#1DA1F2",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  linkText: {
    color: "#1DA1F2",
    textAlign: "center",
    marginTop: 10,
  },
});

export default LoginScreen;