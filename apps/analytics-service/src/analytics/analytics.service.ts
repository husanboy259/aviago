import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface RevenueMetrics {
  totalRevenue: number;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  avgOrderValue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  completionRate: number;
}

export interface DeliveryMetrics {
  avgDeliveryMinutes: number;
  onTimeRate: number;
  totalDeliveries: number;
  activeDrones: number;
  dronesOnDelivery: number;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  newUsersThisMonth: number;
  retentionRate: number;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
  label?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly config: ConfigService) {}

  async getRevenueMetrics(restaurantId?: string): Promise<RevenueMetrics> {
    try {
      const orderUrl = this.config.get('ORDER_SERVICE_URL', 'http://localhost:3004');
      // In production, this would call the order-service aggregation endpoint
      // For now, return a calculated stub demonstrating the data shape
      return {
        totalRevenue: 142_580_000,
        dailyRevenue: 4_320_000,
        weeklyRevenue: 28_750_000,
        monthlyRevenue: 112_400_000,
        avgOrderValue: 85_000,
        totalOrders: 1674,
        completedOrders: 1521,
        cancelledOrders: 153,
        completionRate: 90.9,
      };
    } catch (err) {
      this.logger.error(`Revenue metrics failed: ${err.message}`);
      throw err;
    }
  }

  async getDeliveryMetrics(): Promise<DeliveryMetrics> {
    return {
      avgDeliveryMinutes: 18.4,
      onTimeRate: 94.2,
      totalDeliveries: 1521,
      activeDrones: 12,
      dronesOnDelivery: 7,
    };
  }

  async getUserMetrics(): Promise<UserMetrics> {
    return {
      totalUsers: 8_432,
      activeUsersToday: 312,
      activeUsersWeek: 1_840,
      newUsersThisMonth: 643,
      retentionRate: 71.3,
    };
  }

  async getOrderTrend(days = 30): Promise<{ date: string; orders: number; revenue: number }[]> {
    const trend = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      trend.push({
        date: date.toISOString().split('T')[0],
        orders: Math.floor(40 + Math.random() * 80),
        revenue: Math.floor(3_000_000 + Math.random() * 4_000_000),
      });
    }

    return trend;
  }

  async getHeatmap(type: 'orders' | 'deliveries' = 'orders'): Promise<HeatmapPoint[]> {
    // Returns delivery demand hotspots — in production would aggregate from order addresses
    return [
      { latitude: 41.2995, longitude: 69.2401, weight: 95, label: 'Yunusabad' },
      { latitude: 41.3111, longitude: 69.2797, weight: 82, label: 'Chilonzor' },
      { latitude: 41.2765, longitude: 69.2003, weight: 74, label: 'Mirzo Ulugbek' },
      { latitude: 41.3264, longitude: 69.3119, weight: 68, label: 'Shaykhantaur' },
      { latitude: 41.2536, longitude: 69.2077, weight: 61, label: 'Sergeli' },
      { latitude: 41.3391, longitude: 69.3582, weight: 55, label: 'Olmazar' },
      { latitude: 41.2894, longitude: 69.1732, weight: 48, label: 'Uchtepa' },
      { latitude: 41.3523, longitude: 69.2876, weight: 42, label: 'Bektemir' },
    ];
  }

  async getTopRestaurants(limit = 10): Promise<{ restaurantId: string; name: string; orders: number; revenue: number }[]> {
    // In production, aggregate from order-service grouped by restaurantId
    const mockNames = ['Tandoor House', 'Sushi Master', 'Plov Republic', 'Burger Zone', 'Pizza Land', 'Manti King', 'Lagman Express', 'Shawarma City', 'Naryn Place', 'Somsa Corner'];
    return mockNames.slice(0, limit).map((name, i) => ({
      restaurantId: `rest-${i + 1}`,
      name,
      orders: Math.floor(300 - i * 25 + Math.random() * 30),
      revenue: Math.floor((300 - i * 25) * 87_000 + Math.random() * 1_000_000),
    }));
  }

  async getDashboardSummary() {
    const [revenue, delivery, users, trend, heatmap, topRestaurants] = await Promise.all([
      this.getRevenueMetrics(),
      this.getDeliveryMetrics(),
      this.getUserMetrics(),
      this.getOrderTrend(7),
      this.getHeatmap(),
      this.getTopRestaurants(5),
    ]);

    return { revenue, delivery, users, trend, heatmap, topRestaurants };
  }
}
