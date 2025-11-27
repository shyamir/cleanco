import React, { useRef, useState, useEffect } from "react";
import {
  TextInput,
  View,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type OtpInputsProps = {
  length?: number;
  onChange: (code: string) => void;
};

const OtpInputs: React.FC<OtpInputsProps> = ({ length = 4, onChange }) => {
  const {theme} = useTheme();
  const [values, setValues] = useState(Array(length).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputsRef = Array.from({ length }, () => useRef<TextInput>(null));

  useEffect(() => {
    inputsRef[0].current?.focus();
  }, []);

  const handleChange = (text: string, index: number) => {
    const newValue = text.replace(/[^0-9]/g, "").slice(0, 1);
    const updatedValues = [...values];
    updatedValues[index] = newValue;
    setValues(updatedValues);
    onChange(updatedValues.join(""));
    if (newValue && index < length - 1) {
      setFocusedIndex(index + 1);
      setTimeout(() => inputsRef[index + 1].current?.focus(), 50);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      if (values[index] === "" && index > 0) {
        inputsRef[index - 1].current?.focus();
        setFocusedIndex(index - 1);
      } else {
        const updatedValues = [...values];
        updatedValues[index] = "";
        setValues(updatedValues);
        onChange(updatedValues.join(""));
      }
    }
  };

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {values.map((v, i) => (
        <TextInput
          key={i}
          ref={inputsRef[i]}
          value={v}
          onChangeText={(t) => handleChange(t, i)}
          keyboardType="number-pad"
          maxLength={1}
          autoFocus={i === 0}
          onKeyPress={(e) => handleKeyPress(e, i)}
          onFocus={() => setFocusedIndex(i)}
          editable={i === 0 || values[i - 1] !== ""}
          style={{
            width: 48,
            height: 48,
            borderWidth: 1,
            borderRadius: 48,
            textAlign: "center",
            fontFamily: theme.typography.body.md.regular.fontFamily,
            fontSize: theme.typography.body.md.regular.fontSize,
            color: theme.colors.system.body.default,
            borderColor:
              focusedIndex === i
                ? theme.colors.input.border.active
                : theme.colors.input.border.default,
            backgroundColor:
              focusedIndex === i
                ? theme.colors.input.background.secondary
                : theme.colors.input.background.default,
          }}
        />
      ))}
    </View>
  );
};

export default OtpInputs;
