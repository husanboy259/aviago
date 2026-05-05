import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Length, Min } from 'class-validator';

export class CreateMenuItemDto {
  @IsString() @Length(2, 100) name: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsString() @Length(2, 50) category: string;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsNumber() preparationMinutes?: number;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsArray() allergens?: string[];
}

export class UpdateMenuItemDto {
  @IsOptional() @IsString() @Length(2, 100) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsNumber() preparationMinutes?: number;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsArray() allergens?: string[];
}
