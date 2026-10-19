import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '@/design/theme/ThemeProvider';
import { TrackerProvider } from '@/features/tracker/TrackerProvider';
import { isDaytime, statusBarStyle } from '@/rules/sky';

export default function RootLayout() {
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
      <StatusBar style={statusBarStyle(isDaytime(new Date().getHours()))} />
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
