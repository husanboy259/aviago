import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenuModule } from './menu/menu.module';
import { RestaurantEntity } from './restaurants/entities/restaurant.entity';
import { MenuItemEntity } from './menu/entities/menu-item.entity';

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
        entities: [RestaurantEntity, MenuItemEntity],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
        logging: false,
      }),
      inject: [ConfigService],
    }),
    RestaurantsModule,
    MenuModule,
  ],
})
export class AppModule {}
