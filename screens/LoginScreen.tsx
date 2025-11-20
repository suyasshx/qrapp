
import { useState } from "react"
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { loginUser, registerUser } from "../services/firebase-service"

interface LoginScreenProps {
  setUserRole: (role: "teacher" | "student") => void
}

export default function LoginScreen({ setUserRole }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [isTeacher, setIsTeacher] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        await loginUser(email, password)
      } else {
        await registerUser(email, password, isTeacher ? "teacher" : "student")
      }
      setUserRole(isTeacher ? "teacher" : "student")
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Attendance App</Text>

      {/* Role Selection */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, isTeacher && styles.roleButtonActive]}
          onPress={() => setIsTeacher(true)}
        >
          <Text style={[styles.roleButtonText, isTeacher && styles.roleButtonTextActive]}>Teacher</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, !isTeacher && styles.roleButtonActive]}
          onPress={() => setIsTeacher(false)}
        >
          <Text style={[styles.roleButtonText, !isTeacher && styles.roleButtonTextActive]}>Student</Text>
        </TouchableOpacity>
      </View>

      {/* Auth Mode Selection */}
      <View style={styles.authModeContainer}>
        <TouchableOpacity
          style={[styles.authModeButton, isLogin && styles.authModeButtonActive]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={[styles.authModeText, isLogin && styles.authModeTextActive]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.authModeButton, !isLogin && styles.authModeButtonActive]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={[styles.authModeText, !isLogin && styles.authModeTextActive]}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholderTextColor="#999"
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#999"
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#1a73e8",
  },
  roleContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  roleButtonActive: {
    borderColor: "#1a73e8",
    backgroundColor: "#e8f0fe",
  },
  roleButtonText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  roleButtonTextActive: {
    color: "#1a73e8",
  },
  authModeContainer: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 10,
  },
  authModeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  authModeButtonActive: {
    borderBottomColor: "#1a73e8",
  },
  authModeText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  authModeTextActive: {
    color: "#1a73e8",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#1a73e8",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
