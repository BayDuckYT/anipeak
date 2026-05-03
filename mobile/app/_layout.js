import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../constants/theme';
import { useEffect } from 'react';

function InitialLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Oturum yoksa ve auth sayfasında değilsek login'e at
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Oturum varsa ve auth sayfasındaysak ana sayfaya at
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <InitialLayout />
    </AuthProvider>
  );
}
