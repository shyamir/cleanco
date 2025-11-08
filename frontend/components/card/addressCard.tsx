import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import Base from "./base";
import { useRouter } from "expo-router";

type AddressCardProps = {
  title: string;
  address: string;
  onPress: () => void;
};

const AddressCard: React.FC<AddressCardProps> = ({
  title,
  address,
  onPress,
}) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={onPress}>
          <Base>
            <View style={styles.wrapper}>
              <View style={styles.header}>
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

                <Text
                  style={[
                    {
                      ...theme.typography.body.md.medium,
                      color: theme.colors.button.label.secondary,
                    },
                  ]}
                >
                  Change
                </Text>
              </View>
              <Text
                style={
                  [
                    theme.typography.body.md.regular,
                    {
                      color: theme.colors.toggle.label.default,
                    },
                  ] as any
                }
              >
                {address}
              </Text>
            </View>
          </Base>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  wrapper: {
    flexDirection: "column",
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
});

export default AddressCard;
