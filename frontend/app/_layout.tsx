import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useSegments, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Add an auth guard component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (
      // If the user is not signed in and the initial segment is not in the auth group,
      // redirect to the sign-in screen.
      !isAuthenticated && 
      !inAuthGroup && 
      segments[0] !== undefined
    ) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect away from auth screens if the user is already authenticated
      router.replace('/');
    }
  }, [isAuthenticated, segments]);

  return <>{children}</>;
}

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
          <AuthGuard>
            <RootLayoutNav />
          </AuthGuard>
        </WorkoutProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();
  
  // For authenticated users, show drawer navigation
  if (isAuthenticated) {
    return (
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#f8f8f8',
          },
          drawerActiveTintColor: '#2f95dc',
          drawerInactiveTintColor: colorScheme === 'dark' ? '#aaa' : '#666',
        }}>
        <Drawer.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            drawerLabel: 'Home',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            headerShown: true,
            headerTitle: 'Profile',
            drawerLabel: 'Profile',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="progress"
          options={{
            headerShown: true,
            headerTitle: 'Progress',
            drawerLabel: 'Progress',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="workout-history"
          options={{
            headerShown: true,
            headerTitle: 'Workout History',
            drawerLabel: 'Workout History',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="time" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            headerShown: true,
            headerTitle: 'Settings',
            drawerLabel: 'Settings',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
        
        {/* Keep these non-drawer screens available */}
        <Drawer.Screen
          name="history"
          options={{
            drawerItemStyle: { display: 'none' }
          }}
        />
        <Drawer.Screen
          name="+not-found"
          options={{
            drawerItemStyle: { display: 'none' }
          }}
        />
      </Drawer>
    );
  }
  
  // For unauthenticated users, show regular stack navigation
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}