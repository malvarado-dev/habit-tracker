import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '@/design/theme/ThemeProvider';
import { TrackerProvider } from '@/features/tracker/TrackerProvider';
import { URBANIST_FONTS } from '@/design/fonts';
import { getSkyTime, statusBarStyle } from '@/rules/sky';

export default function RootLayout() {
  // Wait for Urbanist so text never jumps fonts on launch. If loading fails, the system font is used.
  const [fontsLoaded, fontError] = useFonts(URBANIST_FONTS);
  if (!fontsLoaded && !fontError) return null;
  return (
    // Swipes on habit cards need the gesture root at the top of the app.
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <TrackerProvider>
          <AppStack />
        </TrackerProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppStack() {
  const { colors } = useTheme();
  return (
    <>
      {/* Status bar icons follow the sky, not the theme (Technical Design). */}
      <StatusBar style={statusBarStyle(getSkyTime(new Date().getHours()))} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surfaceSheet },
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
