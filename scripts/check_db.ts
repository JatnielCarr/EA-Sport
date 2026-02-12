import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    let output = '--- Database Diagnosis ---\n';
    try {
        // Check connection
        await prisma.$connect();
        output += '✅ Database connected successfully\n';

        // Count records
        const userCount = await prisma.user.count();
        const tournamentCount = await prisma.tournament.count();
        const teamCount = await prisma.team.count();
        const gameCount = await prisma.game.count();
        const matchCount = await prisma.match.count();

        output += `\n--- Record Counts ---\n`;
        output += `Users: ${userCount}\n`;
        output += `Tournaments: ${tournamentCount}\n`;
        output += `Teams: ${teamCount}\n`;
        output += `Games: ${gameCount}\n`;
        output += `Matches: ${matchCount}\n`;

        if (tournamentCount === 0) {
            output += '\n⚠️ WARNING: No tournaments found. Dashboard will be empty.\n';
        } else {
            output += '\n✅ Tournaments exist.\n';
        }

    } catch (error) {
        output += '\n❌ ERROR: Failed to connect or query database.\n';
        output += String(error) + '\n';
    } finally {
        await prisma.$disconnect();

        // Write to file
        const filePath = path.join(__dirname, 'db_status.txt');
        fs.writeFileSync(filePath, output);
        console.log('Diagnosis written to ' + filePath);
    }
}

main();
