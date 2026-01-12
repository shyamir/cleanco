import React, { useEffect, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";

dayjs.extend(utc);

type DatePickerCardProps = {
  label?: string;
  onDateChange?: (date: string) => void;
  initialDate?: string;
};

// Helper to get the next valid date (skipping Fridays)
const getNextValidDate = (date: dayjs.Dayjs): dayjs.Dayjs => {
  // Friday is day 5 in dayjs (0 = Sunday)
  if (date.day() === 5) {
    return date.add(1, 'day'); // Skip to Saturday
  }
  return date;
};

// Get current date in Maldives timezone (UTC+5, no daylight saving)
// Manually calculate since dayjs timezone plugin doesn't work reliably in React Native
const getMaldivesNow = () => {
  const MALDIVES_OFFSET_HOURS = 5;
  return dayjs.utc().add(MALDIVES_OFFSET_HOURS, 'hour');
};

const DatePickerCard: React.FC<DatePickerCardProps> = ({
  label,
  onDateChange,
  initialDate,
}) => {
  const {theme} = useTheme();

  // Use useMemo to ensure we get fresh Maldives date on each render
  const { maldivesToday, minDate, minDateStr } = useMemo(() => {
    const now = getMaldivesNow();
    const min = getNextValidDate(now);
    console.log('[DatePicker] Maldives now:', now.format('YYYY-MM-DD HH:mm:ss Z'));
    console.log('[DatePicker] Min date:', min.format('YYYY-MM-DD'));
    return {
      maldivesToday: now,
      minDate: min,
      minDateStr: min.format("YYYY-MM-DD"),
    };
  }, []);
  // If initialDate is before today (in Maldives time), or is a Friday, use next valid date
  const getDefaultDate = () => {
    if (initialDate && !dayjs(initialDate).isBefore(maldivesToday, 'day')) {
      // Skip if it's a Friday
      return getNextValidDate(dayjs(initialDate)).format("YYYY-MM-DD");
    }
    return minDateStr;
  };
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [isOpen, setIsOpen] = useState(false);

  // Ensure date is valid on mount (handles timezone initialization edge cases)
  useEffect(() => {
    const correctDate = getDefaultDate();
    console.log('[DatePicker] Initial selectedDate:', selectedDate, 'Correct date:', correctDate);
    if (selectedDate !== correctDate && (!initialDate || initialDate === '')) {
      setSelectedDate(correctDate);
    }
  }, [minDateStr]);

  useEffect(() => {
    if (selectedDate) {
      onDateChange?.(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleSelect = (day: any) => {
    // Don't allow Friday selection (day 5)
    const selectedDay = dayjs(day.dateString);
    if (selectedDay.day() === 5) {
      return; // Ignore Friday clicks
    }
    setSelectedDate(day.dateString);
    onDateChange?.(day.dateString);
    setIsOpen(false);
  };

  // Generate disabled Fridays for the next 6 months (using Maldives timezone)
  const disabledFridays = useMemo(() => {
    const fridays: { [key: string]: { disabled: boolean; disableTouchEvent: boolean } } = {};
    let current = getMaldivesNow();
    const endDate = getMaldivesNow().add(6, 'month');

    while (current.isBefore(endDate)) {
      if (current.day() === 5) { // Friday
        fridays[current.format("YYYY-MM-DD")] = {
          disabled: true,
          disableTouchEvent: true
        };
      }
      current = current.add(1, 'day');
    }
    return fridays;
  }, []);

  const formattedDate = dayjs(selectedDate).format("ddd, D MMM YYYY");

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
            minDate={minDateStr}
            onDayPress={handleSelect}
            markedDates={{
              ...disabledFridays,
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
