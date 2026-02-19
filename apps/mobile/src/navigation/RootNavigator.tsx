import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import HistoryDayScreen from "../screens/HistoryDayScreen";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import AppTabs from "./AppTabs";

export type RootStackParamList = {
  Login: undefined;
  AppTabs: undefined;
  HistoryDay: { date: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { loading, token } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const isAuthed = !!token;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthed ? (
          <>
            <Stack.Screen name="AppTabs" component={AppTabs} />
            <Stack.Screen
              name="HistoryDay"
              component={HistoryDayScreen}
              options={{
                headerShown: true,
                title: "",
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
