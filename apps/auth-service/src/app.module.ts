import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UserEntity } from './users/user.entity';
import { RefreshTokenEntity } from './auth/entities/refresh-token.entity';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (c: ConfigService) => ({
        type: 'postgres',
        host: c.get('POSTGRES_HOST'),
        port: c.get<number>('POSTGRES_PORT', 5432),
        username: c.get('POSTGRES_USER'),
        password: c.get('POSTGRES_PASSWORD'),
        database: c.get('POSTGRES_DB', 'neondb'),
        entities: [UserEntity, RefreshTokenEntity],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
        logging: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
