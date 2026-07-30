import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

// A single large, centered, low-opacity stethoscope watermark over a soft
// two-tone blue backdrop. Pure RN components, no image assets needed, so
// it renders identically on web, iOS, and Android.

const { width, height } = Dimensions.get("window");

export default function WatermarkBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* soft top glow layer */}
      <View style={styles.glow} />
      <Text style={styles.stethoscope}>🩺</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#eef4ff",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    top: -height * 0.2,
    width: width * 1.4,
    height: height * 0.9,
    borderRadius: width,
    backgroundColor: "#dbeafe",
    opacity: 0.5,
  },
  stethoscope: {
    fontSize: Math.min(width, height) * 0.55,
    opacity: 0.06,
  },
});
