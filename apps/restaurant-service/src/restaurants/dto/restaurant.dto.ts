import {
  IsString, IsNumber, IsBoolean, IsOptional, IsArray,
  Length, Min, Max, IsEnum,
} from 'class-validator';
import { RestaurantStatus } from '@delidrone/common';

export class CreateRestaurantDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @Length(5, 200)
  address: string;

  @IsNumber()
  @Min(-90) @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180) @Max(180)
  longitude: number;

  @IsString()
  phone: string;

  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsNumber()
  deliveryFee?: number;

  @IsOptional()
  @IsNumber()
  estimatedDeliveryMinutes?: number;

  @IsOptional()
  @IsNumber()
  minOrderAmount?: number;
}

export class UpdateRestaurantDto {
  @IsOptional() @IsString() @Length(2, 100) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsArray() categories?: string[];
  @IsOptional() @IsNumber() deliveryFee?: number;
  @IsOptional() @IsNumber() estimatedDeliveryMinutes?: number;
  @IsOptional() @IsNumber() minOrderAmount?: number;
}

export class UpdateAvailabilityDto {
  @IsBoolean()
  isOpen: boolean;
}

export class ApproveRestaurantDto {
  @IsEnum(RestaurantStatus)
  status: RestaurantStatus;
}

export class RestaurantQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsNumber() radiusKm?: number;
  @IsOptional() @IsNumber() page?: number;
  @IsOptional() @IsNumber() limit?: number;
}
