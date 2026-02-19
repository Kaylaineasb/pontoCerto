import React from "react";
import { View, Text } from "react-native";
import { BubbleBackground } from "../components/BubbleBackground";

export default function RequestsScreen() {
  return (
    <BubbleBackground>
      <View style={{ flex: 1, padding: 22, paddingTop: 42 }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: "#0F2F4A" }}>Solicitações</Text>
        <Text style={{ marginTop: 8, color: "#7A8A9A" }}>Em breve: ajustes de ponto 👍</Text>
      </View>
    </BubbleBackground>
  );
}
