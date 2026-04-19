const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUsers() {
    const users = await prisma.user.findMany({ select: { email: true, name: true, role: true }});
    console.log(users);
}
getUsers();
