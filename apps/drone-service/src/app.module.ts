import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DronesModule } from './drones/drones.module';
import { DroneEntity } from './drones/entities/drone.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (c: ConfigService) => ({
        type: 'postgres',
        host: c.get('POSTGRES_HOST'),
        port: c.get<number>('POSTGRES_PORT', 5432),
        username: c.get('POSTGRES_USER'),
        password: c.get('POSTGRES_PASSWORD'),
        database: c.get('POSTGRES_DB', 'neondb'),
        entities: [DroneEntity],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
        logging: false,
      }),
      inject: [ConfigService],
    }),
    DronesModule,
  ],
})
export class AppModule {}
