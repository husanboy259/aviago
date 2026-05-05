import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NotificationType } from '@delidrone/common';

export interface SendNotificationDto {
  userId: string;
  fcmToken?: string;
  phone?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private eskizToken: string | null = null;

  constructor(private readonly config: ConfigService) {}

  async send(dto: SendNotificationDto): Promise<void> {
    const tasks: Promise<void>[] = [];
    if (dto.fcmToken) tasks.push(this.sendPush(dto.fcmToken, dto.title, dto.body, dto.data));
    if (dto.phone)    tasks.push(this.sendSms(dto.phone, `${dto.title}: ${dto.body}`));
    await Promise.allSettled(tasks);
  }

  async sendOrderStatusNotification(
    customerId: string,
    fcmToken: string,
    phone: string,
    orderId: string,
    status: string,
  ): Promise<void> {
    const messages: Record<string, { title: string; body: string }> = {
      accepted:   { title: '✅ Order Accepted',   body: 'Your order is being prepared!' },
      preparing:  { title: '🍳 Preparing',        body: 'The kitchen is working on your order.' },
      dispatched: { title: '🚁 Drone Dispatched', body: 'Your drone is on the way!' },
      in_flight:  { title: '🛸 In Flight',        body: 'Drone is flying to your location.' },
      delivered:  { title: '🎉 Delivered!',       body: 'Enjoy your order!' },
      cancelled:  { title: '❌ Order Cancelled',  body: 'Your order was cancelled.' },
    };
    const msg = messages[status] || { title: 'Order Update', body: `Status: ${status}` };
    await this.send({
      userId: customerId,
      fcmToken,
      phone,
      type: NotificationType.ORDER_PLACED,
      title: msg.title,
      body: msg.body,
      data: { orderId, status },
    });
  }

  // FCM HTTP v1 — sends via the legacy FCM endpoint using server key
  private async sendPush(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const serverKey = this.config.get('FCM_SERVER_KEY');
    if (!serverKey) {
      this.logger.debug(`[DEV PUSH] → ${token.slice(0, 20)}… | ${title}: ${body}`);
      return;
    }

    try {
      await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        {
          to: token,
          notification: { title, body, sound: 'default', badge: '1' },
          data,
          priority: 'high',
        },
        { headers: { Authorization: `key=${serverKey}`, 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      this.logger.error(`Push failed: ${err.message}`);
    }
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    if (this.config.get('NODE_ENV') === 'development') {
      this.logger.debug(`[DEV SMS] ${phone}: ${message}`);
      return;
    }
    try {
      if (!this.eskizToken) await this.refreshEskizToken();
      await axios.post(
        'https://notify.eskiz.uz/api/message/sms/send',
        { mobile_phone: phone.replace('+', ''), message, from: '4546' },
        { headers: { Authorization: `Bearer ${this.eskizToken}` } },
      );
    } catch (err) {
      this.logger.error(`SMS failed to ${phone}: ${err.message}`);
    }
  }

  private async refreshEskizToken(): Promise<void> {
    const { data } = await axios.post('https://notify.eskiz.uz/api/auth/login', {
      email: this.config.get('ESKIZ_EMAIL'),
      password: this.config.get('ESKIZ_PASSWORD'),
    });
    this.eskizToken = data.data.token;
  }
}
