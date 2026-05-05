import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { RestaurantEntity } from './entities/restaurant.entity';
import {
  CreateRestaurantDto, UpdateRestaurantDto,
  ApproveRestaurantDto, RestaurantQueryDto,
} from './dto/restaurant.dto';
import { RestaurantStatus, UserRole } from '@delidrone/common';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(RestaurantEntity)
    private readonly repo: Repository<RestaurantEntity>,
  ) {}

  async findAll(query: RestaurantQueryDto) {
    const { search, category, page = 1, limit = 20 } = query;

    const qb = this.repo.createQueryBuilder('r')
      .where('r.status = :status', { status: RestaurantStatus.ACTIVE });

    if (search) {
      qb.andWhere('(r.name ILIKE :search OR r.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (category) {
      qb.andWhere(':category = ANY(r.categories)', { category });
    }

    // Geo filter — uses Haversine via raw SQL
    if (query.lat && query.lng && query.radiusKm) {
      qb.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(r.latitude)))) <= :radius`,
        { lat: query.lat, lng: query.lng, radius: query.radiusKm },
      );
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('r.rating', 'DESC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<RestaurantEntity> {
    const r = await this.repo.findOne({
      where: { id },
      relations: ['menuItems'],
    });
    if (!r) throw new NotFoundException('Restaurant not found');
    return r;
  }

  async create(ownerId: string, dto: CreateRestaurantDto): Promise<RestaurantEntity> {
    const r = this.repo.create({ ...dto, ownerId, status: RestaurantStatus.PENDING_APPROVAL });
    return this.repo.save(r);
  }

  async update(id: string, requesterId: string, role: UserRole, dto: UpdateRestaurantDto): Promise<RestaurantEntity> {
    const r = await this.findOne(id);
    if (role !== UserRole.ADMIN && r.ownerId !== requesterId) throw new ForbiddenException();
    Object.assign(r, dto);
    return this.repo.save(r);
  }

  async toggleAvailability(id: string, ownerId: string, isOpen: boolean): Promise<RestaurantEntity> {
    const r = await this.findOne(id);
    if (r.ownerId !== ownerId) throw new ForbiddenException();
    r.isOpen = isOpen;
    return this.repo.save(r);
  }

  async approve(id: string, dto: ApproveRestaurantDto): Promise<RestaurantEntity> {
    const r = await this.findOne(id);
    r.status = dto.status;
    if (dto.status === RestaurantStatus.ACTIVE) r.isOpen = true;
    return this.repo.save(r);
  }

  async remove(id: string, requesterId: string, role: UserRole): Promise<void> {
    const r = await this.findOne(id);
    if (role !== UserRole.ADMIN && r.ownerId !== requesterId) throw new ForbiddenException();
    await this.repo.remove(r);
  }

  async incrementOrderCount(id: string): Promise<void> {
    await this.repo.increment({ id }, 'totalOrders', 1);
  }

  async updateRating(id: string, newRating: number): Promise<void> {
    await this.repo.update(id, { rating: newRating });
  }

  async findAllAdmin() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async getDashboard(ownerId: string) {
    const restaurants = await this.repo.find({ where: { ownerId } });
    return {
      totalRestaurants: restaurants.length,
      activeRestaurants: restaurants.filter(r => r.status === RestaurantStatus.ACTIVE).length,
      totalOrders: restaurants.reduce((sum, r) => sum + r.totalOrders, 0),
      restaurants,
    };
  }
}
