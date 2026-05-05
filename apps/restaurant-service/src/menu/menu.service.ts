import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItemEntity } from './entities/menu-item.entity';
import { RestaurantEntity } from '../restaurants/entities/restaurant.entity';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import { UserRole } from '@delidrone/common';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItemEntity)
    private readonly itemRepo: Repository<MenuItemEntity>,
    @InjectRepository(RestaurantEntity)
    private readonly restaurantRepo: Repository<RestaurantEntity>,
  ) {}

  async findByRestaurant(restaurantId: string): Promise<Record<string, MenuItemEntity[]>> {
    const items = await this.itemRepo.find({
      where: { restaurantId },
      order: { category: 'ASC', sortOrder: 'ASC' },
    });

    // Group by category
    return items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, MenuItemEntity[]>);
  }

  async findOne(id: string): Promise<MenuItemEntity> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async create(restaurantId: string, ownerId: string, role: UserRole, dto: CreateMenuItemDto): Promise<MenuItemEntity> {
    await this.assertOwner(restaurantId, ownerId, role);
    const item = this.itemRepo.create({ ...dto, restaurantId });
    return this.itemRepo.save(item);
  }

  async update(id: string, ownerId: string, role: UserRole, dto: UpdateMenuItemDto): Promise<MenuItemEntity> {
    const item = await this.findOne(id);
    await this.assertOwner(item.restaurantId, ownerId, role);
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async toggleAvailability(id: string, ownerId: string, role: UserRole): Promise<MenuItemEntity> {
    const item = await this.findOne(id);
    await this.assertOwner(item.restaurantId, ownerId, role);
    item.isAvailable = !item.isAvailable;
    return this.itemRepo.save(item);
  }

  async remove(id: string, ownerId: string, role: UserRole): Promise<void> {
    const item = await this.findOne(id);
    await this.assertOwner(item.restaurantId, ownerId, role);
    await this.itemRepo.remove(item);
  }

  private async assertOwner(restaurantId: string, ownerId: string, role: UserRole): Promise<void> {
    if (role === UserRole.ADMIN) return;
    const r = await this.restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!r) throw new NotFoundException('Restaurant not found');
    if (r.ownerId !== ownerId) throw new ForbiddenException('Not your restaurant');
  }
}
