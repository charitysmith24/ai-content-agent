// clerkTheme.ts
import type { Appearance } from "@clerk/types";

const clerkTheme: Appearance = {
  variables: {
    colorPrimary: "#e11d48", // Your brand's primary color
    borderRadius: "8px", // Border radius for rounded corners
  },
  elements: {
    card: {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Custom shadow for cards
    },
    headerTitle: {
      fontFamily: "Arial, sans-serif", // Custom font for headers
    },
  },
};

export default clerkTheme;
