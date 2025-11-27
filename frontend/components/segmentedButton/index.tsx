import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type SegmentedButtonProps = {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
};

const SegmentedButton: React.FC<SegmentedButtonProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  const {theme} = useTheme();

  return (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: theme.colors.segmentedButton.background.default },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              {
                backgroundColor: isActive
                  ? theme.colors.segmentedButton.background.active
                  : "transparent",
              },
            ]}
            onPress={() => onTabPress(tab)}
            activeOpacity={0.8}
          >
            <Text
              style={
                [
                  isActive
                    ? [
                        theme.typography.body.md.medium,
                        { color: theme.colors.segmentedButton.label.active },
                      ]
                    : [
                        theme.typography.body.md.regular,
                        { color: theme.colors.segmentedButton.label.default },
                      ],
                ] as any
              }
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    borderRadius: 48,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 48,
  },
});

export default SegmentedButton;
