import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('ApiGateway');

  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('DeliDrone API')
    .setDescription('Unified API Gateway for the DeliDrone platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Users')
    .addTag('Addresses')
    .addTag('Restaurants')
    .addTag('Menu')
    .addTag('Orders')
    .addTag('Drones')
    .addTag('Payments')
    .addTag('Analytics')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT || 10000;
  await app.listen(port, '0.0.0.0');
  logger.log(`API Gateway running on port ${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
