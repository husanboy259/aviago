import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IGpsLocation, DeliveryEventType } from '@delidrone/common';
import { DroneEntity } from '../drones/entities/drone.entity';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token, { secret: this.config.get('JWT_SECRET') });
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join(`user:${payload.sub}`);
      this.logger.log(`Tracking client: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Tracking disconnect: ${client.id}`);
  }

  @SubscribeMessage('track:drone')
  handleTrackDrone(@ConnectedSocket() client: Socket, @MessageBody() droneId: string) {
    client.join(`drone:${droneId}`);
    return { event: 'tracking', droneId };
  }

  @SubscribeMessage('track:order')
  handleTrackOrder(@ConnectedSocket() client: Socket, @MessageBody() orderId: string) {
    client.join(`tracking:order:${orderId}`);
    return { event: 'tracking', orderId };
  }

  @SubscribeMessage('untrack:drone')
  handleUntrackDrone(@ConnectedSocket() client: Socket, @MessageBody() droneId: string) {
    client.leave(`drone:${droneId}`);
  }

  broadcastDroneLocation(location: IGpsLocation) {
    this.server.to(`drone:${location.droneId}`).emit(DeliveryEventType.DRONE_LOCATION, location);
    // Also emit to any order tracking the drone's current delivery
    this.server.emit(`tracking:drone:${location.droneId}`, location);
  }

  broadcastDroneStatus(drone: DroneEntity) {
    this.server.emit(DeliveryEventType.DRONE_STATUS, {
      droneId: drone.id,
      status: drone.status,
      batteryPercent: drone.batteryPercent,
      orderId: drone.currentOrderId,
    });
  }

  broadcastBatteryAlert(droneId: string, batteryPercent: number) {
    this.server.emit(DeliveryEventType.BATTERY_UPDATE, { droneId, batteryPercent, alert: true });
  }
}
