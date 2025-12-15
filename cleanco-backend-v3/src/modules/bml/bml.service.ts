import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  CreateBmlTransactionDto,
  BmlTransactionResponseDto,
  BmlTransactionState,
} from './dto/bml-transaction.dto';

export interface BmlCreateTransactionResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface BmlVerifySignatureResponse {
  valid: boolean;
  state?: BmlTransactionState;
}

@Injectable()
export class BmlService {
  private readonly logger = new Logger(BmlService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly redirectUrl: string;
  private readonly appDeepLink: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('bml.clientId') || '';
    this.apiKey = this.configService.get<string>('bml.apiKey') || '';
    this.baseUrl = this.configService.get<string>('bml.baseUrl') || '';
    this.redirectUrl = this.configService.get<string>('bml.redirectUrl') || '';
    this.appDeepLink = this.configService.get<string>('bml.appDeepLink') || 'cleanco://payment-callback';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': this.apiKey,
      },
      timeout: 30000,
    });

    this.logger.log('BML Connect service initialized');
  }

  /**
   * Generate SHA1 signature for BML transaction
   * Format: sha1('amount={amount}&currency={currency}&apiKey={apiKey}')
   */
  generateSignature(amount: number, currency: string): string {
    const signatureString = `amount=${amount}&currency=${currency}&apiKey=${this.apiKey}`;
    return crypto.createHash('sha1').update(signatureString).digest('hex');
  }

  /**
   * Verify callback signature from BML
   * The signature is calculated the same way as when creating the transaction
   */
  verifyCallbackSignature(
    transactionId: string,
    state: string,
    signature: string,
    amount: number,
    currency: string,
  ): BmlVerifySignatureResponse {
    const expectedSignature = this.generateSignature(amount, currency);
    const isValid = signature === expectedSignature;

    if (!isValid) {
      this.logger.warn(`Invalid signature for transaction ${transactionId}`);
    }

    return {
      valid: isValid,
      state: state as BmlTransactionState,
    };
  }

  /**
   * Create a new transaction with BML Connect
   */
  async createTransaction(
    dto: CreateBmlTransactionDto,
  ): Promise<BmlCreateTransactionResponse> {
    try {
      this.logger.log(`Creating BML transaction for localId: ${dto.localId}`);

      const signature = this.generateSignature(dto.amount, dto.currency);

      const requestBody = {
        amount: dto.amount,
        currency: dto.currency,
        signature,
        deviceId: this.clientId,
        appVersion: '1.0.0',
        apiVersion: '2.0',
        signMethod: 'sha1',
        provider: 'alipay', // Default provider - may need to be configurable
        redirectUrl: this.redirectUrl,
        localId: dto.localId,
        customerReference: dto.customerReference || `Payment #${dto.localId}`,
      };

      this.logger.debug(`BML request body: ${JSON.stringify(requestBody)}`);

      const response = await this.axiosInstance.post<BmlTransactionResponseDto>(
        '/transactions',
        requestBody,
      );

      this.logger.log(`BML transaction created: ${response.data.transactionId}`);

      return {
        success: true,
        transactionId: response.data.transactionId,
        paymentUrl: response.data.url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create BML transaction:`,
        error.response?.data || error.message,
      );

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create transaction',
      };
    }
  }

  /**
   * Get the deep link URL to redirect back to the app after payment
   */
  getAppRedirectUrl(
    status: 'success' | 'failed' | 'cancelled',
    paymentId: string,
    transactionId?: string,
  ): string {
    const params = new URLSearchParams({
      status,
      paymentId,
      ...(transactionId && { transactionId }),
    });

    return `${this.appDeepLink}?${params.toString()}`;
  }

  /**
   * Check if BML service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.apiKey && this.baseUrl && this.redirectUrl);
  }
}
