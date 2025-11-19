import { colors, units } from "./primitives";

export const lightTheme = {
  colors: {
    //   system
    system: {
      background: {
        default: colors.gray10,
        secondary: colors.gray0,
        tertiary: [colors.blue60, colors.blue40],
      },
      border: {
        default: colors.gray30,
        secondary: colors.blue50,
        active: colors.orange40,
      },
      // body
      body: {
        default: colors.gray60,
        secondary: colors.gray50,
        tertiary: colors.gray80,
        disabled: colors.gray50,
        error: colors.red70,
        success: colors.green50,
        accent: colors.yellow40,
        active: colors.blue70,
      },
      //  heading
      heading: {
        default: [colors.blue60, colors.blue40],
        secondary: [colors.orange40, colors.yellow40],
        tertiary: colors.gray70,
        active: colors.gray0,
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
      border: {
        default: colors.gray30,
      },
      label: {
        default: colors.gray0,
        secondary: colors.gray30,
        tertiary: colors.gray60,
        active: colors.blue50,
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

    pill: {
      background: {
        default: colors.blue0,
        error: colors.red0,
        warning: colors.yellow0,
        success: colors.green0,
      },
      label: {
        default: colors.blue60,
        error: colors.red60,
        warning: colors.yellow60,
        success: colors.green60,
      },
      border: {
        default: colors.blue60,
        error: colors.red60,
        warning: colors.yellow60,
        success: colors.green60,
      },
    },
    segmentedButton: {
      background: {
        default: colors.gray20,
        active: colors.gray0,
      },
      label: {
        default: colors.gray60,
        active: colors.blue60,
      },
    },

    // toggle
    toggle: {
      background: {
        default: colors.gray10,
        active: colors.blue0,
      },
      label: {
        default: colors.gray60,
        active: colors.blue70,
      },
    },

    calendar: {
      background: {
        default: colors.gray10,
        active: colors.blue0,
      },
      label: {
        default: colors.gray60,
        secondary: colors.gray40,
        active: colors.blue60,
        disabled: colors.gray30,
      },
    },

    // input
    input: {
      background: {
        default: colors.gray20,
        secondary: colors.gray10,
        active: colors.gray0,
        error: colors.gray0,
        success: colors.gray0,
      },
      border: {
        default: colors.gray20,
        secondary: colors.gray10,
        active: colors.blue60,
        error: colors.red50,
        success: colors.green50,
      },
      label: {
        default: colors.gray80,
        active: colors.blue60,
        secondary: colors.gray60,
        disabled: colors.gray40,
        error: colors.red50,
        success: colors.green50,
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
        fontFamily: "Geomanist-Medium",
        fontSize: units.unit64,
        lineHeight: units.unit64,
      },
      md: {
        fontFamily: "Geomanist-Medium",
        fontSize: units.unit56,
        lineHeight: units.unit56,
      },
      sm: {
        fontFamily: "Geomanist-Medium",
        fontSize: units.unit48,
        lineHeight: units.unit48,
      },
      xs: {
        fontFamily: "Geomanist-Medium",
        fontSize: units.unit36,
        lineHeight: units.unit36,
      },
      xs2: {
        fontFamily: "Geomanist-Medium",
        fontSize: units.unit24,
        lineHeight: units.unit28,
      },
      xs3: {
        medium: {
          fontFamily: "Geomanist-Medium",
          fontSize: units.unit20,
          lineHeight: units.unit24,
        },
        book: {
          fontFamily: "Geomanist-Book",
          fontSize: units.unit20,
          lineHeight: units.unit24,
        },
      },
      xs4: {
        medium: {
          fontFamily: "Geomanist-Medium",
          fontSize: units.unit16,
          lineHeight: units.unit20,
        },
        book: {
          fontFamily: "Geomanist-Book",
          fontSize: units.unit16,
          lineHeight: units.unit20,
        },
      },
    },
  },
};
