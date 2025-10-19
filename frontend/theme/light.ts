import { colors, units } from "./primitives";

export const lightTheme = {
  colors: {
    //   system
    system: {
      background: {
        default: colors.gray10,
        secondary: colors.gray0,
      },
      // body
      body: {
        default: colors.gray60,
        secondary: colors.gray50,
        tertiary: colors.gray80,
        disabled: colors.gray40
      },
      //  heading
      heading: {
        default: [colors.blue60, colors.blue40],
        secondary: [colors.orange40, colors.yellow40],
        tertiary: colors.gray70,
      },
    },
    // pagination
    pagination: {
      background: {
        default: colors.gray30,
        active: colors.blue50,
      },
    },

    //   navbar
    navbar: {
      background: {
        default: colors.blue60,
        secondary: colors.blue40,
        active: colors.gray0,
      },
      label: {
        default: colors.gray0,
        active: colors.orange40,
      },
    },

    // card
    card: {
      background: {
        primary: [colors.blue60, colors.blue40],
        secondary: [colors.orange40, colors.yellow40],
        tertiary: colors.gray0,
      },
      label: {
        default: colors.gray0,
        secondary: colors.gray30,
        tertiary: colors.gray60,
        active: colors.blue60,
      },
    },

    // button
    button: {
      background: {
        primary: [colors.blue60, colors.blue40],
        secondary: colors.gray0,
        tertiary: colors.gray40,
        error: colors.red70,
      },
      border: {
        default: colors.gray30,
        error: colors.red70,
      },
      label: {
        default: colors.gray0,
        secondary: colors.blue70,
        error: colors.red70,
      },
    },
  },
  typography: {
    body: {
      lg: {
        medium: {
          fontFamily: "Inter-Medium",
          fontSize: units.unit18,
          lineHeight: units.unit28,
        },
        regular: {
          fontFamily: "Inter-Regular",
          fontSize: units.unit18,
          lineHeight: units.unit28,
          fontWeight: "300",
        },
      },
      md: {
        medium: {
          fontFamily: "Inter-Medium",
          fontSize: units.unit16,
          lineHeight: units.unit24,
        },
        regular: {
          fontFamily: "Inter-Regular",
          fontSize: units.unit16,
          lineHeight: units.unit24,
        },
      },
      sm: {
        medium: {
          fontFamily: "Inter-Medium",
          fontSize: units.unit14,
          lineHeight: units.unit20,
        },
        regular: {
          fontFamily: "Inter-Regular",
          fontSize: units.unit14,
          lineHeight: units.unit20,
        },
      },
      xs: {
        medium: {
          fontFamily: "Inter-Medium",
          fontSize: units.unit12,
          lineHeight: units.unit14,
        },
        regular: {
          fontFamily: "Inter-Regular",
          fontSize: units.unit12,
          lineHeight: units.unit14,
        },
      },
    },
    heading: {
      lg: {
        fontFamily: "GeomanistMedium",
        fontSize: units.unit64,
        lineHeight: units.unit64,
      },
      md: {
        fontFamily: "GeomanistMedium",
        fontSize: units.unit56,
        lineHeight: units.unit56,
      },
      sm: {
        fontFamily: "GeomanistMedium",
        fontSize: units.unit48,
        lineHeight: units.unit48,
      },
      xs: {
        fontFamily: "GeomanistMedium",
        fontSize: units.unit36,
        lineHeight: units.unit36,
      },
      xs2: {
        fontFamily: "GeomanistMedium",
        fontSize: units.unit24,
        lineHeight: units.unit28,
      },
      xs3: {
        fontFamily: "GeomanistMedium",
        fontSize: units.unit20,
        lineHeight: units.unit24,
      },
    },
  },
};
