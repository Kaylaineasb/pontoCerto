import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { BubbleBackground } from "../components/BubbleBackground";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { useFocusEffect } from "@react-navigation/native";

type MeResponse = {
    sub: string;
    orgId: string;
    role: "ADMIN" | "EMPLOYEE";
    email: string;
    name: string;
    organization?: { id: string; name: string; timezone: string };
};

export default function AccountScreen() {
    const { signOut } = useAuth();
    const [me, setMe] = useState<MeResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const loadMe = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get<MeResponse>("/auth/me");
            setMe(res.data);
        } catch (e: any) {
            Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao carregar seus dados.");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadMe();
        }, [loadMe])
    );

    function getInitials(name?: string) {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }


    return (
        <BubbleBackground>
            <View style={{ flex: 1, padding: 22, paddingTop: 42 }}>
                <Text style={{ fontSize: 22, fontWeight: "900", color: "#0F2F4A" }}>Minha conta</Text>

                {loading ? (
                    <View style={{ marginTop: 18 }}>
                        <ActivityIndicator />
                    </View>
                ) : (
                    <View style={styles.card}>
                        <View style={styles.profileRow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {getInitials(me?.name)}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{me?.name ?? "—"}</Text>
                                <Text style={styles.sub}>{me?.email ?? "—"}</Text>

                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {me?.role === "ADMIN" ? "Administrador" : "Colaborador"}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {!!me?.organization?.name && (
                            <>
                                <View style={styles.divider} />
                                <Text style={styles.line}>
                                    Empresa: <Text style={styles.bold}>{me.organization.name}</Text>
                                </Text>
                            </>
                        )}
                    </View>

                )}

                <TouchableOpacity
                    style={{
                        marginTop: 18,
                        backgroundColor: "#0F2F4A",
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center",
                    }}
                    onPress={() => {
                        Alert.alert("Sair", "Deseja sair da conta?", [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Sair", style: "destructive", onPress: signOut },
                        ]);
                    }}
                >
                    <Text style={{ color: "#fff", fontWeight: "900" }}>Sair</Text>
                </TouchableOpacity>
            </View>
        </BubbleBackground>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: 16,
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 18,
        padding: 18,
    },
    name: { fontSize: 18, fontWeight: "900", color: "#0F2F4A", marginBottom: 8 },
    line: { color: "#7A8A9A", marginTop: 6 },
    bold: { color: "#0F2F4A", fontWeight: "900" },
    profileRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },

    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#0F2F4A",
        alignItems: "center",
        justifyContent: "center",
    },

    avatarText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "900",
    },

    sub: {
        marginTop: 4,
        color: "#7A8A9A",
        fontWeight: "700",
    },

    badge: {
        marginTop: 8,
        alignSelf: "flex-start",
        backgroundColor: "#D9F0E2",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
    },

    badgeText: { color: "#2F8F4E", fontWeight: "900", fontSize: 12,},
    divider: { height: 1, backgroundColor: "#E6EEF6", marginVertical: 12 },
});
