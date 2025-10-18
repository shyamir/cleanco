import { colors, units } from "./primitives";

export const darkTheme = {
  colors: {
    //   system
    system: {
      background: {
        default: colors.gray90,
        secondary: colors.gray80,
      },
      // body
      body: {
        default: colors.gray40,
        secondary: colors.gray30,
        tertiary: colors.gray10,
      },
      //  heading
      heading: {
        default: [colors.blue60, colors.blue40],
        secondary: [colors.orange40, colors.yellow40],
        tertiary: colors.gray20,
      },
    },
    // pagination
    pagination: {
      background: {
        default: colors.gray60,
        active: colors.blue40,
      },
    },
    //  navbar
    navbar: {
      background: {
        default: colors.blue60,
        secondary: colors.blue40,
        active: colors.gray90,
      },
      label: {
        default: colors.gray0,
        active: colors.yellow40,
      },
    },

    // card
    card: {
      background: {
        default: colors.blue60,
        secondary: colors.blue40,
      },
      label: {
        default: colors.gray0,
        secondary: colors.gray30,
      },
    },

    // button
    button: {
      background: {
        default: colors.blue60,
        secondary: colors.blue40,
        error: colors.red80,
      },
      border: {
        default: colors.gray80,
        error: colors.red60,
      },
      label: {
        default: colors.gray0,
        secondary: colors.blue20,
        error: colors.red60,
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
      xxs: {
        fontFamily: "GeomanistMedium",
        fontSize: units.unit24,
        lineHeight: units.unit24,
      },
    },
  },
};
