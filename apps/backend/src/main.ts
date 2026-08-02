import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { execSync } from 'child_process';
import { AppModule } from './app/app.module';

// Construct DATABASE_URL from individual env vars (injected by ECS from Secrets Manager)
if (
  process.env.DB_HOST &&
  process.env.DB_USERNAME &&
  process.env.DB_PASSWORD &&
  !process.env.DATABASE_URL
) {
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT || '5432';
  const dbUser = process.env.DB_USERNAME;
  const dbPass = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME || 'darkcloud_ems';
  process.env.DATABASE_URL = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?schema=public`;
}

// Automatically sync schema & seed initial data on container boot
if (process.env.DATABASE_URL) {
  try {
    Logger.log('🔄 Syncing Database Schema with Prisma...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    Logger.log('🌱 Seeding initial database data...');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
    Logger.log('✅ Database setup and seed completed.');
  } catch (err) {
    Logger.error('Database setup/seed notice:', err);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: configurable via env var, defaults to localhost for dev
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:4200'];

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Health check endpoint (used by ALB target group health checks)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/api/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 3000;
  // Bind to 0.0.0.0 for container compatibility (not just localhost)
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Application is running on: http://0.0.0.0:${port}/${globalPrefix}`);
}

bootstrap();
