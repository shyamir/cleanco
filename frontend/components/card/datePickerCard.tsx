import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";

type DatePickerCardProps = {
  label?: string;
  onDateChange?: (date: string) => void;
  initialDate?: string;
};

const DatePickerCard: React.FC<DatePickerCardProps> = ({
  label,
  onDateChange,
  initialDate,
}) => {
  const {theme} = useTheme();
  const [selectedDate, setSelectedDate] = useState(
    initialDate || dayjs().format("YYYY-MM-DD")
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log("DatePicker mounted, selectedDate:", selectedDate);
    if (selectedDate) {
      console.log("Pushing initial date to context:", selectedDate);
      onDateChange?.(selectedDate);
    }
  }, [selectedDate, onDateChange]);

  const handleSelect = (day: any) => {
    console.log("User selected a date:", day.dateString);
    setSelectedDate(day.dateString);
    onDateChange?.(day.dateString);
    setIsOpen(false);
  };

  const formattedDate = dayjs(selectedDate).isSame(dayjs(), "day")
    ? `Today, ${dayjs(selectedDate).format("D MMM YYYY")}`
    : dayjs(selectedDate).format("ddd, D MMM YYYY");

  return (
    <Base>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsOpen(!isOpen)}
        style={styles.header}
      >
        <Text
          style={[
            {
              ...theme.typography.heading.xs4.book,
              color: theme.colors.system.heading.tertiary,
            } as any,
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.datePill,
            {
              backgroundColor: isOpen
                ? theme.colors.calendar.background.active
                : theme.colors.toggle.background.default,
            },
          ]}
        >
          <Text
            style={[
              {
                ...theme.typography.body.md.regular,
                color: isOpen
                  ? theme.colors.calendar.label.active
                  : theme.colors.calendar.label.default,
              } as any,
            ]}
          >
            {formattedDate}
          </Text>
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.calendarWrapper}>
          <Calendar
            current={selectedDate}
            onDayPress={handleSelect}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: theme.colors.calendar.background.active,
                selectedTextColor: theme.colors.calendar.label.active,
              },
            }}
            theme={{
              backgroundColor: theme.colors.system.background.secondary,
              calendarBackground: theme.colors.system.background.secondary,

              dayTextColor: theme.colors.calendar.label.default,
              textDayFontSize: theme.typography.body.md.regular.fontSize,
              textDayFontFamily: theme.typography.body.md.regular.fontFamily,

              monthTextColor: theme.colors.calendar.label.active,
              textMonthFontSize: theme.typography.body.md.regular.fontSize,
              textMonthFontFamily: theme.typography.body.md.regular.fontFamily,

              todayTextColor: theme.colors.calendar.label.default,
              textDisabledColor: theme.colors.calendar.label.disabled,
              arrowColor: theme.colors.calendar.label.active,

              textDayHeaderFontFamily:
                theme.typography.body.sm.regular.fontFamily,
              textDayHeaderFontSize: theme.typography.body.sm.regular.fontSize,
              textSectionTitleColor: theme.colors.calendar.label.secondary,

              selectedDayBackgroundColor: theme.colors.toggle.background.active,
              selectedDayTextColor: theme.colors.calendar.label.active,
            }}
          />
        </View>
      )}
    </Base>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePill: {
    borderRadius: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  calendarWrapper: {
    marginTop: 10,
  },
});

export default DatePickerCard;
