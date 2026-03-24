const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting deletion...");
    try {
        const result = await prisma.$executeRaw`DELETE FROM users WHERE role = '' OR role IS NULL OR role NOT IN ('USER', 'ADMIN', 'ORGANIZER')`;
        console.log('Deleted users:', result);
    } catch (e) {
        console.error("Failed to delete from users table, trying User table...");
        try {
            const result2 = await prisma.$executeRaw`DELETE FROM User WHERE role = '' OR role IS NULL OR role NOT IN ('USER', 'ADMIN', 'ORGANIZER')`;
            console.log('Deleted users:', result2);
        } catch (e2) {
            console.error(e2);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    });
