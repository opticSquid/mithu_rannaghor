import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Redirect, Stack, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <Stack>
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Redirect href="/(tabs)/wallet" />
        <PortalHost />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
