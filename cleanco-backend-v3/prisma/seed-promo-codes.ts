import { PrismaClient, DiscountType, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPromoCodes() {
  console.log('🌱 Seeding promo codes...');

  // Find or create an admin user for createdBy field
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        phoneNumber: '+9607000001',
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@cleanco.mv',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('✅ Created admin user for promo codes');
  }

  const promoCodes = [
    {
      code: 'WELCOME10',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      description: '10% off for new customers',
      applicableServices: [ServiceType.HOME, ServiceType.OFFICE],
      usageLimitPerUser: 1,
      totalUsageLimit: 1000,
      isPublic: true,
    },
    {
      code: 'CLEAN20',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      description: '20% off any cleaning service',
      applicableServices: [ServiceType.HOME, ServiceType.OFFICE],
      usageLimitPerUser: 2,
      totalUsageLimit: 500,
      isPublic: true,
    },
    {
      code: 'OFFICE15',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      description: '15% off office cleaning',
      applicableServices: [ServiceType.OFFICE],
      usageLimitPerUser: 3,
      totalUsageLimit: 200,
      isPublic: true,
    },
    {
      code: 'HOME50',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 50,
      description: 'MVR 50 off home cleaning',
      applicableServices: [ServiceType.HOME],
      usageLimitPerUser: 1,
      totalUsageLimit: 100,
      minPurchaseAmount: 200,
      isPublic: true,
    },
    {
      code: 'SAVE100',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 100,
      description: 'MVR 100 off orders over MVR 500',
      applicableServices: [ServiceType.HOME, ServiceType.OFFICE],
      usageLimitPerUser: 1,
      totalUsageLimit: 50,
      minPurchaseAmount: 500,
      isPublic: true,
    },
    {
      code: 'VIP25',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 25,
      description: '25% VIP discount',
      applicableServices: [ServiceType.HOME, ServiceType.OFFICE],
      usageLimitPerUser: 5,
      totalUsageLimit: null,
      isPublic: false,
    },
  ];

  const startDate = new Date();
  const endDate = new Date('2026-01-31');

  let created = 0;
  let skipped = 0;

  for (const promoData of promoCodes) {
    try {
      const existing = await prisma.promotionalCode.findUnique({
        where: { code: promoData.code },
      });

      if (existing) {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${promoData.code}`);
        continue;
      }

      await prisma.promotionalCode.create({
        data: {
          code: promoData.code,
          discountType: promoData.discountType,
          discountValue: promoData.discountValue,
          startDate,
          endDate,
          usageLimitPerUser: promoData.usageLimitPerUser,
          totalUsageLimit: promoData.totalUsageLimit,
          currentUsage: 0,
          applicableServices: promoData.applicableServices,
          minPurchaseAmount: promoData.minPurchaseAmount ?? null,
          isActive: true,
          isPublic: promoData.isPublic,
          createdBy: adminUser.id,
        },
      });

      created++;
      console.log(`✅ Created: ${promoData.code} - ${promoData.description}`);
    } catch (error: any) {
      console.error(`❌ Error creating ${promoData.code}:`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
  console.log(`📅 All codes valid until: January 31st, 2026`);
}

async function main() {
  console.log('🚀 Starting promo codes seed process...\n');

  await seedPromoCodes();

  console.log('\n✅ Promo codes seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
