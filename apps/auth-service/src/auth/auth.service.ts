import {
  Injectable, Logger, UnauthorizedException,
  ConflictException, NotFoundException, BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { UserEntity } from "../users/user.entity";
import { RefreshTokenEntity } from "./entities/refresh-token.entity";
import { IJwtPayload, UserRole, UserStatus } from "@delidrone/common";
import { RegisterDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly tokenRepo: Repository<RefreshTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; refreshToken: string; user: UserEntity }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Email already registered");

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role || UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: false,
    });
    await this.userRepo.save(user);
    const tokens = await this.generateTokens(user);
    return { ...tokens, user };
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: UserEntity }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid email or password");
    if (!user.password) throw new UnauthorizedException("Use OTP login");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException("Invalid email or password");

    if (user.status !== UserStatus.ACTIVE) throw new UnauthorizedException("Account is inactive");

    const tokens = await this.generateTokens(user);
    return { ...tokens, user };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: IJwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, { secret: this.config.get("JWT_REFRESH_SECRET") });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const stored = await this.tokenRepo.findOne({ where: { userId: payload.sub, revoked: false } });
    if (!stored || stored.expiresAt < new Date()) throw new UnauthorizedException("Refresh token expired");
    await this.tokenRepo.update(stored.id, { revoked: true });

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new NotFoundException("User not found");
    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.tokenRepo.update({ userId, revoked: false }, { revoked: true });
  }

  async getProfile(userId: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  private async generateTokens(user: UserEntity) {
    const payload: IJwtPayload = { sub: user.id, phone: user.phone || "", role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get("JWT_REFRESH_EXPIRES_IN", "30d"),
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.tokenRepo.save({ userId: user.id, tokenHash: await bcrypt.hash(refreshToken, 10), expiresAt });
    return { accessToken, refreshToken };
  }
}
