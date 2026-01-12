import { PrismaClient, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
  console.log('Seeding services...');

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

  console.log('Created HOME service:', homeService.name);

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

  console.log('Created OFFICE service:', officeService.name);
}

// Note: Pricing rules are seeded separately:
// - Home pricing: Run `npx ts-node prisma/seed-pricing-rules.ts`
// - Office pricing: Run `npx ts-node prisma/seed-office-pricing.ts`

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
  console.log('Starting seed process...\n');

  await seedServices();
  await seedPromoCode();

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
