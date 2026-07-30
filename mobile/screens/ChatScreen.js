import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { API_BASE_URL } from "../config";
import WatermarkBackground from "../components/WatermarkBackground";

const URGENCY_COLORS = {
  EMERGENCY: "#dc2626",
  SEE_DOCTOR_SOON: "#f59e0b",
  SELF_CARE_OK: "#16a34a",
  MONITOR: "#2563eb",
};

const URGENCY_LABELS = {
  EMERGENCY: "EMERGENCY -- Seek care now",
  SEE_DOCTOR_SOON: "See a doctor soon",
  SELF_CARE_OK: "Self-care likely OK",
  MONITOR: "Monitor",
};

const WELCOME_MESSAGE = {
  id: "welcome",
  type: "ai_text",
  text: "Hi, I'm Your Doctor. Describe what you're experiencing and I'll ask a few follow-up questions before suggesting what to do next.",
};

export default function ChatScreen({ route }) {
  const existingSessionId = route?.params?.sessionId;
  const [sessionId] = useState(existingSessionId || Date.now().toString());
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [history, setHistory] = useState([]); // raw role/content pairs sent to backend
  const [attachment, setAttachment] = useState(null); // { name, uri, kind: "image"|"file" }
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(!!existingSessionId);
  const listRef = useRef(null);

  // If opened from History with a sessionId, load that saved conversation
  useEffect(() => {
    if (!existingSessionId) return;
    (async () => {
      const raw = await AsyncStorage.getItem(`history:${existingSessionId}`);
      if (raw) {
        const saved = JSON.parse(raw);
        setMessages(saved.messages || [WELCOME_MESSAGE]);
        setHistory(saved.rawHistory || []);
      }
      setLoadingSession(false);
    })();
  }, [existingSessionId]);

  // Persist this session to AsyncStorage every time messages change
  useEffect(() => {
    if (loadingSession) return; // don't save while we're still loading an old session
    if (messages.length <= 1) return; // don't save an empty/untouched session
    AsyncStorage.setItem(
      `history:${sessionId}`,
      JSON.stringify({
        id: sessionId,
        updatedAt: Date.now(),
        messages,
        rawHistory: history,
      })
    );
  }, [messages, history, loadingSession]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setAttachment({ name: asset.fileName || "photo.jpg", uri: asset.uri, kind: "image" });
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (asset) {
      setAttachment({ name: asset.name, uri: asset.uri, kind: "file" });
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachment) || loading) return;

    const currentAttachment = attachment;
    const userMsg = {
      id: Date.now().toString(),
      type: "user",
      text: trimmed || (currentAttachment ? `Attached: ${currentAttachment.name}` : ""),
      attachment: currentAttachment,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachment(null);
    setLoading(true);

    // Note: the current backend model is text-only. If a file/photo is
    // attached, we tell the AI it exists so it can ask the user to
    // describe what's in it, rather than silently ignoring it.
    const messageForAI = currentAttachment
      ? `${trimmed}\n[User attached a ${currentAttachment.kind} named "${currentAttachment.name}". You cannot see its contents -- ask the user to describe what it shows.]`
      : trimmed;

    try {
      const response = await fetch(`${API_BASE_URL}/api/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageForAI, history }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setHistory((prev) => [
        ...prev,
        { role: "user", content: messageForAI },
        { role: "assistant", content: JSON.stringify(data) },
      ]);

      if (data.urgency === "EMERGENCY") {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "e", type: "emergency", data },
        ]);
      } else if (data.needsMoreInfo) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "q", type: "ai_text", text: data.followUpQuestion },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "r", type: "result", data },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "err",
          type: "ai_text",
          text: "Something went wrong reaching the assistant. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === "user") {
      return (
        <View style={[styles.bubble, styles.userBubble]}>
          {item.attachment?.kind === "image" && (
            <Image source={{ uri: item.attachment.uri }} style={styles.attachedImage} />
          )}
          {item.attachment?.kind === "file" && (
            <Text style={styles.attachedFileText}>📎 {item.attachment.name}</Text>
          )}
          {!!item.text && <Text style={styles.userText}>{item.text}</Text>}
        </View>
      );
    }

    if (item.type === "ai_text") {
      return (
        <View style={[styles.bubble, styles.aiBubble]}>
          <Text style={styles.aiText}>{item.text}</Text>
        </View>
      );
    }

    if (item.type === "emergency") {
      return (
        <View style={[styles.bubble, styles.emergencyBubble]}>
          <Text style={styles.emergencyTitle}>⚠ {URGENCY_LABELS.EMERGENCY}</Text>
          <Text style={styles.emergencyText}>{item.data.message}</Text>
        </View>
      );
    }

    if (item.type === "result") {
      const { data } = item;
      const color = URGENCY_COLORS[data.urgency] || "#666";
      return (
        <View style={[styles.bubble, styles.aiBubble]}>
          <View style={[styles.urgencyTag, { backgroundColor: color }]}>
            <Text style={styles.urgencyTagText}>{URGENCY_LABELS[data.urgency] || data.urgency}</Text>
          </View>
          <Text style={styles.aiText}>{data.explanation}</Text>
          {data.possibleAreas?.length > 0 && (
            <Text style={styles.subtleText}>Related areas: {data.possibleAreas.join(", ")}</Text>
          )}
          {data.selfCareSuggestions?.length > 0 && (
            <View style={styles.selfCareBox}>
              <Text style={styles.selfCareTitle}>Self-care suggestions:</Text>
              {data.selfCareSuggestions.map((tip, i) => (
                <Text key={i} style={styles.selfCareItem}>• {tip}</Text>
              ))}
            </View>
          )}
          <Text style={styles.subtleText}>Suggested action: {data.suggestedAction}</Text>
          <Text style={styles.disclaimer}>{data.disclaimer}</Text>
        </View>
      );
    }

    return null;
  };

  if (loadingSession) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <WatermarkBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        {attachment && (
          <View style={styles.attachmentPreviewRow}>
            {attachment.kind === "image" ? (
              <Image source={{ uri: attachment.uri }} style={styles.previewThumb} />
            ) : (
              <Text style={styles.previewFileText}>📎 {attachment.name}</Text>
            )}
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <Text style={styles.removeAttachment}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
            <Text style={styles.iconButtonText}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={pickFile}>
            <Text style={styles.iconButtonText}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Describe what you're feeling..."
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: "85%",
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
  },
  userText: { color: "#fff", fontSize: 15, lineHeight: 21 },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  aiText: { color: "#1e293b", fontSize: 15, lineHeight: 22 },
  emergencyBubble: {
    alignSelf: "stretch",
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#dc2626",
    borderRadius: 16,
  },
  emergencyTitle: { color: "#dc2626", fontWeight: "700", fontSize: 16, marginBottom: 6 },
  emergencyText: { color: "#7f1d1d", fontSize: 15, lineHeight: 21 },
  urgencyTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  urgencyTagText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  subtleText: { color: "#555", fontSize: 13, marginTop: 6 },
  selfCareBox: {
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  selfCareTitle: { color: "#065f46", fontWeight: "700", fontSize: 13, marginBottom: 4 },
  selfCareItem: { color: "#065f46", fontSize: 13, lineHeight: 19 },
  disclaimer: { color: "#888", fontSize: 11, marginTop: 10, fontStyle: "italic" },
  loadingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 4 },
  loadingText: { marginLeft: 8, color: "#666", fontSize: 13 },
  attachedImage: { width: 160, height: 120, borderRadius: 8, marginBottom: 6 },
  attachedFileText: { color: "#fff", fontSize: 13, marginBottom: 4 },
  attachmentPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  previewThumb: { width: 48, height: 48, borderRadius: 8, marginRight: 10 },
  previewFileText: { flex: 1, color: "#333", fontSize: 13 },
  removeAttachment: { color: "#dc2626", fontSize: 13, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    alignItems: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eaf2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  iconButtonText: { fontSize: 17 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
    backgroundColor: "#f8fafc",
  },
  sendButton: {
    backgroundColor: "#2563eb",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
