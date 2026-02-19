import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BubbleBackground } from "../components/BubbleBackground";
import { listTimeEntries, TimeEntryListItem } from "../services/timeEntries";
import { RootStackParamList } from "../navigation/RootNavigator";

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function groupByDate(items: TimeEntryListItem[]) {
  const map = new Map<string, TimeEntryListItem[]>();

  for (const it of items) {
    const day = it.localDate ?? it.timestamp.slice(0, 10); // YYYY-MM-DD
    const arr = map.get(day) ?? [];
    arr.push(it);
    map.set(day, arr);
  }

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, entries]) => ({
      date,
      entries: entries.sort((x, y) => (x.sequence ?? 0) - (y.sequence ?? 0)),
    }));
}

export default function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<{ date: string; entries: TimeEntryListItem[] }[]>([]);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 14);
    return { from: toISODate(from), to: toISODate(to) };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listTimeEntries(range.from, range.to);
      setRows(groupByDate(data));
    } catch (e: any) {
      Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao carregar histórico");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <BubbleBackground>
      <View style={styles.screen}>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subtitle}>Período: {range.from} → {range.to}</Text>

        {loading ? (
          <View style={{ marginTop: 18 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            style={{ marginTop: 14 }}
            contentContainerStyle={{ paddingBottom: 120 }} // por causa da tabbar flutuante
            data={rows}
            keyExtractor={(it) => it.date}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.getParent()?.navigate("HistoryDay", { date: item.date })}
              >
                <Text style={styles.cardDate}>{item.date}</Text>
                <Text style={styles.cardMeta}>{item.entries.length} batidas</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ marginTop: 20, color: "#7A8A9A" }}>Sem registros no período.</Text>}
          />
        )}
      </View>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 22, paddingTop: 42, paddingBottom: 110 },
  title: { fontSize: 22, fontWeight: "900", color: "#0F2F4A" },
  subtitle: { marginTop: 4, color: "#7A8A9A" },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardDate: { fontSize: 16, fontWeight: "900", color: "#0F2F4A" },
  cardMeta: { marginTop: 4, color: "#7A8A9A", fontWeight: "700" },
});
