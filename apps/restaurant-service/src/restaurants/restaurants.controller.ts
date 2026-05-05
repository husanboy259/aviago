import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@delidrone/common';
import {
  CreateRestaurantDto, UpdateRestaurantDto,
  UpdateAvailabilityDto, ApproveRestaurantDto, RestaurantQueryDto,
} from './dto/restaurant.dto';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly svc: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'Browse all active restaurants' })
  findAll(@Query() query: RestaurantQueryDto) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get restaurant with menu' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create restaurant (restaurant owner)' })
  create(@CurrentUser() user: any, @Body() dto: CreateRestaurantDto) {
    return this.svc.create(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update restaurant' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateRestaurantDto) {
    return this.svc.update(id, user.id, user.role, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @Patch(':id/availability')
  @ApiOperation({ summary: 'Toggle open/closed status' })
  toggleAvailability(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.svc.toggleAvailability(id, user.id, dto.isOpen);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/approve')
  @ApiOperation({ summary: '[Admin] Approve or suspend restaurant' })
  approve(@Param('id') id: string, @Body() dto: ApproveRestaurantDto) {
    return this.svc.approve(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete restaurant' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.remove(id, user.id, user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/all')
  @ApiOperation({ summary: '[Admin] List all restaurants regardless of status' })
  findAllAdmin() {
    return this.svc.findAllAdmin();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @Get('my/dashboard')
  @ApiOperation({ summary: 'Restaurant owner dashboard' })
  dashboard(@CurrentUser() user: any) {
    return this.svc.getDashboard(user.id);
  }
}
