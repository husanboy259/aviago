import {
  Controller, Get, Patch, Post, Delete,
  Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from './entities/user.entity';
import {
  UpdateProfileDto, AvatarUploadDto,
  ConfirmAvatarDto, UpdateFcmTokenDto,
} from './dto/update-profile.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  getProfile(@CurrentUser() user: UserEntity) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  updateProfile(@CurrentUser() user: UserEntity, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar/upload-url')
  @ApiOperation({ summary: 'Get presigned URL for avatar upload' })
  getAvatarUploadUrl(@CurrentUser() user: UserEntity, @Body() dto: AvatarUploadDto) {
    return this.usersService.getAvatarUploadUrl(user.id, dto.mimeType);
  }

  @Post('me/avatar/confirm')
  @ApiOperation({ summary: 'Confirm avatar upload after S3 PUT' })
  confirmAvatar(@CurrentUser() user: UserEntity, @Body() dto: ConfirmAvatarDto) {
    return this.usersService.confirmAvatarUpload(user.id, dto.key);
  }

  @Patch('me/fcm-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update Firebase push notification token' })
  updateFcmToken(@CurrentUser() user: UserEntity, @Body() dto: UpdateFcmTokenDto) {
    return this.usersService.updateFcmToken(user.id, dto.fcmToken);
  }

  @Get('me/orders')
  @ApiOperation({ summary: 'Get order history' })
  getOrders(@CurrentUser() user: UserEntity) {
    return this.usersService.getOrderHistory(user.id);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate account' })
  deactivate(@CurrentUser() user: UserEntity) {
    return this.usersService.deactivateAccount(user.id);
  }

  // Admin-only: get any user by ID
  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
