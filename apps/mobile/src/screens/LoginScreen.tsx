import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Switch,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../services/api";
import { setToken } from "../services/authStorage";
import { useAuth } from "../contexts/AuthContext";
import { BubbleBackground } from "../components/BubbleBackground";

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("admin@pontocerto.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  async function onLogin() {
    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.accessToken ?? res.data.acessToken;
      if (!token) throw new Error("Token não veio na resposta");

      await setToken(token);
      await signIn(token);
    } catch (e: any) {
      Alert.alert(
        "Erro",
        e?.response?.data?.message ?? e.message ?? "Falha no login!"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <BubbleBackground>
      <LinearGradient
      colors={["#F4F7FB", "#EAF1F8"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.card}>
          {/* Email */}
          <View style={styles.field}>
            <Ionicons name="mail-outline" size={18} style={styles.icon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor="#9AA7B4"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          {/* Senha */}
          <View style={styles.field}>
            <Ionicons name="lock-closed-outline" size={18} style={styles.icon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              placeholderTextColor="#9AA7B4"
              secureTextEntry={!showPass}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowPass(!showPass)}
            >
              <Ionicons
                name={showPass ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="#2E3A46"
              />
            </TouchableOpacity>
          </View>

          {/* Botão */}
          <TouchableOpacity
            onPress={onLogin}
            disabled={loading}
            style={[styles.button, loading && { opacity: 0.7 }]}
          >
            <Text style={styles.buttonText}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 10 }}>
            <Text style={styles.forgot}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.adminRow}>
            <Text style={styles.adminText}>Acesso Admin?</Text>
            <Switch
              value={isAdmin}
              onValueChange={setIsAdmin}
              trackColor={{ false: "#D9E2EC", true: "#2F8F4E" }}
              thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
            />
          </View>
        </View>
      </View>
    </LinearGradient>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    width: 350,
    height: 230,
    marginBottom: 20,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7E1EC",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
    color: "#2E3A46",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#15202B",
  },
  button: {
    backgroundColor: "#0F2F4A",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  forgot: {
    textAlign: "center",
    color: "#7A8A9A",
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: "#E6EEF6",
    marginVertical: 12,
  },
  adminRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adminText: {
    color: "#7A8A9A",
    fontSize: 13,
  },
});
