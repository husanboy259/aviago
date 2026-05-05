import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { RestaurantStatus } from '@delidrone/common';
import { MenuItemEntity } from '../../menu/entities/menu-item.entity';

@Entity('restaurants')
export class RestaurantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl?: string;

  @Column({ length: 200 })
  address: string;

  @Index()
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Index()
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'total_orders', default: 0 })
  totalOrders: number;

  @Column({ name: 'is_open', default: false })
  isOpen: boolean;

  @Column({ type: 'varchar', default: RestaurantStatus.PENDING_APPROVAL })
  status: RestaurantStatus;

  @Column({ type: 'text', nullable: true })
  categories: string[];

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ name: 'estimated_delivery_minutes', default: 30 })
  estimatedDeliveryMinutes: number;

  @Column({ name: 'min_order_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrderAmount: number;

  @OneToMany(() => MenuItemEntity, (item) => item.restaurant)
  menuItems: MenuItemEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


