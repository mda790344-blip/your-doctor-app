import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, TouchableOpacity, Text } from "react-native";
import { StatusBar } from "expo-status-bar";

import DisclaimerScreen from "./screens/DisclaimerScreen";
import ChatScreen from "./screens/ChatScreen";
import HistoryScreen from "./screens/HistoryScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    (async () => {
      const accepted = await AsyncStorage.getItem("disclaimerAccepted");
      setInitialRoute(accepted === "true" ? "Chat" : "Disclaimer");
    })();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Disclaimer"
          component={DisclaimerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={({ navigation }) => ({
            headerTitle: () => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.headerIconCircle}>
                  <Text style={styles.headerIconText}>🩺</Text>
                </View>
                <Text style={styles.headerTitleText}>Your Doctor</Text>
              </View>
            ),
            headerStyle: { backgroundColor: "#eaf2ff" },
            headerShadowVisible: false,
            headerRight: () => (
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => navigation.navigate("History")}
              >
                <Text style={styles.historyButtonText}>🕘 History</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: "Past Conversations",
            headerStyle: { backgroundColor: "#eaf2ff" },
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = {
  headerIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerIconText: { fontSize: 16 },
  headerTitleText: { fontSize: 18, fontWeight: "700", color: "#1e3a8a" },
  historyButton: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  historyButtonText: { color: "#1e3a8a", fontWeight: "600", fontSize: 13 },
};
