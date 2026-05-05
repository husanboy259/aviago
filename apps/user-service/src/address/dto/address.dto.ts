import { IsString, IsNumber, IsBoolean, IsOptional, Length, Min, Max } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @Length(2, 50)
  label: string;

  @IsString()
  @Length(5, 200)
  street: string;

  @IsString()
  @Length(2, 100)
  city: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  label?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
