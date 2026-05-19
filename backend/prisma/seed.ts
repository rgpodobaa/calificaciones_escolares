import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/db';

async function main() {
  console.log('Iniciando el seeder...');

  const directivoEmail = 'admin@colegio.edu.ar';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: directivoEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: directivoEmail,
        password: hashedPassword,
        name: 'Director',
        lastName: 'General',
        dni: '12345678',
        role: Role.DIRECTIVO,
      }
    });
    console.log(`Usuario creado: ${admin.email} (Rol: DIRECTIVO)`);
  } else {
    console.log('El usuario directivo ya existe.');
  }

  console.log('Seeder finalizado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
