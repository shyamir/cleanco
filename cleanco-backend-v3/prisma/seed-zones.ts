import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedZones() {
  console.log('🌱 Seeding zones...');

  const zones = [
    {
      name: 'Male',
      orderIndex: 1,
      isActive: true,
    },
    {
      name: 'Villingili',
      orderIndex: 2,
      isActive: true,
    },
    {
      name: 'Hulhumale Phase 1',
      orderIndex: 3,
      isActive: true,
    },
    {
      name: 'Hulhumale Phase 2',
      orderIndex: 4,
      isActive: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const zone of zones) {
    try {
      const existing = await prisma.zone.findUnique({
        where: { name: zone.name },
      });

      if (existing) {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${zone.name}`);
      } else {
        await prisma.zone.create({
          data: zone,
        });
        created++;
        console.log(`✅ Created: ${zone.name}`);
      }
    } catch (error: any) {
      console.error(`❌ Error creating ${zone.name}:`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
}

async function main() {
  console.log('🚀 Starting zones seed process...\n');

  await seedZones();

  console.log('\n✅ Zones seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
