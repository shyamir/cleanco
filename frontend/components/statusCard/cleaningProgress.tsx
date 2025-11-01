import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@/theme/useTheme";
import BaseCard from "./baseCard";
import RatingStars from "../rating";
import ProgressBar from "../progressBar";

type CleaningProgressProps = {
  status: "todo" | "in-progress" | "done"; // cleaner on route, making it shine, all clean
};

const CleaningProgress: React.FC<CleaningProgressProps> = ({ status }) => {
  const theme = useTheme();
  const [rating, setRating] = React.useState(0);

  const getStatusText = () => {
    switch (status) {
      case "todo":
        return {
          title: "Cleaner on route...",
          subtitle: (
            <>
              <Text
                style={[
                  theme.typography.body.sm.regular,
                  { color: theme.colors.card.label.secondary } as any,
                ]}
              >
                Estimated arrival{" "}
              </Text>
              <Text
                style={[
                  theme.typography.body.sm.medium,
                  { color: theme.colors.card.label.default } as any,
                ]}
              >
                17:55
              </Text>
            </>
          ),
        };
      case "in-progress":
        return {
          title: "Making it shine...",
          subtitle: (
            <>
              <Text
                style={[
                  theme.typography.body.sm.regular,
                  { color: theme.colors.card.label.secondary } as any,
                ]}
              >
                Estimated duration{" "}
              </Text>
              <Text
                style={[
                  theme.typography.body.sm.medium,
                  { color: theme.colors.card.label.default } as any,
                ]}
              >
                1h 30m
              </Text>
            </>
          ),
        };
      case "done":
        return {
          title: "All clean!",
          subtitle: (
            <>
              <Text
                style={[
                  theme.typography.body.sm.regular,
                  { color: theme.colors.card.label.secondary } as any,
                ]}
              >
                Completed in 1h{" "}
              </Text>
              <Text
                style={[
                  theme.typography.body.sm.medium,
                  { color: theme.colors.card.label.default } as any,
                ]}
              >
                1h
              </Text>
            </>
          ),
        };
    }
  };

  const { title, subtitle } = getStatusText();

  return (
    <BaseCard colors={theme.colors.card.background.primary}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text
            style={[
              theme.typography.heading.xs2,
              { color: theme.colors.system.heading.active } as any,
            ]}
          >
            {title}
          </Text>

          {/* Use the new component here */}
          <ProgressBar status={status} />
        </View>
        {/* Body */}
        <Text
          style={[
            theme.typography.body.md,
            {
              color: theme.colors.card.label.secondary,
              marginBottom: 12,
            } as any,
          ]}
        >
          {subtitle}
        </Text>

        <View style={styles.body}>
          <View style={styles.div}>
            <View style={styles.textWrapper}>
              <Text
                style={[
                  theme.typography.body.lg.medium,
                  { color: theme.colors.card.label.default } as any,
                ]}
              >
                Home Cleaning
              </Text>
              <Text
                style={[
                  theme.typography.body.sm.regular,
                  { color: theme.colors.card.label.secondary } as any,
                ]}
              >
                Hiyaa Tower H12
              </Text>
            </View>
            {status === "done" && (
              <RatingStars value={rating} onChange={setRating} />
            )}
          </View>
          <Image
            source={require("@/assets/images/trolley.png")}
            resizeMode="contain"
          />
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  header: {
    marginBottom: 8,
  },
  progressBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  bar: {
    height: 3,
    flex: 1,
    borderRadius: 4,
  },
  div: {
    flexDirection: "column",
    gap: 16,
  },
  body: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  textWrapper: {
    flexDirection: "column",
    gap: 8,
  },
  rating: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 12,
    gap: 4,
  },
});

export default CleaningProgress;
