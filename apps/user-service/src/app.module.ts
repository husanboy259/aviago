import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AddressModule } from './address/address.module';
import { UserEntity } from './users/entities/user.entity';
import { AddressEntity } from './address/entities/address.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (c: ConfigService) => ({
        type: 'postgres',
        host: c.get('POSTGRES_HOST'),
        port: c.get<number>('POSTGRES_PORT', 5432),
        username: c.get('POSTGRES_USER'),
        password: c.get('POSTGRES_PASSWORD'),
        database: c.get('POSTGRES_DB', 'neondb'),
        entities: [UserEntity, AddressEntity],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
        logging: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AddressModule,
  ],
})
export class AppModule {}
