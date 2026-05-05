import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly services: Record<string, string>;

  constructor(private readonly config: ConfigService) {
    this.services = {
      auth:          config.get('AUTH_SERVICE_URL',          'http://localhost:3001'),
      users:         config.get('USER_SERVICE_URL',          'http://localhost:3002'),
      restaurants:   config.get('RESTAURANT_SERVICE_URL',    'http://localhost:3003'),
      orders:        config.get('ORDER_SERVICE_URL',         'http://localhost:3004'),
      drones:        config.get('DRONE_SERVICE_URL',         'http://localhost:3005'),
      payments:      config.get('PAYMENT_SERVICE_URL',       'http://localhost:3006'),
      notifications: config.get('NOTIFICATION_SERVICE_URL',  'http://localhost:3007'),
      analytics:     config.get('ANALYTICS_SERVICE_URL',     'http://localhost:3008'),
    };
  }

  @Get()
  @ApiOperation({ summary: 'API Gateway health' })
  gateway() {
    return { status: 'ok', service: 'api-gateway', timestamp: new Date() };
  }

  @Get('services')
  @ApiOperation({ summary: 'Check health of all upstream services' })
  async services_health() {
    const checks = await Promise.all(
      Object.entries(this.services).map(async ([name, url]) => {
        try {
          await axios.get(`${url}/api/v1/health`, { timeout: 3000 });
          return { service: name, status: 'up' };
        } catch {
          return { service: name, status: 'down' };
        }
      }),
    );

    const allUp = checks.every(c => c.status === 'up');
    return { overall: allUp ? 'healthy' : 'degraded', services: checks };
  }
}
