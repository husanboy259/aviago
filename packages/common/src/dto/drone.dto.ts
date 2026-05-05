import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { DroneStatus } from '../enums';

export class CreateDroneDto {
  @IsString()
  serialNumber: string;

  @IsString()
  model: string;

  @IsNumber()
  @Min(100)
  maxPayloadGrams: number;

  @IsNumber()
  @Min(1)
  maxRangeKm: number;
}

export class UpdateDroneLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  altitude: number;

  @IsNumber()
  speed: number;

  @IsNumber()
  heading: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  batteryPercent: number;
}

export class UpdateDroneStatusDto {
  @IsEnum(DroneStatus)
  status: DroneStatus;
}

export class AssignRouteDto {
  @IsNumber()
  originLat: number;

  @IsNumber()
  originLng: number;

  @IsNumber()
  destLat: number;

  @IsNumber()
  destLng: number;

  @IsOptional()
  @IsString()
  orderId?: string;
}
