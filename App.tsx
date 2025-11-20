"use client"

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { NavigationContainer } from "@react-navigation/native"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useEffect, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import LoginScreen from "./screens/LoginScreen"
import StudentScreen from "./screens/StudentScreen"
import TeacherScreen from "./screens/TeacherScreen"
import { getAuthInstance, initializeFirebase } from "./services/firebase-service"
import { useNetworkStatus } from "./services/network-service"

const Tab = createBottomTabNavigator()

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<"teacher" | "student" | null>(null)
  const [loading, setLoading] = useState(true)
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    initializeFirebase()
    const auth = getAuthInstance()

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // Determine user role from localStorage or similar
        // For now, you'll need to store this during signup
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (!user) {
    return <LoginScreen setUserRole={setUserRole} />
  }

  return (
    <NavigationContainer>
      {userRole === "teacher" ? <TeacherScreen isOnline={isOnline} /> : <StudentScreen isOnline={isOnline} />}
    </NavigationContainer>
  )
}
