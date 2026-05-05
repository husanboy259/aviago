import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrdersGateway } from '../gateways/orders.gateway';
import { CreateOrderDto, UpdateOrderStatusDto, AssignDroneDto } from '@delidrone/common';
import { OrderStatus, PaymentStatus, UserRole } from '@delidrone/common';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly itemRepo: Repository<OrderItemEntity>,
    private readonly gateway: OrdersGateway,
    private readonly config: ConfigService,
  ) {}

  async create(customerId: string, dto: CreateOrderDto): Promise<OrderEntity> {
    // Fetch restaurant info from restaurant-service
    const restaurant = await this.fetchRestaurant(dto.restaurantId);
    if (!restaurant.isOpen) {
      throw new BadRequestException('Restaurant is currently closed');
    }

    // Fetch menu items to get real prices (prevent price manipulation)
    const menu = await this.fetchMenuItems(dto.restaurantId);
    const menuMap = new Map(menu.map((item: any) => [item.id, item]));

    let subtotal = 0;
    const orderItems: Partial<OrderItemEntity>[] = [];

    for (const reqItem of dto.items) {
      const menuItem = menuMap.get(reqItem.menuItemId) as any;
      if (!menuItem) throw new BadRequestException(`Menu item ${reqItem.menuItemId} not found`);
      if (!menuItem.isAvailable) throw new BadRequestException(`${menuItem.name} is unavailable`);

      const lineTotal = menuItem.price * reqItem.quantity;
      subtotal += lineTotal;
      orderItems.push({
        menuItemId: reqItem.menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: reqItem.quantity,
        imageUrl: menuItem.imageUrl,
      });
    }

    const deliveryFee = restaurant.deliveryFee;
    const total = subtotal + deliveryFee;

    if (total < restaurant.minOrderAmount) {
      throw new BadRequestException(`Minimum order is ${restaurant.minOrderAmount}`);
    }

    // Fetch delivery address
    const address = await this.fetchAddress(customerId, dto.deliveryAddressId);

    const order = this.orderRepo.create({
      customerId,
      restaurantId: dto.restaurantId,
      restaurantName: restaurant.name,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: dto.paymentMethod,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress: address,
      notes: dto.notes,
    });

    const saved = await this.orderRepo.save(order);

    // Save items
    const items = orderItems.map(item => this.itemRepo.create({ ...item, orderId: saved.id }));
    await this.itemRepo.save(items);

    const full = await this.findOne(saved.id);

    // Notify restaurant via WebSocket
    this.gateway.notifyRestaurant(dto.restaurantId, 'order:new', full);

    return full;
  }

  async findOne(id: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByCustomer(customerId: string, page = 1, limit = 20) {
    const [data, total] = await this.orderRepo.findAndCount({
      where: { customerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByRestaurant(restaurantId: string, ownerId: string, page = 1, limit = 20) {
    const [data, total] = await this.orderRepo.findAndCount({
      where: { restaurantId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(
    id: string,
    requesterId: string,
    role: UserRole,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderEntity> {
    const order = await this.findOne(id);

    this.validateStatusTransition(order.status, dto.status, role);

    if (role === UserRole.CUSTOMER && order.customerId !== requesterId) {
      throw new ForbiddenException();
    }

    const updates: Partial<OrderEntity> = { status: dto.status };

    if (dto.status === OrderStatus.DELIVERED) {
      updates.deliveredAt = new Date();
    }

    if (dto.status === OrderStatus.CANCELLED) {
      updates.cancellationReason = dto.reason;
    }

    await this.orderRepo.update(id, updates);
    const updated = await this.findOne(id);

    // Broadcast to all subscribed clients
    this.gateway.broadcastOrderStatus(updated);

    return updated;
  }

  async assignDrone(id: string, dto: AssignDroneDto): Promise<OrderEntity> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException('Order must be in PREPARING state to assign drone');
    }

    // Verify drone availability from drone-service
    await this.verifyDroneAvailability(dto.droneId);

    const eta = await this.calculateEta(order, dto.droneId);

    await this.orderRepo.update(id, {
      droneId: dto.droneId,
      status: OrderStatus.DISPATCHED,
      estimatedDeliveryAt: eta,
    });

    const updated = await this.findOne(id);
    this.gateway.broadcastOrderStatus(updated);

    return updated;
  }

  private validateStatusTransition(current: OrderStatus, next: OrderStatus, role: UserRole): void {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
      [OrderStatus.DISPATCHED]: [OrderStatus.IN_FLIGHT, OrderStatus.CANCELLED],
      [OrderStatus.IN_FLIGHT]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.FAILED]: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(`Cannot transition from ${current} to ${next}`);
    }
  }

  private async fetchRestaurant(restaurantId: string): Promise<any> {
    try {
      const url = this.config.get('RESTAURANT_SERVICE_URL', 'http://localhost:3003');
      const { data } = await axios.get(`${url}/api/v1/restaurants/${restaurantId}`);
      return data;
    } catch {
      throw new BadRequestException('Could not fetch restaurant info');
    }
  }

  private async fetchMenuItems(restaurantId: string): Promise<any[]> {
    try {
      const url = this.config.get('RESTAURANT_SERVICE_URL', 'http://localhost:3003');
      const { data } = await axios.get(`${url}/api/v1/restaurants/${restaurantId}/menu`);
      // Flatten grouped menu
      return Object.values(data).flat() as any[];
    } catch {
      throw new BadRequestException('Could not fetch menu');
    }
  }

  private async fetchAddress(userId: string, addressId: string): Promise<any> {
    try {
      const url = this.config.get('USER_SERVICE_URL', 'http://localhost:3002');
      const { data } = await axios.get(`${url}/api/v1/addresses/${addressId}`, {
        headers: { 'x-user-id': userId },
      });
      return data;
    } catch {
      throw new BadRequestException('Could not fetch delivery address');
    }
  }

  private async verifyDroneAvailability(droneId: string): Promise<void> {
    try {
      const url = this.config.get('DRONE_SERVICE_URL', 'http://localhost:3005');
      await axios.get(`${url}/api/v1/drones/${droneId}`);
    } catch {
      throw new BadRequestException('Drone not found or unavailable');
    }
  }

  private async calculateEta(order: OrderEntity, droneId: string): Promise<Date> {
    // Simple ETA: current time + 20 minutes base + distance factor
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + 20);
    return eta;
  }
}
