import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSettings() {
  console.log('🌱 Seeding system settings...');

  const settings = [
    {
      key: 'support_phone',
      value: '+9607770000', // Replace with actual support phone number
    },
    {
      key: 'support_whatsapp',
      value: '+9607770000', // Replace with actual WhatsApp number
    },
  ];

  let created = 0;
  let updated = 0;

  for (const setting of settings) {
    try {
      const existing = await prisma.systemConfig.findUnique({
        where: { key: setting.key },
      });

      if (existing) {
        // Update existing setting
        await prisma.systemConfig.update({
          where: { key: setting.key },
          data: { value: setting.value },
        });
        updated++;
        console.log(`🔄 Updated: ${setting.key} = ${setting.value}`);
      } else {
        await prisma.systemConfig.create({
          data: setting,
        });
        created++;
        console.log(`✅ Created: ${setting.key} = ${setting.value}`);
      }
    } catch (error: any) {
      console.error(`❌ Error with ${setting.key}:`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${updated} updated`);
}

async function main() {
  console.log('🚀 Starting settings seed process...\n');

  await seedSettings();

  console.log('\n✅ Settings seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
