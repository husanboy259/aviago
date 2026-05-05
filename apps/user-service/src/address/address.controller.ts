import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @ApiOperation({ summary: 'List all addresses of current user' })
  findAll(@CurrentUser() user: UserEntity) {
    return this.addressService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single address' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.addressService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new address' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateAddressDto) {
    return this.addressService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update address' })
  update(@Param('id') id: string, @CurrentUser() user: UserEntity, @Body() dto: UpdateAddressDto) {
    return this.addressService.update(id, user.id, dto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set address as default' })
  setDefault(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.addressService.setDefault(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete address' })
  remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.addressService.remove(id, user.id);
  }
}
