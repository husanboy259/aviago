import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@delidrone/common';
import { CreateOrderDto, UpdateOrderStatusDto, AssignDroneDto, PaginationDto } from '@delidrone/common';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Place a new order' })
  create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.svc.create(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my order history' })
  myOrders(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.svc.findByCustomer(user.id, pagination.page, pagination.limit);
  }

  @Get('restaurant/:restaurantId')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get orders for a restaurant' })
  restaurantOrders(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
  ) {
    return this.svc.findByRestaurant(restaurantId, user.id, pagination.page, pagination.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.svc.updateStatus(id, user.id, user.role, dto);
  }

  @Patch(':id/assign-drone')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '[Operator] Assign drone to order' })
  assignDrone(@Param('id') id: string, @Body() dto: AssignDroneDto) {
    return this.svc.assignDrone(id, dto);
  }
}
