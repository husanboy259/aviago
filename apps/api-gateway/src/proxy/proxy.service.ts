import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { Request } from 'express';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  private readonly serviceMap: Record<string, string>;

  constructor(private readonly config: ConfigService) {
    this.serviceMap = {
      auth:         config.get('AUTH_SERVICE_URL',         'http://localhost:3001'),
      users:        config.get('USER_SERVICE_URL',         'http://localhost:3002'),
      restaurants:  config.get('RESTAURANT_SERVICE_URL',   'http://localhost:3003'),
      orders:       config.get('ORDER_SERVICE_URL',        'http://localhost:3004'),
      drones:       config.get('DRONE_SERVICE_URL',        'http://localhost:3005'),
      payments:     config.get('PAYMENT_SERVICE_URL',      'http://localhost:3006'),
      notifications:config.get('NOTIFICATION_SERVICE_URL', 'http://localhost:3007'),
      analytics:    config.get('ANALYTICS_SERVICE_URL',    'http://localhost:3008'),
    };
  }

  async forward(service: string, req: Request, overridePath?: string): Promise<unknown> {
    const baseUrl = this.serviceMap[service];
    if (!baseUrl) throw new BadGatewayException(`Unknown service: ${service}`);

    const path = overridePath || req.url;
    const url = `${baseUrl}${path}`;

    const headers: Record<string, string> = {
      'content-type': req.headers['content-type'] || 'application/json',
      'x-forwarded-for': req.ip,
      'x-gateway-request': '1',
    };

    if (req.headers.authorization) {
      headers['authorization'] = req.headers.authorization;
    }

    // Pass decoded user identity downstream without re-validating JWT in each service
    if ((req as any).user) {
      headers['x-user-id']   = (req as any).user.id;
      headers['x-user-role'] = (req as any).user.role;
      headers['x-user-phone']= (req as any).user.phone;
    }

    const axiosConfig: AxiosRequestConfig = {
      method: req.method as Method,
      url,
      headers,
      data: req.body,
      params: req.query,
      timeout: 30_000,
      validateStatus: () => true,
    };

    try {
      const { data, status } = await axios(axiosConfig);

      if (status >= 500) {
        this.logger.error(`Service ${service} returned ${status} for ${req.method} ${path}`);
      }

      return { status, data };
    } catch (err) {
      this.logger.error(`Proxy error to ${service}: ${err.message}`);
      throw new BadGatewayException(`Upstream service unavailable: ${service}`);
    }
  }
}
