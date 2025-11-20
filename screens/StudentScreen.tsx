
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Camera, useCameraDevices } from "react-native-vision-camera"
import { useCode } from "vision-camera-code-scanner"
import { getAuthInstance, getClassByQR, getStudentProfile, logoutUser, recordAttendance } from "../services/firebase-service"
import { checkNetworkStatus } from "../services/network-service"
import { addToQueue, getQueue } from "../services/queue-service"

interface StudentScreenProps {
  isOnline: boolean
}

interface ScannedClass {
  id: string
  className: string
  batchCode: string
  subjectCode: string
  date: string
}

export default function StudentScreen({ isOnline }: StudentScreenProps) {
  const [studentId, setStudentId] = useState("")
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scannedClass, setScannedClass] = useState<ScannedClass | null>(null)
  const [queueCount, setQueueCount] = useState(0)
  const cameraRef = useRef(null)
  const devices = useCameraDevices()
  const device = devices.back

  const code = useCode({
    codeTypes: ["qr"],
    onCodeScanned: handleCodeScanned,
  })

  useEffect(() => {
    requestCameraPermission()
    loadStudentData()
    checkQueue()
  }, [])

  const requestCameraPermission = async () => {
    const cameraPermission = await Camera.requestCameraPermission()
    setHasPermission(cameraPermission === "granted")
  }

  const loadStudentData = async () => {
    try {
      const auth = getAuthInstance()
      const user = auth.currentUser
      if (user) {
        const profile = await getStudentProfile(user.uid)
        if (profile) {
          setStudentId(profile.id)
        }
      }
    } catch (error) {
      console.error("[Student] Load data error:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkQueue = async () => {
    try {
      const queue = await getQueue()
      setQueueCount(queue.length)
    } catch (error) {
      console.error("[Student] Check queue error:", error)
    }
  }

  async function handleCodeScanned(codes: any[]) {
    if (scanning || codes.length === 0) return

    setScanning(true)
    try {
      const qrValue = codes[0].value
      console.log("[Student] Scanned QR:", qrValue)

      const classData = await getClassByQR(qrValue)
      if (classData) {
        setScannedClass({
          id: classData.id,
          className: classData.className,
          batchCode: classData.batchCode,
          subjectCode: classData.subjectCode,
          date: classData.date,
        })
      } else {
        Alert.alert("Error", "Invalid QR code")
      }
    } catch (error) {
      console.error("[Student] Scan error:", error)
      Alert.alert("Error", "Failed to scan QR code")
    } finally {
      setScanning(false)
    }
  }

  const handleConfirmAttendance = async () => {
    if (!scannedClass) return

    try {
      const isOnlineNow = await checkNetworkStatus()

      if (isOnlineNow) {
        await recordAttendance(studentId, scannedClass.id)
        Alert.alert("Success", "Attendance recorded successfully")
      } else {
        await addToQueue(studentId, scannedClass.id)
        Alert.alert("Offline", "Attendance will be synced when online")
        await checkQueue()
      }

      setScannedClass(null)
    } catch (error) {
      console.error("[Student] Record attendance error:", error)
      Alert.alert("Error", "Failed to record attendance")
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      Alert.alert("Error", "Failed to logout")
    }
  }

  if (loading || !device) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    )
  }

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Camera permission not granted</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Attendance</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Network & Queue Status */}
      <View style={styles.statusBar}>
        <View style={[styles.networkStatus, isOnline ? styles.online : styles.offline]}>
          <Text style={styles.statusText}>{isOnline ? "Online" : "Offline"}</Text>
        </View>
        {queueCount > 0 && (
          <View style={styles.queueStatus}>
            <Text style={styles.statusText}>{queueCount} pending</Text>
          </View>
        )}
      </View>

      {scannedClass ? (
        // Scanned Class Display
        <ScrollView contentContainerStyle={styles.confirmedContainer}>
          <View style={styles.confirmedCard}>
            <Text style={styles.confirmedTitle}>Class Details</Text>
            <View style={styles.confirmedDetail}>
              <Text style={styles.confirmedLabel}>Class:</Text>
              <Text style={styles.confirmedValue}>{scannedClass.className}</Text>
            </View>
            <View style={styles.confirmedDetail}>
              <Text style={styles.confirmedLabel}>Batch:</Text>
              <Text style={styles.confirmedValue}>{scannedClass.batchCode}</Text>
            </View>
            <View style={styles.confirmedDetail}>
              <Text style={styles.confirmedLabel}>Subject:</Text>
              <Text style={styles.confirmedValue}>{scannedClass.subjectCode}</Text>
            </View>
            <View style={styles.confirmedDetail}>
              <Text style={styles.confirmedLabel}>Date:</Text>
              <Text style={styles.confirmedValue}>{scannedClass.date}</Text>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAttendance}>
              <Text style={styles.confirmButtonText}>Mark Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setScannedClass(null)}>
              <Text style={styles.cancelButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        // Camera View
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={code}
        //   frameProcessorFps={5}
        />
      )}

      {!scannedClass && (
        <View style={styles.cameraOverlay}>
          <View style={styles.scannerBox} />
          <Text style={styles.instructionText}>Point camera at QR code</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#1a73e8",
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
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
  statusBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  networkStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  online: {
    backgroundColor: "#4caf50",
  },
  offline: {
    backgroundColor: "#f44336",
  },
  queueStatus: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  scannerBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#1a73e8",
    borderRadius: 12,
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmedCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
  },
  confirmedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a73e8",
    marginBottom: 20,
    textAlign: "center",
  },
  confirmedDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  confirmedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  confirmedValue: {
    fontSize: 14,
    color: "#1a73e8",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  confirmButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: "#1a73e8",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#1a73e8",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#1a73e8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
})
