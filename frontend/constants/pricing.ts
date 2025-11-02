// src/constants/pricing.ts

// Base pricing (currently used for both Home & Office)
export const CLEANING_PRICING: Record<number, Record<string, number>> = {
  1: { Once: 435, "1x /week": 696, "2x /week": 1218, "3x /week": 1653 },
  2: { Once: 530, "1x /week": 848, "2x /week": 1484, "3x /week": 2014 },
  3: { Once: 650, "1x /week": 1040, "2x /week": 1820, "3x /week": 2470 },
  4: { Once: 870, "1x /week": 1392, "2x /week": 2436, "3x /week": 3306 },
  5: { Once: 1150, "1x /week": 1840, "2x /week": 3220, "3x /week": 4370 },
};
