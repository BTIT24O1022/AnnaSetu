const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const donations = await prisma.donation.findMany();
  console.log('Total donations:', donations.length);
  donations.forEach(d => console.log(d.id, d.status, d.latitude, d.longitude));
}
main().catch(console.error).finally(() => prisma.$disconnect());
