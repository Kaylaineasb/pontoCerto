import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Bubble = {
  size: number;
  top: number;
  left?: number;
  right?: number;
  opacity: number;
};

const bubbles: Bubble[] = [
  { size: 220, top: -60, left: -90, opacity: 0.18 },
  { size: 160, top: 40, right: -70, opacity: 0.14 },
  { size: 260, top: 220, left: -120, opacity: 0.12 },
  { size: 190, top: 420, right: -90, opacity: 0.12 },
  { size: 140, top: 520, left: 30, opacity: 0.10 },
  { size: 110, top: 640, right: 20, opacity: 0.10 },
];

export function BubbleBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={["#F4F7FB", "#EAF1F8"]} style={StyleSheet.absoluteFill} />

      {/* Bolhas */}
      {bubbles.map((b, idx) => (
        <View
          key={idx}
          style={[
            styles.bubble,
            {
              width: b.size,
              height: b.size,
              borderRadius: b.size / 2,
              top: b.top,
              left: b.left,
              right: b.right,
              opacity: b.opacity,
            },
          ]}
        />
      ))}

      {/* “rede” bem sutil */}
      <View style={styles.gridOverlay} />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bubble: {
    position: "absolute",
    backgroundColor: "#2A5B7A",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    transform: [{ scale: 1.05 }],
    backgroundColor: "transparent",
  },
});
