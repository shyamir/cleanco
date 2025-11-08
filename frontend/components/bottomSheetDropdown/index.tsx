import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Icon } from "@/constants/icon";

type BottomSheetDropdownProps = {
  /** Label shown above the dropdown field */
  label: string;
  /** Title shown at the top of the bottom sheet */
  sheetTitle?: string;
  /** Available options */
  options: string[];
  /** Current selected value */
  value?: string;
  /** Called when the user selects an option */
  onSelect: (value: string) => void;
  /** Optional icons for options (map option => icon key) */
  optionIcons?: Record<string, keyof typeof Icon>;
};

const BottomSheetDropdown: React.FC<BottomSheetDropdownProps> = ({
  label,
  sheetTitle,
  options,
  value,
  onSelect,
  optionIcons,
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<string>(value || options[0]);

  useEffect(() => {
    if (value) setSelected(value);
  }, [value]);

  const handleSelect = (option: string) => {
    setSelected(option);
    onSelect(option);
    setVisible(false);
  };

  return (
    <>
      {/* Dropdown Label */}
      <View>
        <Text
          style={[
            theme.typography.body.md.regular,
            { color: theme.colors.input.label.default, marginBottom: 6 },
          ]}
        >
          {label}
        </Text>

        {/* Dropdown Field */}
        <TouchableOpacity
          style={[
            styles.field,
            {
              borderColor: theme.colors.input.border.default,
              backgroundColor: theme.colors.input.background.default,
            },
          ]}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.fieldContent}>
            <Text
              style={[
                theme.typography.body.md.regular,
                { color: theme.colors.system.body.default },
              ]}
            >
              {selected}
            </Text>
          </View>
          <Icon.arrrowDown color={theme.colors.system.body.default} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)} />

        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.system.background.secondary },
          ]}
        >
          <Text
            style={[
              theme.typography.heading.xs3.book,
              styles.sheetTitle,
              { color: theme.colors.system.body.default },
            ]}
          >
            {sheetTitle || label}
          </Text>

          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const IconComponent =
                optionIcons && optionIcons[item]
                  ? Icon[optionIcons[item]]
                  : null;

              return (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.optionRow}>
                    {IconComponent && (
                      <View style={styles.iconWrapper}>
                        <IconComponent
                          color={theme.colors.system.body.default}
                        />
                      </View>
                    )}

                    <Text
                      style={[
                        theme.typography.body.md.regular,
                        {
                          color: theme.colors.system.body.default,
                          flex: 1,
                        },
                      ]}
                    >
                      {item}
                    </Text>

                    {item === selected && (
                      <Icon.check
                        color={theme.colors.input.label.default}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 48,
    paddingVertical: 14,
    paddingHorizontal: 16,
    height: 48,
  },
  fieldContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sheetTitle: {
    marginBottom: 12,
  },
  option: {
    paddingVertical: 14,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    marginRight: 12,
  },
});

export default BottomSheetDropdown;
