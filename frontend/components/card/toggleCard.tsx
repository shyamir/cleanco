import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import Base from "./base";
import ToggleGroup from "@/components/toggleButton/toggleGroup";

type ToggleGroupItem = {
  options: string[];
  initialValue?: string;
  onChange?: (value: string) => void;
};

type ToggleCardProps = {
  title: string;
  options?: string[];
  initialValue?: string;
  onChange?: (value: string) => void;
  groups?: ToggleGroupItem[];
  children?: React.ReactNode;
};

const ToggleCard: React.FC<ToggleCardProps> = ({
  title,
  options,
  initialValue,
  onChange,
  groups,
  children,
}) => {
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Base>
          <View style={styles.inner}>
            <Text
              style={[
                {
                  ...theme.typography.heading.xs4.book,
                  color: theme.colors.system.heading.tertiary,
                } as any,
              ]}
            >
              {title}
            </Text>

            {groups && groups.length > 0 ? (
              <View style={styles.groupContainer}>
                {groups.map((group, idx) => (
                  <React.Fragment key={idx}>
                    <ToggleGroup
                      options={group.options}
                      initialValue={group.initialValue}
                      onChange={group.onChange}
                    />
                    {idx < groups.length - 1 && (
                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor: theme.colors.card.border.default,
                          },
                        ]}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>
            ) : (
              options && (
                <ToggleGroup
                  options={options}
                  initialValue={initialValue}
                  onChange={onChange}
                />
              )
            )}

            {children && <View style={styles.children}>{children}</View>}
          </View>
        </Base>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inner: {
    flexDirection: "column",
    gap: 8,
  },
  groupContainer: {
    flexDirection: "column",
    gap: 8,
  },
  children: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    width: "100%",
  },
});

export default ToggleCard;
