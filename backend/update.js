const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const donations = await prisma.donation.findMany({ take: 3 });
  for (const d of donations) {
    await prisma.donation.update({
      where: { id: d.id },
      data: { status: 'LISTED' }
    });
    console.log(`Updated ${d.id} to LISTED`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
