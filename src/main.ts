import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowLocalhost = process.env.CORS_ALLOW_LOCALHOST !== 'false';

  app.enableCors({
    origin: (origin, callback) => {
      // Requêtes sans Origin (curl, health checks)
      if (!origin) return callback(null, true);
      if (frontendOrigins.includes(origin)) return callback(null, true);
      // Dev local — Vite peut utiliser 5173, 5174, 5175…
      if (
        allowLocalhost &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.MICROSERVICE_HOST ?? '0.0.0.0',
      port: Number(process.env.MICROSERVICE_PORT ?? 8877),
    },
  });

  await app.startAllMicroservices();
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`ODIN ERP API listening on port ${port}`);
}
bootstrap();
