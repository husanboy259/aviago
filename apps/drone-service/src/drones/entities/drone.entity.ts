import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { DroneStatus } from '@delidrone/common';

@Entity('drones')
export class DroneEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'serial_number', unique: true })
  serialNumber: string;

  @Column({ length: 100 })
  model: string;

  @Column({ name: 'operator_id', nullable: true })
  operatorId?: string;

  @Column({ type: 'varchar', default: DroneStatus.OFFLINE })
  status: DroneStatus;

  @Column({ name: 'battery_percent', type: 'decimal', precision: 5, scale: 2, default: 100 })
  batteryPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  altitude?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  speed?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  heading?: number;

  @Column({ name: 'max_payload_grams' })
  maxPayloadGrams: number;

  @Column({ name: 'max_range_km', type: 'decimal', precision: 6, scale: 2 })
  maxRangeKm: number;

  @Column({ name: 'current_order_id', nullable: true })
  currentOrderId?: string;

  @Column({ name: 'last_seen_at', nullable: true })
  lastSeenAt?: Date;

  @Column({ name: 'home_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  homeLatitude?: number;

  @Column({ name: 'home_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  homeLongitude?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

