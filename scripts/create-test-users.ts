/**
 * Script para crear usuarios de prueba: Admin y Líder de Clan
 * Ejecutar con: npx tsx scripts/create-test-users.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
    console.log('🎮 Creando usuarios de prueba para ApexTournament...\n');

    try {
        // =====================================================
        // 1. ADMIN - Acceso completo al panel
        // =====================================================
        const adminEmail = 'admin@apex.com';
        const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (adminExists) {
            // Update to ensure it's admin
            await prisma.user.update({
                where: { email: adminEmail },
                data: { role: 'ADMIN' }
            });
            console.log('✅ Admin ya existía, rol actualizado');
        } else {
            const adminPassword = await bcrypt.hash('admin123', 10);
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    username: 'SuperAdmin',
                    password_hash: adminPassword,
                    role: 'ADMIN',
                    verified: true
                }
            });
            console.log('✅ Admin creado');
        }
        console.log('   📧 Email: admin@apex.com');
        console.log('   🔑 Password: admin123');
        console.log('   👑 Rol: ADMIN (acceso total)\n');

        // =====================================================
        // 2. ORGANIZER - Líder de Clan
        // =====================================================
        const organizerEmail = 'lider@apex.com';
        const organizerExists = await prisma.user.findUnique({ where: { email: organizerEmail } });

        if (organizerExists) {
            await prisma.user.update({
                where: { email: organizerEmail },
                data: { role: 'ORGANIZER' }
            });
            console.log('✅ Organizador ya existía, rol actualizado');
        } else {
            const organizerPassword = await bcrypt.hash('lider123', 10);
            await prisma.user.create({
                data: {
                    email: organizerEmail,
                    username: 'ClanLeader',
                    password_hash: organizerPassword,
                    role: 'ORGANIZER',
                    verified: true
                }
            });
            console.log('✅ Organizador creado');
        }
        console.log('   📧 Email: lider@apex.com');
        console.log('   🔑 Password: lider123');
        console.log('   🏆 Rol: ORGANIZER (líder de clan)\n');

        // =====================================================
        // 3. USER - Usuario normal (para testing)
        // =====================================================
        const userEmail = 'user@apex.com';
        const userExists = await prisma.user.findUnique({ where: { email: userEmail } });

        if (!userExists) {
            const userPassword = await bcrypt.hash('user123', 10);
            await prisma.user.create({
                data: {
                    email: userEmail,
                    username: 'GamerPro',
                    password_hash: userPassword,
                    role: 'USER',
                    verified: true
                }
            });
            console.log('✅ Usuario normal creado');
        } else {
            console.log('✅ Usuario normal ya existía');
        }
        console.log('   📧 Email: user@apex.com');
        console.log('   🔑 Password: user123');
        console.log('   🎮 Rol: USER (sin acceso al panel admin)\n');

        // =====================================================
        // Resumen
        // =====================================================
        console.log('═'.repeat(50));
        console.log('📋 RESUMEN DE CUENTAS DE PRUEBA');
        console.log('═'.repeat(50));
        console.log(`
┌─────────────────────────────────────────────────┐
│  🔐 ADMIN (Panel completo)                      │
│  Email: admin@apex.com                          │
│  Pass:  admin123                                │
├─────────────────────────────────────────────────┤
│  🏆 ORGANIZADOR (Líder de clan)                 │
│  Email: lider@apex.com                          │
│  Pass:  lider123                                │
├─────────────────────────────────────────────────┤
│  🎮 USUARIO (App de jugadores)                  │
│  Email: user@apex.com                           │
│  Pass:  user123                                 │
└─────────────────────────────────────────────────┘
`);
        console.log('🚀 ¡Listo! Puedes iniciar sesión en:');
        console.log('   Admin/Organizador: http://localhost:5173/landing.html');
        console.log('   Usuario normal:    http://localhost:5173/FrontedUser/\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUsers();
