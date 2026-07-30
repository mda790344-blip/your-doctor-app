import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DisclaimerScreen({ navigation }) {
  const handleAccept = async () => {
    await AsyncStorage.setItem("disclaimerAccepted", "true");
    navigation.replace("Chat");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>🩺</Text>
      </View>

      <Text style={styles.brand}>Your Doctor</Text>
      <Text style={styles.title}>Before you start</Text>

      <View style={styles.card}>
        <Text style={styles.body}>
          This app is a symptom triage tool. It is designed to help you decide
          how urgently you may need to seek medical care.
        </Text>

        <Text style={styles.bold}>It is NOT a diagnosis.</Text>

        <Text style={styles.body}>
          The AI assistant in this app does not replace a licensed doctor. It
          cannot examine you, run tests, or access your full medical history.
          Its suggestions are for informational purposes only.
        </Text>

        <Text style={styles.body}>
          If you are experiencing a medical emergency, do not use this app --
          call your local emergency number immediately.
        </Text>

        <Text style={styles.body}>
          By continuing, you acknowledge that this tool provides general
          guidance only and that you should always consult a licensed
          healthcare provider for any medical concerns.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAccept}>
        <Text style={styles.buttonText}>I understand, continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 70,
    flexGrow: 1,
    backgroundColor: "#eef4ff",
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconText: { fontSize: 34 },
  brand: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563eb",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1e293b",
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 14,
    color: "#475569",
  },
  bold: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
    color: "#dc2626",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 24,
    width: "100%",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
