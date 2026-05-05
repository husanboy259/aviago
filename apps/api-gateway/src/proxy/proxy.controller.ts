import {
  Controller, All, Req, Res, Param, UseGuards,
  HttpCode, Next,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

@ApiTags('Proxy')
@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @All('auth/*')
  @ApiExcludeEndpoint()
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    const { status, data } = await this.proxy.forward('auth', req) as any;
    res.status(status).json(data);
  }

  @All('users/*')
  @UseGuards(OptionalJwtGuard)
  @ApiExcludeEndpoint()
  async proxyUsers(@Req() req: Request, @Res() res: Response) {
    const { status, data } = await this.proxy.forward('users', req) as any;
    res.status(status).json(data);
  }

  @All('addresses/*')
  @UseGuards(OptionalJwtGuard)
  @ApiExcludeEndpoint()
  async proxyAddresses(@Req() req: Request, @Res() res: Response) {
    const { status, data } = await this.proxy.forward('users', req) as any;
    res.status(status).json(data);
  }

  @All('restaurants/*')
  @UseGuards(OptionalJwtGuard)
  @ApiExcludeEndpoint()
  async proxyRestaurants(@Req() req: Request, @Res() res: Response) {
    const { status, data } = await this.proxy.forward('restaurants', req) as any;
    res.status(status).json(data);
  }

  @All('orders/*')
  @UseGuards(OptionalJwtGuard)
  @ApiExcludeEndpoint()
  async proxyOrders(@Req() req: Request, @Res() res: Response) {
    const { status, data } = await this.proxy.forward('orders', req) as any;
    res.status(status).json(data);
  }

  @All('drones/*')
  @UseGuards(OptionalJwtGuard)
  @ApiExcludeEndpoint()
  async proxyDrones(@Req() req: Request, @Res() res: Response) {
    const { status, data } = await this.proxy.forward('drones', req) as any;
    res.status(status).json(data);
  }

  @All('payments/*')
  @UseGuards(OptionalJwtGuard)
  @ApiExcludeEndpoint()
  async proxyPayments(@Req() req: Request, @Res() res: Response) {
    const { status, data } = await this.proxy.forward('payments', req) as any;
    res.status(status).json(data);
  }

  @All('analytics/*')
  @UseGuards(OptionalJwtGuard)
  @ApiExcludeEndpoint()
  async proxyAnalytics(@Req() req: Request, @Res() res: Response) {
    const { status, data } = await this.proxy.forward('analytics', req) as any;
    res.status(status).json(data);
  }
}
