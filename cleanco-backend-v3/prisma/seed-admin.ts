import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
  console.log('🌱 Seeding admin users...');

  const admins = [
    {
      username: 'admin',
      password: 'password',
      email: 'admin@cleanco.mv',
      firstName: 'Super',
      lastName: 'Admin',
      role: AdminRole.SUPER_ADMIN,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const adminData of admins) {
    try {
      const existing = await prisma.admin.findUnique({
        where: { username: adminData.username },
      });

      if (existing) {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${adminData.username}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(adminData.password, 10);

      await prisma.admin.create({
        data: {
          username: adminData.username,
          passwordHash,
          email: adminData.email,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          role: adminData.role,
          isActive: true,
        },
      });

      created++;
      console.log(`✅ Created admin: ${adminData.username} (${adminData.role})`);
    } catch (error: any) {
      console.error(`❌ Error creating ${adminData.username}:`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
}

async function main() {
  console.log('🚀 Starting admin seed process...\n');

  await seedAdmin();

  console.log('\n✅ Admin seed completed successfully!');
  console.log('📝 Default credentials: username=admin, password=password');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
