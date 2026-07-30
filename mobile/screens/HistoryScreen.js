import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function HistoryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);

  // Reload every time this screen comes into focus, so a session saved
  // during a chat shows up immediately when you tap "History"
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const historyKeys = keys.filter((k) => k.startsWith("history:"));
    const pairs = await AsyncStorage.multiGet(historyKeys);

    const parsed = pairs
      .map(([key, value]) => {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    setSessions(parsed);
  };

  const openSession = (session) => {
    navigation.navigate("Chat", { sessionId: session.id });
  };

  const renderItem = ({ item }) => {
    const date = new Date(item.updatedAt);
    const preview = item.messages?.find((m) => m.type === "user")?.text || "New conversation";

    return (
      <TouchableOpacity style={styles.card} onPress={() => openSession(item)}>
        <Text style={styles.date}>
          {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
      </TouchableOpacity>
    );
  };

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No past conversations yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  date: { fontSize: 12, color: "#888", marginBottom: 4 },
  preview: { fontSize: 15, color: "#111" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyText: { color: "#888", fontSize: 15 },
});
