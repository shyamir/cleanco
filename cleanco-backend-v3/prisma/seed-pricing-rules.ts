import { PrismaClient, ServiceType, SubscriptionFrequency } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPricingRules() {
  console.log('🌱 Seeding pricing rules...');

  // Pricing data from frontend constants/pricing.ts
  // Format: { bedrooms: { frequency: price } }
  const homePricing = {
    1: { 'Once': 435, '1x /week': 696, '2x /week': 1218, '3x /week': 1653 },
    2: { 'Once': 530, '1x /week': 848, '2x /week': 1484, '3x /week': 2014 },
    3: { 'Once': 650, '1x /week': 1040, '2x /week': 1820, '3x /week': 2470 },
    4: { 'Once': 870, '1x /week': 1392, '2x /week': 2436, '3x /week': 3306 },
    5: { 'Once': 1150, '1x /week': 1840, '2x /week': 3220, '3x /week': 4370 },
  };

  // Map frontend frequency strings to backend enums
  const frequencyMap: Record<string, SubscriptionFrequency | null> = {
    'Once': null, // ONE_TIME bookings don't have a frequency
    '1x /week': SubscriptionFrequency.ONCE_A_WEEK,
    '2x /week': SubscriptionFrequency.TWICE_A_WEEK,
    '3x /week': SubscriptionFrequency.THRICE_A_WEEK,
  };

  let created = 0;
  let skipped = 0;

  // Create pricing rules for each bedroom count and frequency combination
  for (const [bedroomsStr, frequencies] of Object.entries(homePricing)) {
    const bedrooms = parseInt(bedroomsStr);

    for (const [freqLabel, basePrice] of Object.entries(frequencies)) {
      const frequency = frequencyMap[freqLabel];

      const ruleData = {
        serviceType: ServiceType.HOME,
        bedrooms,
        bathrooms: null, // Ignore bathrooms as per requirements
        officeSize: null,
        floors: null,
        rooms: null,
        frequency,
        price: basePrice,
        isActive: true,
      };

      try {
        // Check if rule already exists
        const existing = await prisma.pricingRule.findFirst({
          where: {
            serviceType: ServiceType.HOME,
            bedrooms,
            frequency,
          },
        });

        if (existing) {
          skipped++;
          console.log(
            `⏭️  Skipped (exists): HOME - ${bedrooms} bedroom(s) - ${freqLabel} (MVR ${basePrice})`
          );
        } else {
          await prisma.pricingRule.create({
            data: ruleData,
          });
          created++;
          console.log(
            `✅ Created: HOME - ${bedrooms} bedroom(s) - ${freqLabel} (MVR ${basePrice})`
          );
        }
      } catch (error: any) {
        console.error(
          `❌ Error creating rule for ${bedrooms} bedroom(s) - ${freqLabel}:`,
          error.message
        );
      }
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
}

async function main() {
  console.log('🚀 Starting pricing rules seed process...\n');

  await seedPricingRules();

  console.log('\n✅ Pricing rules seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
