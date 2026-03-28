const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test donor
  const donor = await prisma.user.upsert({
    where: { email: 'donor@test.com' },
    update: {phone: '7828636838'},
    create: {
      name: 'Anu Restaurant',
      email: 'donor@test.com',
      phone: '7828636838',
      password: await bcrypt.hash('password123', 12),
      role: 'DONOR',
      address: 'MG Road, Mumbai',
      latitude: 19.0760,
      longitude: 72.8777,
    }
  });

  // Create impact for donor
  await prisma.impact.upsert({
    where: { userId: donor.id },
    update: {},
    create: { userId: donor.id }
  });

  // Create test NGO
  const ngo = await prisma.user.upsert({
    where: { email: 'ngo@test.com' },
    update: {phone: '7879660210'},
    create: {
      name: 'Hope Foundation',
      email: 'ngo@test.com',
      phone: '7879660210',
      password: await bcrypt.hash('password123', 12),
      role: 'NGO',
      address: 'Dharavi, Mumbai',
      latitude: 19.0400,
      longitude: 72.8550,
    }
  });

  await prisma.impact.upsert({
    where: { userId: ngo.id },
    update: {},
    create: { userId: ngo.id }
  });

  // Create test volunteer
  const volunteer = await prisma.user.upsert({
    where: { email: 'volunteer@test.com' },
    update: {phone: '7804817064'},
    create: {
      name: 'Priya Sharma',
      email: 'volunteer@test.com',
      phone: '7804817064',
      password: await bcrypt.hash('password123', 12),
      role: 'VOLUNTEER',
      address: 'Bandra, Mumbai',
      latitude: 19.0596,
      longitude: 72.8295,
    }
  });

  await prisma.impact.upsert({
    where: { userId: volunteer.id },
    update: {},
    create: { userId: volunteer.id }
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Test accounts created:');
  console.log('👤 Donor  → donor@test.com / password123');
  console.log('🏢 NGO    → ngo@test.com / password123');
  console.log('❤️ Volunteer → volunteer@test.com / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());