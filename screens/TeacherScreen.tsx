"use client"

import { useEffect, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import QRCode from "react-native-qrcode-svg"
import { v4 as uuidv4 } from "uuid"
import { createClass, getAuthInstance, getTeacherClasses, getTeacherProfile, logoutUser } from "../services/firebase-service"

interface TeacherScreenProps {
  isOnline: boolean
}

interface ClassData {
  id: string
  className: string
  batchCode: string
  subjectCode: string
  date: string
  qrCode: string
}

export default function TeacherScreen({ isOnline }: TeacherScreenProps) {
  const [teacherId, setTeacherId] = useState("")
  const [classes, setClasses] = useState<ClassData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [showQR, setShowQR] = useState(false)

  // Form states
  const [className, setClassName] = useState("")
  const [batchCode, setBatchCode] = useState("")
  const [subjectCode, setSubjectCode] = useState("")

  useEffect(() => {
    loadTeacherData()
  }, [])

  const loadTeacherData = async () => {
    try {
      setLoading(true)
      const auth = getAuthInstance()
      const user = auth.currentUser
      if (user) {
        const profile = await getTeacherProfile(user.uid)
        if (profile) {
          setTeacherId(profile.id)
          const fetchedClasses = await getTeacherClasses(profile.id)
          setClasses(fetchedClasses as ClassData[])
        }
      }
    } catch (error) {
      console.error("[Teacher] Load data error:", error)
      Alert.alert("Error", "Failed to load teacher data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClass = async () => {
    if (!className || !batchCode || !subjectCode) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    try {
      const today = new Date().toISOString().split("T")[0]
      const qrCode = uuidv4()
      const classId = await createClass(teacherId, {
        className,
        batchCode,
        subjectCode,
        date: today,
        qrCode,
      })

      setClasses([
        ...classes,
        {
          id: classId,
          className,
          batchCode,
          subjectCode,
          date: today,
          qrCode,
        },
      ])

      Alert.alert("Success", "Class created successfully")
      setModalVisible(false)
      setClassName("")
      setBatchCode("")
      setSubjectCode("")
    } catch (error) {
      console.error("[Teacher] Create class error:", error)
      Alert.alert("Error", "Failed to create class")
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      Alert.alert("Error", "Failed to logout")
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teacher Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Network Status */}
      <View style={[styles.networkStatus, isOnline ? styles.online : styles.offline]}>
        <Text style={styles.networkText}>{isOnline ? "Online" : "Offline"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Create Class Button */}
        <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.createButtonText}>+ Create New Class</Text>
        </TouchableOpacity>

        {/* Classes List */}
        {classes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No classes yet</Text>
          </View>
        ) : (
          classes.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={styles.classCard}
              onPress={() => {
                setSelectedClass(classItem)
                setShowQR(true)
              }}
            >
              <View style={styles.classCardHeader}>
                <Text style={styles.classCardTitle}>{classItem.className}</Text>
              </View>
              <Text style={styles.classCardDetail}>Batch: {classItem.batchCode}</Text>
              <Text style={styles.classCardDetail}>Subject: {classItem.subjectCode}</Text>
              <Text style={styles.classCardDetail}>Date: {classItem.date}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Class Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Class</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Class Name" value={className} onChangeText={setClassName} />
            <TextInput style={styles.input} placeholder="Batch Code" value={batchCode} onChangeText={setBatchCode} />
            <TextInput
              style={styles.input}
              placeholder="Subject Code"
              value={subjectCode}
              onChangeText={setSubjectCode}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleCreateClass}>
              <Text style={styles.submitButtonText}>Create Class</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Code Display Modal */}
      <Modal visible={showQR} animationType="slide" transparent>
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <TouchableOpacity
              style={styles.qrCloseButton}
              onPress={() => {
                setShowQR(false)
                setSelectedClass(null)
              }}
            >
              <Text style={styles.qrCloseText}>✕</Text>
            </TouchableOpacity>

            {selectedClass && (
              <>
                <Text style={styles.qrTitle}>Class QR Code</Text>
                <Text style={styles.qrClassInfo}>{selectedClass.className}</Text>

                <View style={styles.qrCodeContainer}>
                  <QRCode value={selectedClass.qrCode} size={250} backgroundColor="white" color="black" />
                </View>

                <Text style={styles.qrNote}>Ask students to scan this QR code to mark attendance</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#1a73e8",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  networkStatus: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    margin: 10,
    borderRadius: 6,
  },
  online: {
    backgroundColor: "#d4edda",
  },
  offline: {
    backgroundColor: "#f8d7da",
  },
  networkText: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 12,
  },
  content: {
    padding: 20,
  },
  createButton: {
    backgroundColor: "#1a73e8",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  createButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  classCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#1a73e8",
  },
  classCardHeader: {
    marginBottom: 10,
  },
  classCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a73e8",
  },
  classCardDetail: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a73e8",
  },
  closeButton: {
    fontSize: 24,
    color: "#999",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#1a73e8",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  qrModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  qrCloseButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  qrCloseText: {
    fontSize: 28,
    color: "#999",
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a73e8",
    marginBottom: 10,
  },
  qrClassInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 20,
  },
  qrNote: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
})
