import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TestModeBanner } from '@/components/TestModeBanner';
import { ThemeProvider, useTheme } from '@/design/theme/ThemeProvider';
import { SettingsProvider } from '@/features/settings/SettingsProvider';
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
        <SettingsProvider>
          <TrackerProvider>
            <AppStack />
          </TrackerProvider>
        </SettingsProvider>
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
      {/* Screens fill the space above the Test mode strip, so it never covers them (T17). */}
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.surfaceSheet },
          }}
        />
      </View>
      <TestModeBanner />
    </>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
