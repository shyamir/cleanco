import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";

type CleaningProgressBarProps = {
  status: "todo" | "in-progress" | "done";
};

const CleaningProgressBar: React.FC<CleaningProgressBarProps> = ({
  status,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.progressBar}>
      {[0, 1, 2].map((i) => {
        const isActive =
          i <= (status === "todo" ? 0 : status === "in-progress" ? 1 : 2);

        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor: isActive
                  ? theme.colors.system.heading.secondary[0]
                  : theme.colors.system.body.disabled,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default CleaningProgressBar;
