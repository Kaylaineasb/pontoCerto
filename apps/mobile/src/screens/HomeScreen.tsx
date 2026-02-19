import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { BubbleBackground } from "../components/BubbleBackground";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { CaptureSelfieScreen } from "./CaptureSelfieScreen";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

type TimeEntryType = "IN" | "BREAK_START" | "BREAK_END" | "OUT";

type TodayResponse = {
  date: string;
  entries: { id: string; type: TimeEntryType; timestamp: string }[];
  lastEntry: { id: string; type: TimeEntryType; timestamp: string } | null;
  nextExpected: TimeEntryType | null;
  isComplete: boolean;
  summary?: {
    workedSeconds: number;
    breakSeconds: number;
    balanceSeconds: number;
    dailyWorkSeconds: number;
  };
};

function formatDuration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatSignedDuration(seconds: number) {
  const sign = seconds >= 0 ? "+" : "-";
  return sign + formatDuration(Math.abs(seconds));
}

function labelType(t: TimeEntryType) {
  switch (t) {
    case "IN": return "ENTRADA";
    case "BREAK_START": return "SAÍDA ALMOÇO";
    case "BREAK_END": return "VOLTA ALMOÇO";
    case "OUT": return "SAÍDA";
  }
}

function formatHHMM(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatHeaderDate(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd} ${mm} ${yyyy}`;
}

export default function HomeScreen() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loadingToday, setLoadingToday] = useState(false);

  const [locOk, setLocOk] = useState<boolean | null>(null);
  const [photoOk, setPhotoOk] = useState<boolean | null>(null);

  const [punching, setPunching] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const [pendingLoc, setPendingLoc] = useState<{ latitude: number; longitude: number; accuracyM: number } | null>(null);
  const [tab, setTab] = useState<"IN_PROGRESS" | "DONE">("IN_PROGRESS");
  const isComplete = !!data?.isComplete;

  async function loadToday() {
    try {
      setLoadingToday(true);
      const res = await api.get("/time-entries/today");
      setData(res.data);
    } catch (e: any) {
      Alert.alert("Erro", e?.response?.data?.message ?? e.message ?? "Falha ao carregar status do dia.");
    } finally {
      setLoadingToday(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadToday();
    }, [])
  );

  const lastLabel = data?.lastEntry ? labelType(data.lastEntry.type) : "—";
  const lastTime = data?.lastEntry ? formatHHMM(data.lastEntry.timestamp) : "--:--";
  const nextLabel = data?.nextExpected ? labelType(data.nextExpected) : (data?.isComplete ? "COMPLETO" : "—");

  const header = useMemo(() => formatHeaderDate(data?.date), [data?.date]);

  // ---- helpers: permissions + capture
  async function ensureLocationPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permissão de localização negada.");
    }
  }

  async function getCurrentLocation() {
    await ensureLocationPermission();
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracyM: pos.coords.accuracy ?? 0,
    };
  }

  async function onPunch() {
    if (punching) return;

    if (!data?.nextExpected) {
      Alert.alert("Atenção", "Não há próxima batida esperada.");
      return;
    }

    Alert.alert(
      "Permissão necessária",
      "Precisamos acessar sua localização e câmera para registrar o ponto com segurança.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: async () => {
            try {
              setPunching(true);
              setLocOk(null);
              setPhotoOk(null);

              // 1️⃣ GPS
              const loc = await getCurrentLocation();
              setLocOk(true);
              setPendingLoc(loc);

              // 2️⃣ Abre a tela de selfie (frontal travada)
              setShowCamera(true);
            } catch (e: any) {
              setLocOk(false);
              Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao pegar localização.");
              setPunching(false);
            }
          },
        },
      ]
    );
  }

  useEffect(() => {
    if (!data) return;
    setTab(data.isComplete ? "DONE" : "IN_PROGRESS");
  }, [data?.isComplete]);

  if (showCamera) {
    return (
      <CaptureSelfieScreen
        onCancel={() => {
          setShowCamera(false);
          setPendingLoc(null);
        }}
        onCaptured={async (photo) => {
          try {
            if (!data?.nextExpected) return;
            if (!pendingLoc) throw new Error("Localização não encontrada.");

            setPhotoOk(true);

            await api.post("/time-entries", {
              type: data.nextExpected,
              latitude: pendingLoc.latitude,
              longitude: pendingLoc.longitude,
              accuracyM: pendingLoc.accuracyM,
              photoBase64: photo.base64,
              photoMime: photo.mime,
            });

            setShowCamera(false);
            setPendingLoc(null);

            Alert.alert("Sucesso", "Ponto registrado!");
            await loadToday();
          } catch (e: any) {
            Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao registrar ponto.");
          } finally {
            setPunching(false);
          }
        }}

      />
    );
  }

  const worked = data?.summary ? formatDuration(data.summary.workedSeconds) : "—";
  const brk = data?.summary ? formatDuration(data.summary.breakSeconds) : "—";
  const bal = data?.summary ? formatSignedDuration(data.summary.balanceSeconds) : "—";

  const balColor =
    !data?.summary ? "#7A8A9A" :
      data.summary.balanceSeconds >= 0 ? "#2F8F4E" : "#C0392B";
  return (
    <BubbleBackground>
      <View style={styles.screen}>
        {/* Top bar */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.hi}>Bom dia, Kay 👋</Text>
            <Text style={styles.date}>Hoje: {header}</Text>
          </View>

        </View>

        {/* Tabs (visual) */}
        <View style={styles.tabs}>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isComplete}
            onPress={() => setTab("IN_PROGRESS")}
            style={[
              styles.tab,
              tab === "IN_PROGRESS" && styles.tabActive,
              isComplete && { opacity: 0.45 }, // visual de bloqueado
            ]}
          >
            <Text style={tab === "IN_PROGRESS" ? styles.tabActiveText : styles.tabText}>
              EM ANDAMENTO
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setTab("DONE")}
            style={[styles.tab, tab === "DONE" && styles.tabActive]}
          >
            <Text style={tab === "DONE" ? styles.tabActiveText : styles.tabText}>
              COMPLETO
            </Text>
          </TouchableOpacity>
        </View>



        {/* Card */}
        <View style={styles.card}>
          {loadingToday ? (
            <View style={{ paddingVertical: 18 }}>
              <ActivityIndicator />
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Última batida:</Text>
              <View style={styles.lastRow}>
                <Text style={styles.lastTime}>{lastTime}</Text>
                <Text style={styles.lastLabel}>{lastLabel}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Próxima batida esperada:</Text>
              <View style={styles.nextChip}>
                <Ionicons name="location-outline" size={16} color="#1C2C3A" />
                <Text style={styles.nextChipText}>{nextLabel}</Text>
              </View>

              {tab === "IN_PROGRESS" && !data?.isComplete ? (
                <TouchableOpacity
                  style={[styles.punchBtn, punching && { opacity: 0.7 }]}
                  onPress={onPunch}
                  disabled={punching}
                >
                  <Text style={styles.punchText}>
                    {punching ? "REGISTRANDO..." : "BATER PONTO"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ paddingVertical: 10 }}>
                  <Text style={{ fontWeight: "900", color: "#0F2F4A" }}>
                    {data?.isComplete ? "Jornada finalizada" : "Sem batidas no dia"}
                  </Text>
                </View>
              )}


              <View style={{ marginTop: 12, gap: 8 }}>
                {data?.entries?.map((e) => (
                  <View
                    key={e.id}
                    style={{ flexDirection: "row", justifyContent: "space-between" }}
                  >
                    <Text style={{ fontWeight: "900", color: "#0F2F4A" }}>
                      {formatHHMM(e.timestamp)}
                    </Text>
                    <Text style={{ fontWeight: "800", color: "#7A8A9A" }}>
                      {labelType(e.type)}
                    </Text>
                  </View>
                ))}
              </View>


              <View style={styles.divider} />

              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <Ionicons name="location-sharp" size={16} color={locOk === false ? "#C0392B" : "#2F8F4E"} />
                  <Text style={styles.statusText}>Localização:</Text>
                  <Text style={[styles.statusValue, { color: locOk === false ? "#C0392B" : "#2F8F4E" }]}>
                    {locOk === null ? "pendente" : locOk ? "OK" : "erro"}
                  </Text>
                </View>

                <View style={styles.statusItem}>
                  <Ionicons name="camera" size={16} color={photoOk === false ? "#C0392B" : (photoOk ? "#2F8F4E" : "#7A8A9A")} />
                  <Text style={styles.statusText}>Foto:</Text>
                  <Text style={[styles.statusValue, { color: photoOk === false ? "#C0392B" : (photoOk ? "#2F8F4E" : "#7A8A9A") }]}>
                    {photoOk === null ? "pendente" : photoOk ? "OK" : "erro"}
                  </Text>
                </View>
              </View>

              {/* Resumo rápido (placeholder por enquanto) */}
              <Text style={styles.quickTitle}>Resumo rápido (hoje)</Text>

              <View style={styles.quickRow}>
                <Ionicons name="hourglass-outline" size={16} color="#7A8A9A" />
                <Text style={styles.quickText}>
                  Trabalhado: <Text style={styles.quickBold}>{worked}</Text>
                </Text>
              </View>

              <View style={styles.quickRow}>
                <Ionicons name="time-outline" size={16} color="#7A8A9A" />
                <Text style={styles.quickText}>
                  Intervalo: <Text style={styles.quickBold}>{brk}</Text>
                </Text>
              </View>

              <View style={styles.quickRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={balColor} />
                <Text style={styles.quickText}>
                  Saldo do dia (previsto):{" "}
                  <Text style={[styles.quickBold, { color: balColor }]}>{bal}</Text>
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 22, paddingTop: 42, paddingBottom: 110 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hi: { fontSize: 22, fontWeight: "800", color: "#0F2F4A" },
  date: { marginTop: 4, fontSize: 13, color: "#7A8A9A" },

  rightTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center", justifyContent: "center",
  },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#ddd" },

  tabs: {
    flexDirection: "row",
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 16,
    padding: 4,
    alignSelf: "flex-start",
  },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14 },
  tabActive: { backgroundColor: "#D9F0E2" },
  tabText: { fontSize: 12, color: "#7A8A9A", fontWeight: "700" },
  tabActiveText: { fontSize: 12, color: "#2F8F4E", fontWeight: "800" },

  card: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  sectionTitle: { fontSize: 13, color: "#7A8A9A", marginBottom: 8 },
  lastRow: { flexDirection: "row", alignItems: "center" },
  lastTime: { fontSize: 28, fontWeight: "900", color: "#0F2F4A", marginRight: 10 },
  lastLabel: { fontSize: 16, fontWeight: "800", color: "#0F2F4A" },

  divider: { height: 1, backgroundColor: "#E6EEF6", marginVertical: 12 },

  nextChip: {
    height: 34,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#E9F2FB",
    borderWidth: 1,
    borderColor: "#D7E1EC",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  nextChipText: { fontSize: 13, fontWeight: "800", color: "#0F2F4A" },

  punchBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "#0F2F4A",
    alignItems: "center",
    justifyContent: "center",
  },
  punchText: { color: "#FFF", fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },

  statusRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  statusItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusText: { fontSize: 13, color: "#0F2F4A", fontWeight: "700" },
  statusValue: { fontSize: 13, fontWeight: "900" },

  quickTitle: { marginTop: 14, fontSize: 13, fontWeight: "900", color: "#0F2F4A" },
  quickRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  quickText: { fontSize: 13, color: "#7A8A9A" },
  quickBold: { fontWeight: "900", color: "#0F2F4A" },
});
