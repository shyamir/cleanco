import { PrismaClient, SubscriptionFrequency } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOfficePricingTiers() {
  console.log('🌱 Seeding office pricing tiers...');

  // Office sqft-based pricing tiers
  // Format: { sqftMin, sqftMax, basePrice }
  const officeTiers = [
    { sqftMin: 100, sqftMax: 199, basePrice: 500 },
    { sqftMin: 200, sqftMax: 299, basePrice: 650 },
    { sqftMin: 300, sqftMax: 499, basePrice: 800 },
    { sqftMin: 500, sqftMax: 999, basePrice: 1000 },
    { sqftMin: 1000, sqftMax: 1999, basePrice: 1500 },
    { sqftMin: 2000, sqftMax: 5000, basePrice: 2500 },
  ];

  // Frequencies to create tiers for
  const frequencies: (SubscriptionFrequency | null)[] = [
    null, // One-time
    SubscriptionFrequency.ONCE_A_WEEK,
    SubscriptionFrequency.TWICE_A_WEEK,
    SubscriptionFrequency.THRICE_A_WEEK,
  ];

  const frequencyLabels: Record<string, string> = {
    'null': 'One-time',
    'ONCE_A_WEEK': '1x /week',
    'TWICE_A_WEEK': '2x /week',
    'THRICE_A_WEEK': '3x /week',
  };

  // Subscription multipliers (weekly prices are discounted)
  const frequencyMultipliers: Record<string, number> = {
    'null': 1.0,
    'ONCE_A_WEEK': 0.8,  // 20% discount for 1x/week
    'TWICE_A_WEEK': 1.6, // Monthly price for 2x/week (0.8 * 2)
    'THRICE_A_WEEK': 2.1, // Monthly price for 3x/week (0.7 * 3)
  };

  let created = 0;
  let skipped = 0;

  for (const frequency of frequencies) {
    for (const tier of officeTiers) {
      const multiplier = frequencyMultipliers[String(frequency)] || 1;
      const price = Math.round(tier.basePrice * multiplier);
      const freqKey = String(frequency);
      const freqLabel = frequencyLabels[freqKey] || freqKey;

      try {
        const existing = await prisma.officePricingTier.findFirst({
          where: {
            frequency,
            sqftMin: tier.sqftMin,
            sqftMax: tier.sqftMax,
          },
        });

        if (existing) {
          skipped++;
          console.log(
            `⏭️  Skipped (exists): ${tier.sqftMin}-${tier.sqftMax} sqft - ${freqLabel}`
          );
        } else {
          await prisma.officePricingTier.create({
            data: {
              frequency,
              sqftMin: tier.sqftMin,
              sqftMax: tier.sqftMax,
              basePrice: price,
              isActive: true,
            },
          });
          created++;
          console.log(
            `✅ Created: ${tier.sqftMin}-${tier.sqftMax} sqft - ${freqLabel} (MVR ${price})`
          );
        }
      } catch (error: any) {
        console.error(
          `❌ Error creating tier ${tier.sqftMin}-${tier.sqftMax} sqft - ${freqLabel}:`,
          error.message
        );
      }
    }
  }

  console.log(`\n📊 Tiers Summary: ${created} created, ${skipped} skipped`);
}

async function seedOfficeAddOnPricing() {
  console.log('\n🌱 Seeding office add-on pricing...');

  // Add-on pricing for rooms and toilets
  const addOns = [
    { addOnType: 'ROOM', minQuantity: 2, pricePerUnit: 50, description: 'Additional charge per office room beyond the first' },
    { addOnType: 'TOILET', minQuantity: 2, pricePerUnit: 30, description: 'Additional charge per toilet beyond the first' },
  ];

  let created = 0;
  let skipped = 0;

  for (const addOn of addOns) {
    try {
      const existing = await prisma.officeAddOnPricing.findFirst({
        where: {
          addOnType: addOn.addOnType,
          minQuantity: addOn.minQuantity,
        },
      });

      if (existing) {
        skipped++;
        console.log(
          `⏭️  Skipped (exists): ${addOn.addOnType} - min qty ${addOn.minQuantity}`
        );
      } else {
        await prisma.officeAddOnPricing.create({
          data: {
            addOnType: addOn.addOnType,
            minQuantity: addOn.minQuantity,
            pricePerUnit: addOn.pricePerUnit,
            description: addOn.description,
            isActive: true,
          },
        });
        created++;
        console.log(
          `✅ Created: ${addOn.addOnType} - MVR ${addOn.pricePerUnit} per unit (min qty: ${addOn.minQuantity})`
        );
      }
    } catch (error: any) {
      console.error(
        `❌ Error creating add-on ${addOn.addOnType}:`,
        error.message
      );
    }
  }

  console.log(`\n📊 Add-ons Summary: ${created} created, ${skipped} skipped`);
}

async function main() {
  console.log('🚀 Starting office pricing seed process...\n');

  await seedOfficePricingTiers();
  await seedOfficeAddOnPricing();

  console.log('\n✅ Office pricing seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
