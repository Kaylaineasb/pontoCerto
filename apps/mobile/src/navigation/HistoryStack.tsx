import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HistoryScreen from "../screens/HistoryScreen";
import HistoryDayScreen from "../screens/HistoryDayScreen";

export type HistoryStackParamList = {
  HistoryList: undefined;
  HistoryDay: { date: string };
};

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HistoryList"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HistoryDay"
        component={HistoryDayScreen}
        options={{ title: "Dia" }} // seta volta aparece automaticamente
      />
    </Stack.Navigator>
  );
}
