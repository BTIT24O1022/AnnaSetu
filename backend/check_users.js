const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({role: u.role, name: u.name})));
}

main().finally(() => prisma.$disconnect());
