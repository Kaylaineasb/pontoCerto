import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { api } from "../services/api";
import { Ionicons } from "@expo/vector-icons";


type TimeEntryType = "IN" | "BREAK_START" | "BREAK_END" | "OUT";

type TimeEntryItem = {
    id: string;
    type: TimeEntryType;
    sequence: number;
    timestamp: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracyM?: number | null;
    photoBase64?: string | null;
    photoMime?: string | null;
};

type DayResponse =
    | { date: string; items: TimeEntryItem[] }     // ✅ formato provável
    | { date: string; entries: TimeEntryItem[] };  // ✅ se você já tiver entries

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

export default function HistoryDayScreen() {
    const route = useRoute<any>();
    const date: string = route.params?.date;

    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState<TimeEntryItem[]>([]);

    const load = useCallback(async () => {
        try {
            setLoading(true);

            const res = await api.get<DayResponse>(`/time-entries/${date}`);

            // ✅ pega tanto items quanto entries, e sempre vira array
            const list = ("items" in res.data ? res.data.items : res.data.entries) ?? [];

            setEntries(list);
        } catch (e: any) {
            Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao carregar o dia.");
        } finally {
            setLoading(false);
        }
    }, [date]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Dia {date}</Text>

            {loading ? (
                <View style={{ marginTop: 20 }}>
                    <ActivityIndicator />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                    {entries.length === 0 ? (
                        <Text style={{ marginTop: 16, color: "#7A8A9A" }}>Sem batidas nesse dia.</Text>
                    ) : (
                        entries
                            .slice()
                            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                            .map((e) => (
                                <View key={e.id} style={styles.row}>
                                    <Text style={styles.time}>{formatHHMM(e.timestamp)}</Text>
                                    <Text style={styles.type}>{labelType(e.type)}</Text>
                                </View>
                            ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, padding: 22, paddingTop: 42, backgroundColor: "transparent" },
    title: { fontSize: 20, fontWeight: "900", color: "#0F2F4A" },
    row: {
        marginTop: 10,
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 14,
        padding: 14,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    time: { fontSize: 16, fontWeight: "900", color: "#0F2F4A" },
    type: { fontSize: 13, fontWeight: "800", color: "#7A8A9A" },
});
