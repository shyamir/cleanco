-- Remove bathrooms from pricing_rules table

-- Drop the existing unique constraint
ALTER TABLE "pricing_rules" DROP CONSTRAINT IF EXISTS "pricing_rules_serviceType_frequency_bedrooms_officeSize_flo_key";

-- Remove the bathrooms column
ALTER TABLE "pricing_rules" DROP COLUMN IF EXISTS "bathrooms";

-- Create new unique constraint without bathrooms
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_serviceType_frequency_bedrooms_officeSize_flo_key" UNIQUE ("serviceType", "frequency", "bedrooms", "officeSize", "floors", "rooms");
