import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DronesController } from './drones.controller';
import { DronesService } from './drones.service';
import { DroneEntity } from './entities/drone.entity';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { JwtStrategy } from '../common/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([DroneEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (c: ConfigService) => ({ secret: c.get('JWT_SECRET') }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DronesController],
  providers: [DronesService, TrackingGateway, JwtStrategy],
  exports: [DronesService],
})
export class DronesModule {}
