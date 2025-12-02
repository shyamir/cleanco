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
      bathrooms: 1,
      price: 150.0,
      description: '1BR/1BA Home - One Time',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: null,
      bedrooms: 2,
      bathrooms: 1,
      price: 200.0,
      description: '2BR/1BA Home - One Time',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: null,
      bedrooms: 2,
      bathrooms: 2,
      price: 250.0,
      description: '2BR/2BA Home - One Time',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: null,
      bedrooms: 3,
      bathrooms: 2,
      price: 300.0,
      description: '3BR/2BA Home - One Time',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: null,
      bedrooms: 4,
      bathrooms: 3,
      price: 400.0,
      description: '4BR/3BA Home - One Time',
    },

    // ========== HOME CLEANING - ONCE A WEEK ==========
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      bedrooms: 1,
      bathrooms: 1,
      price: 120.0,
      description: '1BR/1BA Home - Weekly',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      bedrooms: 2,
      bathrooms: 2,
      price: 200.0,
      description: '2BR/2BA Home - Weekly',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      bedrooms: 3,
      bathrooms: 2,
      price: 250.0,
      description: '3BR/2BA Home - Weekly',
    },

    // ========== HOME CLEANING - TWICE A WEEK ==========
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.TWICE_A_WEEK,
      bedrooms: 2,
      bathrooms: 2,
      price: 180.0,
      description: '2BR/2BA Home - Twice Weekly',
    },
    {
      serviceType: ServiceType.HOME,
      frequency: SubscriptionFrequency.TWICE_A_WEEK,
      bedrooms: 3,
      bathrooms: 2,
      price: 220.0,
      description: '3BR/2BA Home - Twice Weekly',
    },

    // ========== OFFICE CLEANING - ONE TIME ==========
    {
      serviceType: ServiceType.OFFICE,
      frequency: null,
      officeSize: 'Small',
      floors: 1,
      rooms: 3,
      bathrooms: 1,
      price: 200.0,
      description: 'Small Office - One Time',
    },
    {
      serviceType: ServiceType.OFFICE,
      frequency: null,
      officeSize: 'Medium',
      floors: 1,
      rooms: 5,
      bathrooms: 2,
      price: 350.0,
      description: 'Medium Office - One Time',
    },
    {
      serviceType: ServiceType.OFFICE,
      frequency: null,
      officeSize: 'Large',
      floors: 2,
      rooms: 10,
      bathrooms: 3,
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
      bathrooms: 1,
      price: 160.0,
      description: 'Small Office - Weekly',
    },
    {
      serviceType: ServiceType.OFFICE,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      officeSize: 'Medium',
      floors: 1,
      rooms: 5,
      bathrooms: 2,
      price: 280.0,
      description: 'Medium Office - Weekly',
    },
    {
      serviceType: ServiceType.OFFICE,
      frequency: SubscriptionFrequency.ONCE_A_WEEK,
      officeSize: 'Large',
      floors: 2,
      rooms: 10,
      bathrooms: 3,
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
          bathrooms: rule.bathrooms || null,
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

  try {
    const promoCode = await prisma.promotionalCode.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        usageLimitPerUser: 1,
        totalUsageLimit: 100,
        currentUsage: 0,
        applicableServices: [ServiceType.HOME, ServiceType.OFFICE],
        minPurchaseAmount: 100,
        isActive: true,
        createdBy: '00000000-0000-0000-0000-000000000000', // System
      },
    });

    console.log('✅ Created promo code:', promoCode.code, '- 10% off');

    const promoCode2 = await prisma.promotionalCode.upsert({
      where: { code: 'SAVE50' },
      update: {},
      create: {
        code: 'SAVE50',
        discountType: 'FIXED_AMOUNT',
        discountValue: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        usageLimitPerUser: 1,
        totalUsageLimit: 50,
        currentUsage: 0,
        applicableServices: [ServiceType.HOME],
        minPurchaseAmount: 200,
        isActive: true,
        createdBy: '00000000-0000-0000-0000-000000000000', // System
      },
    });

    console.log('✅ Created promo code:', promoCode2.code, '- MVR 50 off');
  } catch (error: any) {
    console.error('❌ Error creating promo codes:', error.message);
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
