import { StyleSheet, Text, View } from 'react-native';

// Placeholder home screen. The core-loop prototype replaces this in the next pull request.
export default function HomeScreen() {
  return (
    <View style={styles.container} testID="home-screen">
      <Text style={styles.title} accessibilityRole="header">
        Habit Tracker
      </Text>
      <Text style={styles.body}>Prototype coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2B2118',
  },
  body: {
    marginTop: 8,
    fontSize: 16,
    color: '#5C4A3A',
  },
});
