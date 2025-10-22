import React, { useRef } from "react";
import { View, StyleSheet, Animated, Text } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/useTheme";
import { AnimatedHeader } from "./components/animatedHeader";

const OfficeCleaningScreen = () => {
  const theme = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={theme.colors.system.background.tertiary}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <AnimatedHeader title="Office Cleaning" scrollY={scrollY} />

          <Animated.ScrollView
            contentContainerStyle={{
              paddingTop: 86,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            <View
              style={[
                styles.whiteArea,
                { backgroundColor: theme.colors.system.background.default },
              ]}
            >
              {/* Add screen content here */}
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  whiteArea: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  section: {
    fontSize: 48,
  },
});

export default OfficeCleaningScreen;
