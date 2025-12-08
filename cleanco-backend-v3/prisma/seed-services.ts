import { PrismaClient, ServiceType, SubscriptionFrequency } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
  console.log('🌱 Seeding services...');

  // Create HOME cleaning service
  const homeService = await prisma.service.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      type: ServiceType.HOME,
      name: 'Home Cleaning Service',
      description: 'Professional cleaning service for residential homes. Our experienced cleaners will make your home spotless.',
      isActive: true,
    },
  });

  console.log('✅ Created HOME service:', homeService.name);

  // Create OFFICE cleaning service
  const officeService = await prisma.service.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      type: ServiceType.OFFICE,
      name: 'Office Cleaning Service',
      description: 'Professional cleaning service for commercial offices. Keep your workspace clean and professional.',
      isActive: true,
    },
  });

  console.log('✅ Created OFFICE service:', officeService.name);
}

async function seedPricingRules() {
  console.log('\n🌱 Seeding pricing rules...');

  const pricingRules = [
    // ========== HOME CLEANING - ONE TIME ==========
    {
      serviceType: ServiceType.HOME,
      frequency: null,
      bedrooms: 1,
      price: 150.0,
      description: '1BR Home - One Time',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: null,
      bedrooms: 2,
      price: 200.0,
      description: '2BR Home - One Time',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: null,
      bedrooms: 3,
      price: 280.0,
      description: '3BR Home - One Time',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: null,
      bedrooms: 4,
      price: 380.0,
      description: '4BR Home - One Time',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: null,
      bedrooms: 5,
      price: 500.0,
      description: '5BR Home - One Time',
    },

    // ========== HOME CLEANING - ONCE A WEEK ==========
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      bedrooms: 1,
      price: 120.0,
      description: '1BR Home - 1x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      bedrooms: 2,
      price: 160.0,
      description: '2BR Home - 1x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      bedrooms: 3,
      price: 220.0,
      description: '3BR Home - 1x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      bedrooms: 4,
      price: 300.0,
      description: '4BR Home - 1x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      bedrooms: 5,
      price: 400.0,
      description: '5BR Home - 1x/week',
    },

    // ========== HOME CLEANING - TWICE A WEEK ==========
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.TWICE_A_WEEK,
      bedrooms: 1,
      price: 200.0,
      description: '1BR Home - 2x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.TWICE_A_WEEK,
      bedrooms: 2,
      price: 280.0,
      description: '2BR Home - 2x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.TWICE_A_WEEK,
      bedrooms: 3,
      price: 380.0,
      description: '3BR Home - 2x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.TWICE_A_WEEK,
      bedrooms: 4,
      price: 520.0,
      description: '4BR Home - 2x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.TWICE_A_WEEK,
      bedrooms: 5,
      price: 700.0,
      description: '5BR Home - 2x/week',
    },

    // ========== HOME CLEANING - THRICE A WEEK ==========
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.THRICE_A_WEEK,
      bedrooms: 1,
      price: 270.0,
      description: '1BR Home - 3x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.THRICE_A_WEEK,
      bedrooms: 2,
      price: 380.0,
      description: '2BR Home - 3x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.THRICE_A_WEEK,
      bedrooms: 3,
      price: 520.0,
      description: '3BR Home - 3x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.THRICE_A_WEEK,
      bedrooms: 4,
      price: 700.0,
      description: '4BR Home - 3x/week',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.THRICE_A_WEEK,
      bedrooms: 5,
      price: 950.0,
      description: '5BR Home - 3x/week',
    },

    // ========== OFFICE CLEANING - ONE TIME ==========
    {
      serviceType: ServiceType.OFFICE,
      frequency: null,
      officeSize: 'Small',
      floors: 1,
      rooms: 3,
      price: 200.0,
      description: 'Small Office - One Time',
    },
    {
      serviceType: ServiceType.OFFICE,
      frequency: null,
      officeSize: 'Medium',
      floors: 1,
      rooms: 5,
      price: 350.0,
      description: 'Medium Office - One Time',
    },
    {
      serviceType: ServiceType.OFFICE,
      frequency: null,
      officeSize: 'Large',
      floors: 2,
      rooms: 10,
      price: 600.0,
      description: 'Large Office - One Time',
    },

    // ========== OFFICE CLEANING - WEEKLY ==========
    {
      serviceType: ServiceType.OFFICE,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      officeSize: 'Small',
      floors: 1,
      rooms: 3,
      price: 160.0,
      description: 'Small Office - Weekly',
    },
    {
      serviceType: ServiceType.OFFICE,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      officeSize: 'Medium',
      floors: 1,
      rooms: 5,
      price: 280.0,
      description: 'Medium Office - Weekly',
    },
    {
      serviceType: ServiceType.OFFICE,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      officeSize: 'Large',
      floors: 2,
      rooms: 10,
      price: 500.0,
      description: 'Large Office - Weekly',
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const rule of pricingRules) {
    try {
      await prisma.pricingRule.create({
        data: {
          serviceType: rule.serviceType,
          frequency: rule.frequency,
          bedrooms: rule.bedrooms || null,
          officeSize: rule.officeSize || null,
          floors: rule.floors || null,
          rooms: rule.rooms || null,
          price: rule.price,
          isActive: true,
        },
      });
      created++;
      console.log(`✅ Created: ${rule.description} - MVR ${rule.price}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint violation - already exists
        skipped++;
        console.log(`⏭️  Skipped (exists): ${rule.description}`);
      } else {
        console.error(`❌ Error creating ${rule.description}:`, error.message);
      }
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
}

async function seedPromoCode() {
  console.log('\n🌱 Seeding promo codes...');

  const promoCodes = [
    {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE' as const,
      discountValue: 10,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      usageLimitPerUser: 1,
      totalUsageLimit: 100,
      currentUsage: 0,
      applicableServices: [ServiceType.HOME, ServiceType.OFFICE],
      minPurchaseAmount: 100,
      isActive: true,
      isPublic: true,
      createdBy: '00000000-0000-0000-0000-000000000000',
      description: '10% off - All Services',
    },
    {
      code: 'SAVE50',
      discountType: 'FIXED_AMOUNT' as const,
      discountValue: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      usageLimitPerUser: 1,
      totalUsageLimit: 50,
      currentUsage: 0,
      applicableServices: [ServiceType.HOME],
      minPurchaseAmount: 200,
      isActive: true,
      isPublic: true,
      createdBy: '00000000-0000-0000-0000-000000000000',
      description: 'MVR 50 off - Home Cleaning',
    },
    {
      code: 'HOLIDAY25',
      discountType: 'PERCENTAGE' as const,
      discountValue: 25,
      startDate: new Date('2024-12-01'),
      endDate: new Date('2025-12-31'),
      usageLimitPerUser: 2,
      totalUsageLimit: 200,
      currentUsage: 0,
      applicableServices: [ServiceType.HOME, ServiceType.OFFICE],
      minPurchaseAmount: 150,
      isActive: true,
      isPublic: true,
      createdBy: '00000000-0000-0000-0000-000000000000',
      description: '25% off - Holiday Special',
    },
    {
      code: 'OFFICE100',
      discountType: 'FIXED_AMOUNT' as const,
      discountValue: 100,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      usageLimitPerUser: 1,
      totalUsageLimit: 30,
      currentUsage: 0,
      applicableServices: [ServiceType.OFFICE],
      minPurchaseAmount: 300,
      isActive: true,
      isPublic: true,
      createdBy: '00000000-0000-0000-0000-000000000000',
      description: 'MVR 100 off - Office Cleaning',
    },
    {
      code: 'VIP30',
      discountType: 'PERCENTAGE' as const,
      discountValue: 30,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      usageLimitPerUser: 5,
      totalUsageLimit: 20,
      currentUsage: 0,
      applicableServices: [ServiceType.HOME, ServiceType.OFFICE],
      minPurchaseAmount: null,
      isActive: true,
      isPublic: false, // Private - customer support only
      createdBy: '00000000-0000-0000-0000-000000000000',
      description: '30% off - VIP (Private)',
    },
  ];

  for (const promo of promoCodes) {
    try {
      const created = await prisma.promotionalCode.upsert({
        where: { code: promo.code },
        update: {
          isActive: promo.isActive,
          isPublic: promo.isPublic,
          endDate: promo.endDate,
        },
        create: {
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          startDate: promo.startDate,
          endDate: promo.endDate,
          usageLimitPerUser: promo.usageLimitPerUser,
          totalUsageLimit: promo.totalUsageLimit,
          currentUsage: promo.currentUsage,
          applicableServices: promo.applicableServices,
          minPurchaseAmount: promo.minPurchaseAmount,
          isActive: promo.isActive,
          isPublic: promo.isPublic,
          createdBy: promo.createdBy,
        },
      });
      console.log(`✅ Created promo code: ${created.code} - ${promo.description}`);
    } catch (error: any) {
      console.error(`❌ Error creating ${promo.code}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting seed process...\n');

  await seedServices();
  await seedPricingRules();
  await seedPromoCode();

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
