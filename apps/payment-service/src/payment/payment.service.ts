import {
  Injectable, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { PaymentStatus, PaymentMethod } from '@delidrone/common';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(TransactionEntity)
    private readonly txRepo: Repository<TransactionEntity>,
    private readonly config: ConfigService,
  ) {}

  async initiatePayment(
    orderId: string,
    userId: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<{ transactionId: string; paymentUrl?: string; invoiceId?: string }> {
    const tx = await this.txRepo.save(
      this.txRepo.create({ orderId, userId, amount, method, status: PaymentStatus.PENDING }),
    );

    switch (method) {
      case PaymentMethod.PAYME:
        return this.initiatePayme(tx, amount);
      case PaymentMethod.CLICK:
        return this.initiateClick(tx, amount);
      case PaymentMethod.UZCARD:
      case PaymentMethod.HUMO:
        return this.initiateUzcard(tx, amount, method);
      case PaymentMethod.CASH:
        await this.txRepo.update(tx.id, { status: PaymentStatus.PAID });
        return { transactionId: tx.id };
      default:
        throw new BadRequestException('Unsupported payment method');
    }
  }

  async handlePaymeCallback(data: Record<string, unknown>): Promise<unknown> {
    const method = (data.method as string) || '';
    this.logger.log(`Payme callback: ${method}`);

    // Payme JSON-RPC 2.0 interface
    if (method === 'CheckPerformTransaction') {
      return { result: { allow: true } };
    }

    if (method === 'CreateTransaction') {
      const params = data.params as any;
      const tx = await this.txRepo.findOne({ where: { id: params?.account?.transaction_id } });
      if (!tx) return { error: { code: -31050, message: 'Transaction not found' } };

      await this.txRepo.update(tx.id, { externalId: params.id, status: PaymentStatus.PENDING });
      return { result: { create_time: Date.now(), transaction: params.id, state: 1 } };
    }

    if (method === 'PerformTransaction') {
      const params = data.params as any;
      const tx = await this.txRepo.findOne({ where: { externalId: params?.id } });
      if (!tx) return { error: { code: -31003, message: 'Transaction not found' } };

      await this.txRepo.update(tx.id, {
        status: PaymentStatus.PAID,
        externalTransactionId: params.id,
      });

      return { result: { transaction: params.id, perform_time: Date.now(), state: 2 } };
    }

    if (method === 'CancelTransaction') {
      const params = data.params as any;
      const tx = await this.txRepo.findOne({ where: { externalId: params?.id } });
      if (tx) await this.txRepo.update(tx.id, { status: PaymentStatus.FAILED });
      return { result: { transaction: params?.id, cancel_time: Date.now(), state: -1 } };
    }

    return { result: {} };
  }

  async handleClickCallback(data: Record<string, unknown>): Promise<unknown> {
    this.logger.log(`Click callback received`);

    const txId = data.merchant_trans_id as string;
    const tx = await this.txRepo.findOne({ where: { id: txId } });
    if (!tx) return { error: -5, error_note: 'Transaction not found' };

    if (data.error === 0) {
      await this.txRepo.update(tx.id, {
        status: PaymentStatus.PAID,
        externalTransactionId: String(data.click_trans_id),
      });
    } else {
      await this.txRepo.update(tx.id, {
        status: PaymentStatus.FAILED,
        failureReason: String(data.error_note),
      });
    }

    return { click_trans_id: data.click_trans_id, merchant_trans_id: txId, error: 0 };
  }

  async refund(transactionId: string): Promise<TransactionEntity> {
    const tx = await this.txRepo.findOne({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status !== PaymentStatus.PAID) throw new BadRequestException('Only paid transactions can be refunded');

    await this.txRepo.update(tx.id, { status: PaymentStatus.REFUNDED, refundedAt: new Date() });
    return this.txRepo.findOne({ where: { id: transactionId } });
  }

  async getTransactionsByOrder(orderId: string): Promise<TransactionEntity[]> {
    return this.txRepo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
  }

  private async initiatePayme(tx: TransactionEntity, amount: number) {
    const merchantId = this.config.get('PAYME_MERCHANT_ID', 'DEMO');
    const amountInTiyin = Math.round(amount * 100);
    const params = Buffer.from(
      JSON.stringify({ m: merchantId, ac: { transaction_id: tx.id }, a: amountInTiyin }),
    ).toString('base64');

    return {
      transactionId: tx.id,
      paymentUrl: `https://checkout.paycom.uz/${params}`,
    };
  }

  private async initiateClick(tx: TransactionEntity, amount: number) {
    const merchantId = this.config.get('CLICK_MERCHANT_ID', 'DEMO');
    const serviceId = this.config.get('CLICK_SERVICE_ID', '0');

    return {
      transactionId: tx.id,
      paymentUrl: `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${tx.id}&return_url=delidrone://payment/result`,
    };
  }

  private async initiateUzcard(tx: TransactionEntity, amount: number, method: PaymentMethod) {
    // Uzcard/Humo integration — returns invoice ID for in-app card entry
    const invoiceId = `${method.toUpperCase()}-${tx.id.slice(0, 8).toUpperCase()}`;
    await this.txRepo.update(tx.id, { externalId: invoiceId });
    return { transactionId: tx.id, invoiceId };
  }
}
