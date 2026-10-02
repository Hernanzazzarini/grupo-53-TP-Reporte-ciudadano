import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="mapa"
        options={{
          headerShown: true,
          title: 'Mapa de reclamos',
        }}
      />
    </Stack>
  );
}