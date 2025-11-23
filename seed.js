const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seeding...');
    
    // Create Admin Role
    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin'
      }
    });

    console.log(`Created role: ${adminRole.name} with ID: ${adminRole.id}`);
    
    // Create User Role
    const userRole = await prisma.role.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User'
      }
    });
    
    console.log(`Created role: ${userRole.name} with ID: ${userRole.id}`);

    // Create menus
    const dashboardMenu = await prisma.menus.upsert({
      where: { id: 1 },
      update: {},
      create: {
        menu_name: 'Dashboard',
        icon: 'home',
        path: '/dashboard',
        menu_order: 1
      }
    });
    
    const profileMenu = await prisma.menus.upsert({
      where: { id: 2 },
      update: {},
      create: {
        menu_name: 'Profile',
        icon: 'user',
        path: '/profile',
        menu_order: 2
      }
    });
    
    const settingsMenu = await prisma.menus.upsert({
      where: { id: 3 },
      update: {},
      create: {
        menu_name: 'Settings',
        icon: 'settings',
        path: '/settings',
        menu_order: 3
      }
    });

    console.log('Created menus');
    
    // Connect Role to Menus
    await prisma.role_menus.upsert({
      where: { id: 1 },
      update: {},
      create: {
        role_id: adminRole.id,
        menu_id: dashboardMenu.id
      }
    });
    
    await prisma.role_menus.upsert({
      where: { id: 2 },
      update: {},
      create: {
        role_id: adminRole.id,
        menu_id: profileMenu.id
      }
    });
    
    await prisma.role_menus.upsert({
      where: { id: 3 },
      update: {},
      create: {
        role_id: adminRole.id,
        menu_id: settingsMenu.id
      }
    });
    
    await prisma.role_menus.upsert({
      where: { id: 4 },
      update: {},
      create: {
        role_id: userRole.id,
        menu_id: dashboardMenu.id
      }
    });
    
    await prisma.role_menus.upsert({
      where: { id: 5 },
      update: {},
      create: {
        role_id: userRole.id,
        menu_id: profileMenu.id
      }
    });
    
    console.log('Linked roles to menus');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@adops.com' },
      update: {
        password_hash: hashedPassword,
        roleId: adminRole.id,
        name: 'Administrator'
      },
      create: {
        email: 'admin@adops.com',
        password_hash: hashedPassword,
        name: 'Administrator',
        roleId: adminRole.id,
        department: 'IT',
        position: 'System Admin'
      }
    });
    
    console.log(`Created admin user: ${admin.email}`);
    
    // Create test user
    const userPassword = await bcrypt.hash('user123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'user@adops.com' },
      update: {
        password_hash: userPassword,
        roleId: userRole.id,
        name: 'Test User'
      },
      create: {
        email: 'user@adops.com',
        password_hash: userPassword,
        name: 'Test User',
        roleId: userRole.id,
        department: 'Operations',
        position: 'Staff'
      }
    });
    
    console.log(`Created regular user: ${user.email}`);
    
    console.log('Database seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});