import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@delidrone/common';
import { OrderItemEntity } from './order-item.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @Index()
  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @Column({ name: 'drone_id', nullable: true })
  droneId?: string;

  @Column({ type: 'varchar', default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'varchar', default: PaymentStatus.PENDING, name: 'payment_status' })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', name: 'payment_method' })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_transaction_id', nullable: true })
  paymentTransactionId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 10, scale: 2 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'delivery_address', type: 'simple-json' })
  deliveryAddress: {
    id: string;
    label: string;
    street: string;
    city: string;
    latitude: number;
    longitude: number;
  };

  @Column({ name: 'estimated_delivery_at', nullable: true })
  estimatedDeliveryAt?: Date;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'cancellation_reason', nullable: true })
  cancellationReason?: string;

  @Column({ name: 'restaurant_name' })
  restaurantName: string;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true })
  items: OrderItemEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


