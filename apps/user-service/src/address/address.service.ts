import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressEntity } from './entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(AddressEntity)
    private readonly addressRepo: Repository<AddressEntity>,
  ) {}

  async findAll(userId: string): Promise<AddressEntity[]> {
    return this.addressRepo.find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'ASC' } });
  }

  async findOne(id: string, userId: string): Promise<AddressEntity> {
    const address = await this.addressRepo.findOne({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException();
    return address;
  }

  async create(userId: string, dto: CreateAddressDto): Promise<AddressEntity> {
    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }

    const address = this.addressRepo.create({ ...dto, userId });
    return this.addressRepo.save(address);
  }

  async update(id: string, userId: string, dto: UpdateAddressDto): Promise<AddressEntity> {
    const address = await this.findOne(id, userId);

    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }

    Object.assign(address, dto);
    return this.addressRepo.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);
    await this.addressRepo.remove(address);
  }

  async setDefault(id: string, userId: string): Promise<AddressEntity> {
    await this.addressRepo.update({ userId }, { isDefault: false });
    await this.addressRepo.update(id, { isDefault: true });
    return this.findOne(id, userId);
  }
}
