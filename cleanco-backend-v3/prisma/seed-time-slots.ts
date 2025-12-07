import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to create a date at noon UTC - always the correct calendar date
// regardless of server timezone (works for UTC-12 to UTC+11)
function dateAtNoonUTC(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

async function seedTimeSlots() {
  console.log('🌱 Seeding time slots...');

  const timeSlots = [
    {
      startTime: '08:00',
      endTime: '09:45',
      displayStartTime: '08:00 AM',
      orderIndex: 1,
      isActive: true,
    },
    {
      startTime: '09:45',
      endTime: '11:30',
      displayStartTime: '09:45 AM',
      orderIndex: 2,
      isActive: true,
    },
    {
      startTime: '11:30',
      endTime: '13:15',
      displayStartTime: '11:30 AM',
      orderIndex: 3,
      isActive: true,
    },
    {
      startTime: '14:00',
      endTime: '15:45',
      displayStartTime: '02:00 PM',
      orderIndex: 4,
      isActive: true,
    },
    {
      startTime: '15:45',
      endTime: '17:30',
      displayStartTime: '03:45 PM',
      orderIndex: 5,
      isActive: true,
    },
    {
      startTime: '17:30',
      endTime: '19:15',
      displayStartTime: '05:30 PM',
      orderIndex: 6,
      isActive: true,
    },
    {
      startTime: '19:15',
      endTime: '21:00',
      displayStartTime: '07:15 PM',
      orderIndex: 7,
      isActive: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const slot of timeSlots) {
    try {
      const existing = await prisma.timeSlot.findUnique({
        where: { startTime: slot.startTime },
      });

      if (existing) {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${slot.displayStartTime}`);
      } else {
        await prisma.timeSlot.create({
          data: slot,
        });
        created++;
        console.log(`✅ Created: ${slot.displayStartTime} (${slot.startTime} - ${slot.endTime})`);
      }
    } catch (error: any) {
      console.error(`❌ Error creating ${slot.displayStartTime}:`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
}

async function seedBlackoutDates() {
  console.log('\n🌱 Seeding blackout dates...');

  const blackoutDates = [
    {
      date: dateAtNoonUTC(2025, 1, 1),
      reason: "New Year's Day",
      isRecurring: true,
    },
    {
      date: dateAtNoonUTC(2025, 7, 26),
      reason: 'Independence Day',
      isRecurring: true,
    },
    {
      date: dateAtNoonUTC(2025, 12, 25),
      reason: 'Christmas Day',
      isRecurring: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const blackout of blackoutDates) {
    try {
      const existing = await prisma.blackoutDate.findUnique({
        where: { date: blackout.date },
      });

      if (existing) {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${blackout.reason}`);
      } else {
        await prisma.blackoutDate.create({
          data: blackout,
        });
        created++;
        console.log(`✅ Created: ${blackout.reason} - ${blackout.date.toDateString()}`);
      }
    } catch (error: any) {
      console.error(`❌ Error creating ${blackout.reason}:`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
}

async function main() {
  console.log('🚀 Starting time slots seed process...\n');

  await seedTimeSlots();
  await seedBlackoutDates();

  console.log('\n✅ Time slots seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
