import {
  Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { PaymentMethod } from '@delidrone/common';

class InitiatePaymentDto {
  @IsString() orderId: string;
  @IsNumber() @Min(0) amount: number;
  @IsEnum(PaymentMethod) method: PaymentMethod;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly svc: PaymentService) {}

  @Post('initiate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate payment for an order' })
  initiate(@Body() dto: InitiatePaymentDto) {
    // userId would normally come from @CurrentUser; simplified here
    return this.svc.initiatePayment(dto.orderId, 'user-id-from-gateway', dto.amount, dto.method);
  }

  @Post('payme/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payme JSON-RPC callback webhook' })
  paymeCallback(@Body() body: Record<string, unknown>) {
    return this.svc.handlePaymeCallback(body);
  }

  @Post('click/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Click callback webhook' })
  clickCallback(@Body() body: Record<string, unknown>) {
    return this.svc.handleClickCallback(body);
  }

  @Get('order/:orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get transactions for an order' })
  getByOrder(@Param('orderId') orderId: string) {
    return this.svc.getTransactionsByOrder(orderId);
  }

  @Post(':id/refund')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Refund a paid transaction' })
  refund(@Param('id') id: string) {
    return this.svc.refund(id);
  }
}
