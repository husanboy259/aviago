import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@delidrone/common';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.RESTAURANT)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '[Admin] Full dashboard summary' })
  dashboard() {
    return this.svc.getDashboardSummary();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue metrics' })
  @ApiQuery({ name: 'restaurantId', required: false })
  revenue(@Query('restaurantId') restaurantId?: string) {
    return this.svc.getRevenueMetrics(restaurantId);
  }

  @Get('delivery')
  @ApiOperation({ summary: 'Delivery performance metrics' })
  delivery() {
    return this.svc.getDeliveryMetrics();
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] User metrics' })
  users() {
    return this.svc.getUserMetrics();
  }

  @Get('trend')
  @ApiOperation({ summary: 'Order trend over N days' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  trend(@Query('days') days?: number) {
    return this.svc.getOrderTrend(Number(days) || 30);
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Delivery demand heatmap points' })
  @ApiQuery({ name: 'type', required: false, enum: ['orders', 'deliveries'] })
  heatmap(@Query('type') type?: 'orders' | 'deliveries') {
    return this.svc.getHeatmap(type);
  }

  @Get('top-restaurants')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Top restaurants by orders' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  topRestaurants(@Query('limit') limit?: number) {
    return this.svc.getTopRestaurants(Number(limit) || 10);
  }
}
