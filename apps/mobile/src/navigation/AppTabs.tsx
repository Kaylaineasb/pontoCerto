import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AccountScreen from "../screens/AccountScreen";
import RequestsScreen from "../screens/RequestScreen";
import HistoryStack from "./HistoryStack";

export type AppTabParamList = {
  Today: undefined;
  History: undefined;
  Requests: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#0F2F4A",
        tabBarInactiveTintColor: "#7A8A9A",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            Today: focused ? "today" : "today-outline",
            History: focused ? "time" : "time-outline",
            Requests: focused ? "document-text" : "document-text-outline",
            Account: focused ? "person" : "person-outline",
          };
          return <Ionicons name={iconMap[route.name]} size={size ?? 22} color={color} />;
        },

        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 14,
          height: 66,
          borderRadius: 22,
          backgroundColor: "rgba(255,255,255,0.88)",

          borderTopWidth: 0,
          elevation: 10, // Android shadow

          shadowColor: "#000", // iOS shadow
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },

          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 14 : 10,
        },
      })}
    >
      <Tab.Screen name="Today" component={HomeScreen} options={{ title: "Dia atual" }} />
      <Tab.Screen name="History" component={HistoryStack} options={{ headerShown: false }} />
      <Tab.Screen name="Requests" component={RequestsScreen} options={{ title: "Solicitações" }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: "Minha conta" }} />
    </Tab.Navigator>
  );
}
