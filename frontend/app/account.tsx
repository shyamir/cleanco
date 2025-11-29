import { TABS_DATA } from "@/constants/tabData";
import { useTheme } from "@/theme/ThemeProvider";

import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Tabs from "@/components/tabs";
import AccountCard from "@/components/statusCard/accountCard";
import AccountRow from "@/components/card/accountRow";
import { Icon } from "@/constants/icon";
import { useRouter } from "expo-router";
import Button from "@/components/button";
import CustomerSupport from "@/components/bottomSheet/customerSupport";
import SignOut from "@/components/bottomSheet/signOut";
import Appearance from "@/components/bottomSheet/appearance";
import Notification from "@/components/bottomSheet/notification";

export default function Home() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [contactVisible, setContactVisible] = useState(false); // 👈
  const [signOutVisible, setSignOutVisible] = useState(false); // 👈
  const [notificationVisible, setNotificationVisible] = useState(false);

  // State to control bottom sheet visibility
  const [appearanceVisible, setAppearanceVisible] = useState(false);

  // State to control app theme
  const router = useRouter();
  const { theme, mode, setMode } = useTheme();

  const handleSupportPress = () => {
    setContactVisible(true); // 👈 open bottom sheet
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        <View style={styles.header}>
          <Text
            style={[
              {
                ...theme.typography.heading.xs,
                color: theme.colors.system.body.tertiary,
              } as any,
            ]}
          >
            Account
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            <AccountCard />

            <View style={styles.cardContainer}>
              <AccountRow
                icon={<Icon.home color={theme.colors.system.body.default} />}
                title="Home"
                subtitle="Hiyaa Tower H12"
                onPress={() => router.push("/add-home")}
              />
              <AccountRow
                icon={
                  <Icon.briefcase color={theme.colors.system.body.default} />
                }
                title="Work"
                subtitle="Hiyaa Tower H12"
                onPress={() => router.push("/add-work")}
              />
              <AccountRow
                icon={
                  <Icon.location color={theme.colors.system.body.default} />
                }
                title="Shortcuts"
                subtitle="Manage saved locations"
                onPress={() => router.push("/home")}
              />
              <AccountRow
                icon={<Icon.list color={theme.colors.system.body.default} />}
                title="Manage Subscriptions"
                subtitle="View or cancel subscriptions"
                onPress={() => router.push("/subscription")}
              />
              <AccountRow
                icon={<Icon.help color={theme.colors.system.body.default} />}
                title="Customer Support"
                subtitle="Call or Whatsapp"
                onPress={handleSupportPress}
              />
            </View>

            <View style={styles.div}>
              <Text
                style={[
                  {
                    ...theme.typography.heading.xs3.medium,
                    color: theme.colors.system.body.tertiary,
                  } as any,
                ]}
              >
                Settings
              </Text>
              <View style={styles.cardContainer}>
                <AccountRow
                  icon={
                    mode === "dark" ? (
                      <Icon.moon color={theme.colors.system.body.default} />
                    ) : (
                      <Icon.sun color={theme.colors.system.body.default} />
                    )
                  }
                  title="Appearance"
                  subtitle={mode === "dark" ? "Dark mode" : "Light mode"}
                  onPress={() => setAppearanceVisible(true)}
                />
                <AccountRow
                  icon={<Icon.bell color={theme.colors.system.body.default} />}
                  title="Notifications"
                  subtitle="Push notifications: On"
                  onPress={() => setNotificationVisible(true)}
                />
              </View>
            </View>

            <Button
              variant={"text"}
              label={"Sign out"}
              textStyle={{ color: theme.colors.button.label.error }}
              onPress={() => setSignOutVisible(true)}
            />
          </View>
        </ScrollView>

        <View>
          <Tabs tabs={TABS_DATA} />
        </View>
      </SafeAreaView>
      <CustomerSupport
        visible={contactVisible}
        onClose={() => setContactVisible(false)}
        onCallPress={() => {
          setContactVisible(false);
          Alert.alert("Calling Support", "+123456789");
        }}
        onWhatsappPress={() => {
          setContactVisible(false);
          Alert.alert("Messaging Support", "Opening chat...");
        }}
      />
      <SignOut
        visible={signOutVisible}
        onClose={() => setSignOutVisible(false)}
        onSignOutPress={() => {
          setSignOutVisible(false);
          router.replace("/");
        }}
        onCancelPress={() => setSignOutVisible(false)}
      />
      <Appearance
        visible={appearanceVisible}
        onClose={() => setAppearanceVisible(false)}
        currentTheme={mode}
        onSave={(theme) => setMode(theme)}
      />

      <Notification
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
        initialValue={true} // or pull from storage/state
        onSave={(value) => {
          console.log("Saved notifications:", value);
          setNotificationVisible(false);
        }}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: "column",
    gap: 16,
  },
  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    gap: 8,
    height: 48,
    alignContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    flexDirection: "column",
    gap: 8,
  },
  body: {
    flexDirection: "column",
    gap: 24,
  },
  div: {
    flexDirection: "column",
    gap: 12,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Space for bottom tabs
    gap: 24,
  },
});
