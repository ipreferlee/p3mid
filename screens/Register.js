import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import LoginScreen from "./LoginScreen";

const API_ENDPOINT = 'https://backend-8-br78.onrender.com/api/auth/register';

const Register = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const isStrongPassword = (password) => password.length >= 6;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const { fullname, username, password, confirmPassword } = formData;

    if (!fullname || !username || !password || !confirmPassword) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      setLoading(false);
      return;
    }

    if (!isStrongPassword(password)) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting to register with:", API_ENDPOINT);

      const response = await axios.post(API_ENDPOINT, {
        fullname,
        username,
        password,
      });

      console.log("Registration response:", response.data);

      // Ensure token exists before storing it
      if (response.data && response.data.token) {
        await AsyncStorage.removeItem("token"); // Remove old token
        await AsyncStorage.setItem("token", response.data.token); // Store new token

        setLoading(false);
        Alert.alert("Success", "Registration successful!", [
          { text: "OK", onPress: () => navigation.navigate(LoginScreen) }
        ]);
      }
    } catch (error) {
      setLoading(false);
      console.log("Registration error:", error);

      if (error.response) {
        console.log("Server responded with:", error.response.data);
        setError(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        console.log("No response received");
        setError("Network error. Please check your connection.");
      } else {
        console.log("Error:", error.message);
        setError(`Request error: ${error.message}`);
      }

      Alert.alert("Registration Failed", error.response?.data?.message || "An error occurred during registration");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      {/* Full Name Input */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.fullname}
        onChangeText={(text) => handleChange("fullname", text)}
      />

      {/* Username Input */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={formData.username}
        onChangeText={(text) => handleChange("username", text)}
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => handleChange("password", text)}
      />

      {/* Confirm Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={formData.confirmPassword}
        onChangeText={(text) => handleChange("confirmPassword", text)}
      />

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Register Button */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register Now</Text>
        )}
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Login here.</Text>
      </TouchableOpacity>
    </View>
  );
};

// Updated styles to match LoginScreen
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

export default Register;
