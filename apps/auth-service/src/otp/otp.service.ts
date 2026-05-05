import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { OtpEntity } from "./otp.entity";

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(OtpEntity)
    private readonly otpRepo: Repository<OtpEntity>,
    private readonly config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host:   config.get("SMTP_HOST",    "smtp.gmail.com"),
      port:   config.get<number>("SMTP_PORT", 587),
      secure: false,
      auth: {
        user: config.get("SMTP_USER", ""),
        pass: config.get("SMTP_PASS", ""),
      },
    });
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtpToEmail(email: string): Promise<void> {
    await this.otpRepo.update({ email, used: false }, { used: true });
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.config.get<number>("OTP_EXPIRES_IN", 300) * 1000);
    await this.otpRepo.save({ email, code, expiresAt, used: false });

    if (this.config.get("NODE_ENV") === "development") {
      this.logger.log(`[DEV OTP] Email: ${email}  Code: ${code}`);
      return;
    }
    await this.sendEmail(email, code);
  }

  async sendOtpToPhone(phone: string): Promise<void> {
    await this.otpRepo.update({ phone, used: false }, { used: true });
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.config.get<number>("OTP_EXPIRES_IN", 300) * 1000);
    await this.otpRepo.save({ phone, code, expiresAt, used: false });
    this.logger.log(`[DEV OTP] Phone: ${phone}  Code: ${code}`);
  }

  async verifyOtpByEmail(email: string, code: string): Promise<boolean> {
    const otp = await this.otpRepo.findOne({
      where: { email, code, used: false },
      order: { createdAt: "DESC" },
    });
    if (!otp)                       throw new BadRequestException("Invalid OTP code");
    if (new Date() > otp.expiresAt) throw new BadRequestException("OTP expired");
    await this.otpRepo.update(otp.id, { used: true });
    return true;
  }

  async verifyOtpByPhone(phone: string, code: string): Promise<boolean> {
    const otp = await this.otpRepo.findOne({
      where: { phone, code, used: false },
      order: { createdAt: "DESC" },
    });
    if (!otp)                       throw new BadRequestException("Invalid OTP code");
    if (new Date() > otp.expiresAt) throw new BadRequestException("OTP expired");
    await this.otpRepo.update(otp.id, { used: true });
    return true;
  }

  private async sendEmail(to: string, code: string): Promise<void> {
    const from = this.config.get("SMTP_FROM") || this.config.get("SMTP_USER") || "noreply@delidrone.uz";
    try {
      await this.transporter.sendMail({
        from: `"DeliDrone" <${from}>`,
        to,
        subject: `DeliDrone verification code: ${code}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#1A1A1A;color:#fff;border-radius:12px;overflow:hidden;"><div style="background:#00AEEF;padding:24px;text-align:center;"><h1 style="margin:0;">DeliDrone</h1></div><div style="padding:32px;text-align:center;"><p style="color:#aaa;">Your verification code:</p><div style="font-size:48px;font-weight:bold;letter-spacing:12px;color:#00AEEF;margin:16px 0;">${code}</div><p style="color:#aaa;font-size:13px;">Valid for 5 minutes.</p></div></div>`,
      });
      this.logger.log(`OTP email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Email failed to ${to}: ${err.message}`);
    }
  }
}
