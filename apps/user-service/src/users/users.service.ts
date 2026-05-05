import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UserEntity } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserStatus } from '@delidrone/common';

@Injectable()
export class UsersService {
  private s3: S3Client;
  private bucket: string;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly config: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: config.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
    this.bucket = config.get('AWS_S3_BUCKET', 'delidrone-media');
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['addresses'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserEntity> {
    await this.userRepo.update(id, dto);
    return this.findById(id);
  }

  async updateFcmToken(id: string, fcmToken: string): Promise<void> {
    await this.userRepo.update(id, { fcmToken });
  }

  async getAvatarUploadUrl(userId: string, mimeType: string): Promise<{ uploadUrl: string; key: string }> {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(mimeType)) {
      throw new BadRequestException('Only JPEG, PNG and WebP images are allowed');
    }

    const ext = mimeType.split('/')[1];
    const key = `avatars/${userId}/${Date.now()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    return { uploadUrl, key };
  }

  async confirmAvatarUpload(userId: string, key: string): Promise<UserEntity> {
    const avatarUrl = `https://${this.bucket}.s3.amazonaws.com/${key}`;

    const user = await this.findById(userId);
    // Delete old avatar from S3 if exists
    if (user.avatarUrl) {
      const oldKey = user.avatarUrl.split('.com/')[1];
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: oldKey })).catch(() => {});
    }

    await this.userRepo.update(userId, { avatarUrl });
    return this.findById(userId);
  }

  async deactivateAccount(id: string): Promise<void> {
    await this.userRepo.update(id, { status: UserStatus.INACTIVE });
  }

  async getOrderHistory(userId: string): Promise<{ message: string }> {
    // Proxied to order-service — returns stub here
    return { message: `Order history for user ${userId} — query order-service` };
  }
}
