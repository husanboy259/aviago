import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService, SendNotificationDto } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send notification to a user (internal service use)' })
  send(@Body() dto: SendNotificationDto) {
    return this.svc.send(dto);
  }

  @Post('order-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send order status notification' })
  orderStatus(
    @Body()
    body: {
      customerId: string;
      fcmToken: string;
      phone: string;
      orderId: string;
      status: string;
    },
  ) {
    return this.svc.sendOrderStatusNotification(
      body.customerId,
      body.fcmToken,
      body.phone,
      body.orderId,
      body.status,
    );
  }
}
