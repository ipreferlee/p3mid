import React, { useState, useEffect } from 'react';
import {View,  Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert, SafeAreaView, StatusBar} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// Change the import to use the correct method from jwt-decode
import { jwtDecode } from 'jwt-decode';
import { StackActions } from '@react-navigation/native';
import { API_ENDPOINT } from './Api';
// Add API_ENDPOINT constant

const HomePage = () => {
  useEffect(() => {
    console.log('Using API endpoint:', API_ENDPOINT);
    
  }, []);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();

  const getToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      console.log('Raw token from AsyncStorage:', storedToken);
      
      if (!storedToken) {
        console.warn('No token found in storage');
        return null;
      }
  
      let finalToken;
      try {
        const parsed = JSON.parse(storedToken);
        console.log('Parsed token object:', parsed);
        
        // Try different common token structures
        finalToken = parsed?.data?.token || parsed?.token || parsed?.accessToken || parsed;
        
        if (typeof finalToken === 'string') {
          console.log('Final token (string):', finalToken);
          return finalToken;
        } else if (typeof finalToken === 'object') {
          console.log('Token is an object, not a string:', finalToken);
          // If it's still an object, try to find a token property
          return finalToken.token || finalToken.accessToken || JSON.stringify(finalToken);
        }
        
        return storedToken; // Fallback to original
      } catch (error) {
        console.log('Token is not JSON, using as string:', storedToken);
        return storedToken;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchDecodedUserID = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No token found');
  
        console.log('Retrieved Token:', token);
        
        // Add a try-catch specifically for token decoding
        try {
          const decodedToken = jwtDecode(token);
          console.log('Decoded Token:', decodedToken);
          setUser(decodedToken);
          fetchUsers();
        } catch (decodeError) {
          console.error('JWT decode error:', decodeError.message);
          // Handle the JWT decode error - you might want to redirect to login or try again
          Alert.alert('Authentication Error', 'Your session is invalid. Please login again.');
          handleLogout();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        navigation.navigate('Login');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchDecodedUserID();
  }, []);

  const getHeaders = async () => {
    const token = await getToken();
    if (!token) return { 'Accept': 'application/json' };
    
    // Try without "Bearer " prefix
    const headers = { 
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token // Without "Bearer " prefix
    };
    
    console.log('Using authorization header without Bearer prefix:', headers.Authorization);
    return headers;
  };
  // Modify fetchUsers to handle token issues
  const fetchUsers = async () => {
    try {
      const headers = await getHeaders();
      if (!headers.Authorization) {
        Alert.alert('Session Expired', 'Please login again to continue.');
        handleLogout();
        return;
      }
      
      // Fixed URL - removed the "=" typo
      console.log('Making request to:', `${API_ENDPOINT}/user`);
      const response = await axios.get(`${API_ENDPOINT}/user`, { headers });
      console.log('Fetch users response status:', response.status);
      setUsers(response.data);
    } catch (error) {
      // Your error handling code...
    }
  };
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token'); // Remove the authentication token
      Alert.alert('Logged Out', 'You have been logged out successfully.');
      navigation.dispatch(StackActions.replace('Login')); // Navigate back to Login
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };


  const confirmDelete = (userId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteUser(userId) }
      ]
    );
  };

  const deleteUser = async (userId) => {
    try {
      const headers = await getHeaders();
      console.log('Attempting to delete user:', userId); // Add logging
      
      const response = await axios.delete(`${API_ENDPOINT}/user/${userId}`, { headers });
      console.log('Delete response:', response.data); // Log the response
      
      Alert.alert('Success', 'User successfully deleted');
      setUsers(users.filter(user => user.user_id !== userId));
    } catch (error) {
      console.error('Delete error details:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.error || 
                            error.response?.data?.message || 
                            'Failed to delete user. Please try awgain.';
      
      Alert.alert('Error', errorMessage);
    }
  };

  const createUser = async () => {
    // Check if all fields are filled
    if (!fullname || !username || !password) {
      Alert.alert('Warning', 'All fields are required.');
      return;
    }

    try {
      const headers = await getHeaders();
      const { data } = await axios.post(
        `${API_ENDPOINT}/user`,
        {
          fullname,
          username,
          password,
        },
        { headers }
      );

      // Show success message
      Alert.alert('Success', 'User created successfully.');

      // Clear form fields
      setFullname('');
      setUsername('');
      setPassword('');

      // Update the users list with the newly created user
      if (data) {
        setUsers((prevUsers) => [...prevUsers, data]);
      }

      // Close the modal
      setShowCreate(false);
    } catch (error) {
      console.error('Create User Error:', error);
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
      Alert.alert('Error', errorMessage);
    }
  };

  const updateUser = async () => {
    // Validate that required fields are provided
    if (!fullname || !username) {
      Alert.alert('Warning', 'Fullname and Username are required.');
      return;
    }

    // Check if a user is selected
    if (!selectedUser || !selectedUser.user_id) {
      Alert.alert('Error', 'No user selected or invalid user ID.');
      return;
    }

    // Rest of your function...
    const updateData = {
      fullname,
      username,
      ...(password ? { password } : {})
    };

    try {
      const headers = await getHeaders();
      console.log('Sending update for user:', selectedUser.user_id);
      console.log('Update data:', updateData);
      
      const { data } = await axios.put(
        `${API_ENDPOINT}/user/${selectedUser.user_id}`,
        updateData,
        { headers }
      );

      // Check if the response contains a success message
      Alert.alert('Success', data.message || 'User successfully updated.');

      // Update the users list in the state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === selectedUser.user_id
            ? { ...user, fullname, username }
            : user
        )
      );

      // Reset form fields and close modal
      setFullname('');
      setUsername('');
      setPassword('');
      setShowUpdate(false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update user. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleShowUpdate = (user) => {
    setSelectedUser(user);
    setFullname(user.fullname);
    setUsername(user.username);
    setPassword('');
    setShowUpdate(true);
  };

  const handleShowRead = (user) => {
    setSelectedUser(user);
    setShowRead(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userId}>ID: {item.user_id}</Text>
        <Text style={styles.userName}>{item.fullname}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.readButton]} 
          onPress={() => handleShowRead(item)}
        >
          <Icon name="visibility" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.updateButton]} 
          onPress={() => handleShowUpdate(item)}
        >
          <Icon name="edit" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => confirmDelete(item.user_id)}
        >
          <Icon name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

    return (
        <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#4a148c" barStyle="light-content" />

        <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
            <View style={styles.titleContainer}>
            <Text style={styles.title}>Users List</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => setShowCreate(true)}>
                <Icon name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create User</Text>
            </TouchableOpacity>
            </View>
            
            <FlatList
            data={users}
            renderItem={renderItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            ListEmptyComponent={() => (
                <Text style={styles.emptyList}>No users found</Text>
            )}
            />
        </View>

        {/* Create User Modal */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={showCreate}
            onRequestClose={() => setShowCreate(false)}
        >
            <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create User</Text>
                
                <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={fullname}
                    onChangeText={setFullname}
                    placeholder="Enter full name"
                />
                </View>
                
                <View style={styles.formGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
                />
                </View>
                
                <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    secureTextEntry
                />
                </View>
                
                <View style={styles.modalActions}>
                <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setShowCreate(false)}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton]} 
                    onPress={createUser}
                >
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </Modal>

        {/* Update User Modal */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={showUpdate}
            onRequestClose={() => setShowUpdate(false)}
        >
            <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Update User</Text>
                
                <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={fullname}
                    onChangeText={setFullname}
                    placeholder="Enter full name"
                />
                </View>
                
                <View style={styles.formGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
                />
                </View>
                
                <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Leave blank to keep current password"
                    secureTextEntry
                />
                </View>
                
                <View style={styles.modalActions}>
                <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setShowUpdate(false)}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.modalButton, styles.updateModalButton]} 
                    onPress={updateUser}
                >
                    <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </Modal>

        {/* Read User Modal */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={showRead}
            onRequestClose={() => setShowRead(false)}
        >
            <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>User Details</Text>
                
                {selectedUser ? (
                <View style={styles.userDetails}>
                    <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ID:</Text>
                    <Text style={styles.detailValue}>{selectedUser.user_id}</Text>
                    </View>
                    <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Full Name:</Text>
                    <Text style={styles.detailValue}>{selectedUser.fullname}</Text>
                    </View>
                    <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Username:</Text>
                    <Text style={styles.detailValue}>{selectedUser.username}</Text>
                    </View>
                </View>
                ) : (
                <Text>No data available</Text>
                )}
                
                <TouchableOpacity 
                style={[styles.modalButton, styles.closeButton]} 
                onPress={() => setShowRead(false)}
                >
                <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
            </View>
        </Modal>
        </SafeAreaView>
    );
    }
    const styles = StyleSheet.create({
        container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        },
        loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        },
        header: {
        backgroundColor: '#4a148c',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        },
        headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        },
        headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        },
        playButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
        },
        playButtonText: {
        color: '#4a148c',
        fontWeight: 'bold',
        },
        logoutButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
  paddingHorizontal: 16,
  backgroundColor: '#d32f2f', // Red color for logout
  borderRadius: 25, // More rounded look
  elevation: 3, // Android shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
        },
        content: {
        flex: 1,
        padding: 16,
        },
        titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        },
        title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        },
        createButton: {
        backgroundColor: '#00c853',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        },
        createButtonText: {
        color: '#fff',
        fontWeight: '500',
        marginLeft: 4,
        },
        userItem: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        },
        userInfo: {
        flex: 1,
        },
        userId: {
        color: '#666',
        fontSize: 12,
        marginBottom: 4,
        },
        userName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
        },
        userUsername: {
        color: '#666',
        fontSize: 14,
        },
        actionButtons: {
        flexDirection: 'row',
        },
        actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        },
        readButton: {
        backgroundColor: '#2196f3',
        },
        updateButton: {
        backgroundColor: '#ff9800',
        },
        deleteButton: {
        backgroundColor: '#f44336',
        },
        modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        },
        modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        },
        modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
        textAlign: 'center',
        },
        formGroup: {
        marginBottom: 16,
        },
        label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
        },
        input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        },
        modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        },
        modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        },
        cancelButton: {
        backgroundColor: '#f5f5f5',
        marginRight: 8,
        },
        cancelButtonText: {
        color: '#666',
        fontWeight: '500',
        },
        saveButton: {
        backgroundColor: '#00c853',
        },
        saveButtonText: {
        color: '#fff',
        fontWeight: '500',
        },
        updateModalButton: {
        backgroundColor: '#ff9800',
        },
        updateButtonText: {
        color: '#fff',
        fontWeight: '500',
        },
        closeButton: {
        backgroundColor: '#2196f3',
        marginTop: 16,
        },
        closeButtonText: {
        color: '#fff',
        fontWeight: '500',
        },
        userDetails: {
        marginVertical: 8,
        },
        detailRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        },
        detailLabel: {
        width: 100,
        fontWeight: 'bold',
        color: '#666',
        },
        detailValue: {
        flex: 1,
        color: '#333',
        },
        emptyList: {
        textAlign: 'center',
        color: '#666',
        padding: 20,
        fontStyle: 'italic',
        },
    });
    export default HomePage;
