import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  defaultPassword: 'admin123',
  saltRounds: 10,
  adminEmail: 'admin@easports.com',
  adminUsername: 'AdminEA',
  minPasswordLength: 6
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset'): void {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function parseArgs(): { password?: string; dryRun: boolean; skipConfirm: boolean; email?: string } {
  const args = process.argv.slice(2);
  return {
    password: args.find(a => a.startsWith('--password='))?.split('=')[1],
    dryRun: args.includes('--dry-run'),
    skipConfirm: args.includes('--yes') || args.includes('-y'),
    email: args.find(a => a.startsWith('--email='))?.split('=')[1]
  };
}

function validatePassword(password: string): boolean {
  if (password.length < CONFIG.minPasswordLength) {
    log(`Password must be at least ${CONFIG.minPasswordLength} characters`, 'red');
    return false;
  }
  return true;
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${message} (y/N): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function showCurrentState(): Promise<void> {
  const totalUsers = await prisma.user.count();
  const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
  const verifiedUsers = await prisma.user.count({ where: { verified: true } });

  log('📊 Current database state:', 'cyan');
  console.log(`   Total users: ${totalUsers}`);
  console.log(`   Admins: ${admins}`);
  console.log(`   Verified users: ${verifiedUsers}`);
}

async function updatePasswords(): Promise<void> {
  const args = parseArgs();
  const password = args.password || CONFIG.defaultPassword;

  // Show help
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
${colors.cyan}Update Admin Script${colors.reset}
Usage: npx ts-node scripts/update-admin.ts [options]

Options:
  --password=<pwd>  Set custom password (default: ${CONFIG.defaultPassword})
  --email=<email>   Set admin email (default: ${CONFIG.adminEmail})
  --dry-run         Show what would happen without making changes
  --yes, -y         Skip confirmation prompt
  --help, -h        Show this help message
    `);
    return;
  }

  // Validate password
  if (!validatePassword(password)) {
    process.exit(1);
  }

  try {
    await showCurrentState();

    // Confirmation for destructive operation
    if (!args.skipConfirm && !args.dryRun) {
      const confirmed = await confirm('⚠️  This will reset ALL user passwords. Continue?');
      if (!confirmed) {
        log('Operation cancelled by user', 'yellow');
        return;
      }
    }

    if (args.dryRun) {
      log('🔍 DRY RUN MODE - No changes will be made', 'yellow');
    }

    const hash = await bcrypt.hash(password, CONFIG.saltRounds);
    
    // Update all users' passwords
    if (!args.dryRun) {
      const updateResult = await prisma.user.updateMany({
        data: { password_hash: hash }
      });
      log(`Updated passwords for ${updateResult.count} users`, 'green');
    } else {
      const count = await prisma.user.count();
      log(`Would update passwords for ${count} users`, 'blue');
    }
    
    // Create or update admin
    const adminEmail = args.email || CONFIG.adminEmail;
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    if (!existingAdmin) {
      if (!args.dryRun) {
        await prisma.user.create({
          data: {
            email: adminEmail,
            username: CONFIG.adminUsername,
            password_hash: hash,
            role: 'ADMIN',
            verified: true
          }
        });
        log(`Created new admin: ${adminEmail}`, 'green');
      } else {
        log(`Would create new admin: ${adminEmail}`, 'blue');
      }
    } else {
      log(`Existing admin found: ${existingAdmin.email}`, 'cyan');
    }

    // Summary
    console.log('\n' + '═'.repeat(50));
    if (args.dryRun) {
      log('🔍 Dry run complete - no changes made', 'yellow');
    } else {
      log(`✅ All passwords updated to: ${password}`, 'green');
      log(`📧 Login with any user email and password: ${password}`, 'green');
    }
    console.log('═'.repeat(50));

  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();
