import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DroneEntity } from './entities/drone.entity';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { CreateDroneDto, UpdateDroneLocationDto, UpdateDroneStatusDto, AssignRouteDto } from '@delidrone/common';
import { DroneStatus } from '@delidrone/common';

@Injectable()
export class DronesService {
  private readonly logger = new Logger(DronesService.name);

  constructor(
    @InjectRepository(DroneEntity)
    private readonly droneRepo: Repository<DroneEntity>,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async findAll(status?: DroneStatus): Promise<DroneEntity[]> {
    const where = status ? { status } : {};
    return this.droneRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<DroneEntity> {
    const drone = await this.droneRepo.findOne({ where: { id } });
    if (!drone) throw new NotFoundException('Drone not found');
    return drone;
  }

  async findAvailable(): Promise<DroneEntity[]> {
    return this.droneRepo.find({ where: { status: DroneStatus.IDLE } });
  }

  async create(dto: CreateDroneDto): Promise<DroneEntity> {
    const drone = this.droneRepo.create(dto);
    return this.droneRepo.save(drone);
  }

  async updateLocation(id: string, dto: UpdateDroneLocationDto): Promise<DroneEntity> {
    const drone = await this.findOne(id);

    await this.droneRepo.update(id, {
      latitude: dto.latitude,
      longitude: dto.longitude,
      altitude: dto.altitude,
      speed: dto.speed,
      heading: dto.heading,
      batteryPercent: dto.batteryPercent,
      lastSeenAt: new Date(),
    });

    const updated = await this.findOne(id);

    // Broadcast real-time location to all subscribers
    this.trackingGateway.broadcastDroneLocation({
      droneId: id,
      latitude: dto.latitude,
      longitude: dto.longitude,
      altitude: dto.altitude,
      speed: dto.speed,
      heading: dto.heading,
      batteryPercent: dto.batteryPercent,
      timestamp: new Date(),
    });

    // Auto low-battery alert
    if (dto.batteryPercent < 20 && drone.status === DroneStatus.BUSY) {
      this.logger.warn(`Drone ${id} battery critical: ${dto.batteryPercent}%`);
      this.trackingGateway.broadcastBatteryAlert(id, dto.batteryPercent);
    }

    return updated;
  }

  async updateStatus(id: string, dto: UpdateDroneStatusDto): Promise<DroneEntity> {
    await this.findOne(id);
    await this.droneRepo.update(id, { status: dto.status });
    return this.findOne(id);
  }

  async assignRoute(id: string, dto: AssignRouteDto): Promise<DroneEntity> {
    const drone = await this.findOne(id);

    if (drone.status !== DroneStatus.IDLE) {
      throw new BadRequestException('Drone is not available');
    }

    await this.droneRepo.update(id, {
      status: DroneStatus.BUSY,
      currentOrderId: dto.orderId,
    });

    const updated = await this.findOne(id);
    this.trackingGateway.broadcastDroneStatus(updated);
    return updated;
  }

  async completeDelivery(id: string): Promise<DroneEntity> {
    const drone = await this.findOne(id);

    await this.droneRepo.update(id, {
      status: DroneStatus.IDLE,
      currentOrderId: null,
    });

    const updated = await this.findOne(id);
    this.trackingGateway.broadcastDroneStatus(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const drone = await this.findOne(id);
    if (drone.status === DroneStatus.BUSY) {
      throw new BadRequestException('Cannot delete a drone with an active delivery');
    }
    await this.droneRepo.remove(drone);
  }

  // Delivery engine: find nearest idle drone to an origin point
  async findNearestAvailable(originLat: number, originLng: number): Promise<DroneEntity | null> {
    const drones = await this.findAvailable();
    if (!drones.length) return null;

    return drones.reduce((nearest, drone) => {
      if (!drone.latitude || !drone.longitude) return nearest;
      const dist = this.haversineKm(originLat, originLng, +drone.latitude, +drone.longitude);
      const nearestDist = nearest && nearest.latitude
        ? this.haversineKm(originLat, originLng, +nearest.latitude, +nearest.longitude)
        : Infinity;
      return dist < nearestDist ? drone : nearest;
    }, null as DroneEntity | null);
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
