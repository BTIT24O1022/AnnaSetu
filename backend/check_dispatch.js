const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dispatches = await prisma.dispatch.findMany();
  console.log('Dispatches:', JSON.stringify(dispatches, null, 2));
}

main().finally(() => prisma.$disconnect());
