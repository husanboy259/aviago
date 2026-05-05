import { IsString, IsOptional, IsEmail, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class AvatarUploadDto {
  @IsString()
  mimeType: string;
}

export class ConfirmAvatarDto {
  @IsString()
  key: string;
}

export class UpdateFcmTokenDto {
  @IsString()
  fcmToken: string;
}
