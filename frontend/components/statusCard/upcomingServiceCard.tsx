import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import BaseCard from "./base";
import InfoRow from "../infoRow";
import { Icon } from "@/constants/icon";
import GradientText from "../gradientText";

type UpcomingServiceCardProps = {
  serviceType: "home" | "office";
};

const UpcomingServiceCard: React.FC<UpcomingServiceCardProps> = ({
  serviceType,
}) => {
  const {theme} = useTheme();

  const getServiceImage = () => {
    switch (serviceType) {
      case "home":
        return require("@/assets/images/home-cleaning.png");
      case "office":
        return require("@/assets/images/office-cleaning.png");
      default:
        return require("@/assets/images/home-cleaning.png");
    }
  };

  return (
    <BaseCard colors={theme.colors.card.background.primary}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text
            style={[
              {
                ...theme.typography.heading.xs2,
                color: theme.colors.system.heading.active,
              } as any,
            ]}
          >
            Upcoming cleaning
          </Text>
        </View>
        <View style={styles.body}>
          <View style={styles.textWrapper}>
            <Text
              style={[
                {
                  ...theme.typography.body.xs,
                  color: theme.colors.system.heading.active,
                } as any,
              ]}
            >
              Home Cleaning
            </Text>
            {/* change to gradient text */}
            <Text
              style={[
                {
                  ...theme.typography.heading.xs3.medium,
                  color: theme.colors.system.heading.secondary[1],
                } as any,
              ]}
            >
              Tomorrow
            </Text>
          </View>
          <Image
            source={getServiceImage()}
            resizeMode="contain"
            style={{ width: 100, height: 100,}} // optional
          />
        </View>
        <View style={styles.footer}>
          <InfoRow
            icon={<Icon.calendar color={theme.colors.system.body.disabled} />}
            label="1 Sep 2025, 08:00"
            labelColor={theme.colors.card.label.default}
          />
          <InfoRow
            icon={<Icon.location color={theme.colors.system.body.disabled} />}
            label="Hiyaa Towers H11, Nirolhu Magu, Male, Maldive"
            labelColor={theme.colors.card.label.default}
          />
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    alignContent: "flex-start",
    justifyContent: "space-between",
    padding: 16,
    flexDirection: "column",
    // gap: 16,
  },
  header: {},
  footer: {
    alignItems: "center",
    gap: 0,
  },
  body: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    // backgroundColor: "#ff0000"
  },
  textWrapper: {
    flexDirection: "column",
    gap: 2,
  },
});

export default UpcomingServiceCard;
