import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onCancel: () => void;
  onCaptured: (photo: { base64: string; mime: string }) => void;
};

export function CaptureSelfieScreen({ onCancel, onCaptured }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();
    })();
  }, [permission?.granted]);

  if (!permission) {
    return <View style={styles.center}><Text>Carregando câmera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Precisamos da câmera</Text>
        <Text style={styles.subtitle}>Para registrar a foto do ponto.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Permitir câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={onCancel}>
          <Text style={styles.linkText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePhoto() {
    try {
      if (taking) return;
      setTaking(true);

      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.4,
        base64: true,
        skipProcessing: true,
      });

      if (!photo?.base64) throw new Error("Não consegui capturar a foto.");

      onCaptured({ base64: photo.base64, mime: "image/jpeg" });
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao tirar foto.");
    } finally {
      setTaking(false);
    }
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front" // ✅ trava na frontal
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onCancel} style={styles.topBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Selfie</Text>
        {/* Sem botão de trocar câmera => bloqueado */}
        <View style={styles.topBtn} />
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={takePhoto}
          style={[styles.shutter, taking && { opacity: 0.7 }]}
          disabled={taking}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        <Text style={styles.hint}>Centralize o rosto e tire a foto</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { color: "#666", textAlign: "center" },
  primaryBtn: { marginTop: 8, backgroundColor: "#0F2F4A", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  linkBtn: { padding: 8 },
  linkText: { color: "#0F2F4A", fontWeight: "700" },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 48,
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  topBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 34,
    paddingTop: 18,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  hint: { marginTop: 10, color: "rgba(255,255,255,0.9)", fontWeight: "700" },
});
