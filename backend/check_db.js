const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const donations = await prisma.donation.findMany();
  console.log('Donations:', donations.map(d => ({id: d.id, status: d.status, lat: d.latitude, lng: d.longitude})));
  
  const dispatches = await prisma.dispatch.findMany();
  console.log('Dispatches:', dispatches.map(d => ({id: d.id, st: d.status, d_id: d.donationId})));
}

main().finally(() => prisma.$disconnect());
