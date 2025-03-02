import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Create a stable memo for theme to prevent re-renders
  const theme = useMemo(() => {
    return colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  }, [colorScheme]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <WorkoutProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="history" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </WorkoutProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}