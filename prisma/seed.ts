import { PrismaClient } from '@prisma/client';
import { auth } from '../apps/backend/src/auth/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminEmail = 'admin@darkcloud.com';
  const adminPassword = 'admin123';

  // Delete existing admin to re-seed cleanly
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    await prisma.user.delete({
      where: { id: existingUser.id },
    });
  }

  // Create Admin account using BetterAuth API
  try {
    await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: 'System Administrator',
      },
    });

    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: 'SUPER_ADMIN',
        permissions: 'all',
      },
    });

    console.log(
      `✅ Default admin created via BetterAuth: ${adminEmail} (password: ${adminPassword})`,
    );
  } catch (err) {
    console.error('Failed to create admin via BetterAuth API:', err);
  }

  // Create initial departments
  const defaultDepartments = [
    { name: 'Engineering', description: 'Software engineering, QA, and product development' },
    {
      name: 'Human Resources',
      description: 'Talent acquisition, employee relations, and HR compliance',
    },
    { name: 'Finance & Accounting', description: 'Financial planning, payroll, and auditing' },
    {
      name: 'Marketing & Sales',
      description: 'Brand promotion, digital marketing, and business growth',
    },
  ];

  for (const dept of defaultDepartments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  console.log('✅ Initial departments created.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
