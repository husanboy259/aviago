import { IsString, IsPhoneNumber, IsOptional, IsEmail, Length, IsEnum } from 'class-validator';
import { UserRole } from '../enums';

export class SendOtpDto {
  @IsString()
  @IsPhoneNumber()
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

export class RegisterDto {
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @Length(2, 50)
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
