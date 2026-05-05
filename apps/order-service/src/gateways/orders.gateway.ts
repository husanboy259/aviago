import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrderEntity } from '../orders/entities/order.entity';
import { DeliveryEventType } from '@delidrone/common';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/orders',
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, { secret: this.config.get('JWT_SECRET') });
      client.data.userId = payload.sub;
      client.data.role = payload.role;

      // Auto-join personal room
      client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:order')
  handleSubscribeOrder(@ConnectedSocket() client: Socket, @MessageBody() orderId: string) {
    client.join(`order:${orderId}`);
    return { event: 'subscribed', data: orderId };
  }

  @SubscribeMessage('subscribe:restaurant')
  handleSubscribeRestaurant(@ConnectedSocket() client: Socket, @MessageBody() restaurantId: string) {
    client.join(`restaurant:${restaurantId}`);
    return { event: 'subscribed', data: restaurantId };
  }

  broadcastOrderStatus(order: OrderEntity) {
    // Notify all parties subscribed to this order
    this.server.to(`order:${order.id}`).emit(DeliveryEventType.ORDER_STATUS, order);
    // Notify customer personally
    this.server.to(`user:${order.customerId}`).emit(DeliveryEventType.ORDER_STATUS, order);
    // Notify restaurant room
    this.server.to(`restaurant:${order.restaurantId}`).emit(DeliveryEventType.ORDER_STATUS, order);
  }

  notifyRestaurant(restaurantId: string, event: string, data: unknown) {
    this.server.to(`restaurant:${restaurantId}`).emit(event, data);
  }

  notifyCustomer(customerId: string, event: string, data: unknown) {
    this.server.to(`user:${customerId}`).emit(event, data);
  }
}
