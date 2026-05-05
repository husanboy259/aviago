import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentModule } from './payment/payment.module';
import { TransactionEntity } from './transactions/entities/transaction.entity';

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
        entities: [TransactionEntity],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
        logging: false,
      }),
      inject: [ConfigService],
    }),
    PaymentModule,
  ],
})
export class AppModule {}
