import React, { useCallback, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PassageScreen } from './src/screens/PassageScreen';

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    'NotoSansKR-Regular': require('./assets/fonts/NotoSansKR-Regular.otf'),
    'NanumMyeongjo-Regular': require('./assets/fonts/NanumMyeongjo-Regular.ttf'),
    'NanumPenScript-Regular': require('./assets/fonts/NanumPenScript-Regular.ttf'),
  });
  const [isServiceActive, setServiceActive] = useState(true);

  const handleExitService = useCallback(() => {
    setServiceActive(false);
  }, []);

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        {isServiceActive ? (
          <PassageScreen onExitService={handleExitService} initialMenuVisible fontsLoaded={fontsLoaded || !!fontsError} />
        ) : (
          <View style={styles.closedState}>
            <Text style={styles.closedText}>Seloa is resting.</Text>
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1014',
  },
  closedState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: {
    color: '#8f9ba8',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
