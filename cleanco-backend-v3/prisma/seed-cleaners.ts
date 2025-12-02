import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedCleaners() {
  console.log('🌱 Seeding cleaners...');

  const cleaners = [
    {
      phoneNumber: '+9607123001',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      email: 'ahmed.hassan@cleanco.mv',
      bio: 'Experienced cleaner with 5 years in residential cleaning',
    },
    {
      phoneNumber: '+9607123002',
      firstName: 'Aminath',
      lastName: 'Ali',
      email: 'aminath.ali@cleanco.mv',
      bio: 'Specialist in office and commercial cleaning',
    },
    {
      phoneNumber: '+9607123003',
      firstName: 'Mohamed',
      lastName: 'Ibrahim',
      email: 'mohamed.ibrahim@cleanco.mv',
      bio: 'Detail-oriented cleaner with excellent customer reviews',
    },
    {
      phoneNumber: '+9607123004',
      firstName: 'Fathimath',
      lastName: 'Naseem',
      email: 'fathimath.naseem@cleanco.mv',
      bio: 'Expert in deep cleaning and sanitization',
    },
    {
      phoneNumber: '+9607123005',
      firstName: 'Ali',
      lastName: 'Rasheed',
      email: 'ali.rasheed@cleanco.mv',
      bio: 'Professional cleaner specializing in large properties',
    },
    {
      phoneNumber: '+9607123006',
      firstName: 'Mariyam',
      lastName: 'Hussain',
      email: 'mariyam.hussain@cleanco.mv',
      bio: 'Eco-friendly cleaning specialist',
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const cleanerData of cleaners) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber: cleanerData.phoneNumber },
      });

      if (existingUser) {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${cleanerData.firstName} ${cleanerData.lastName}`);
        continue;
      }

      // Create user with CLEANER role
      const user = await prisma.user.create({
        data: {
          phoneNumber: cleanerData.phoneNumber,
          firstName: cleanerData.firstName,
          lastName: cleanerData.lastName,
          email: cleanerData.email,
          role: 'CLEANER',
          isActive: true,
        },
      });

      // Create cleaner profile
      await prisma.cleanerProfile.create({
        data: {
          userId: user.id,
          isAvailable: true,
          rating: 4.5,
          totalJobs: Math.floor(Math.random() * 50) + 10, // Random between 10-60
          completedJobs: Math.floor(Math.random() * 40) + 5, // Random between 5-45
          bio: cleanerData.bio,
        },
      });

      created++;
      console.log(`✅ Created: ${cleanerData.firstName} ${cleanerData.lastName} (${cleanerData.phoneNumber})`);
    } catch (error: any) {
      console.error(`❌ Error creating ${cleanerData.firstName} ${cleanerData.lastName}:`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
}

async function main() {
  console.log('🚀 Starting cleaners seed process...\n');

  await seedCleaners();

  console.log('\n✅ Cleaners seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
