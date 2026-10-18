import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TrackerProvider } from '@/features/tracker/TrackerProvider';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    // Swipes on habit cards need the gesture root at the top of the app.
    <GestureHandlerRootView style={styles.root}>
      <TrackerProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </TrackerProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background } });
