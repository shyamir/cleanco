import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  message?: string;
}

@Injectable()
export class MsgOwlService {
  private readonly logger = new Logger(MsgOwlService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly senderId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('msgOwl.apiKey') || '';
    this.senderId = this.configService.get<string>('msgOwl.senderId') || '';

    const baseURL = this.configService.get<string>('msgOwl.baseUrl') || '';

    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `AccessKey ${this.apiKey}`,
      },
      timeout: 10000,
    });

    this.logger.log('MsgOwl service initialized');
  }

  /**
   * Send OTP to phone number via Message Owl API
   * @param phoneNumber Phone number with country code (e.g., +9607777777)
   * @returns SendOtpResponse
   */
  async sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    try {
      this.logger.log(`Sending OTP to ${phoneNumber}`);

      // Remove '+' and '960' country code as Message Owl expects just the number
      const cleanNumber = phoneNumber.replace('+960', '');

      const response = await this.axiosInstance.post('/send', {
        phone_number: cleanNumber,
        code_length: 4,
      });

      this.logger.log(`OTP sent successfully to ${phoneNumber}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        data: response.data,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send OTP to ${phoneNumber}:`,
        error.response?.data || error.message,
      );

      throw new HttpException(
        {
          success: false,
          message: error.response?.data?.message || 'Failed to send OTP',
          error: error.response?.data,
        },
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verify OTP code for phone number
   * @param phoneNumber Phone number with country code
   * @param code OTP code to verify
   * @returns VerifyOtpResponse
   */
  async verifyOtp(
    phoneNumber: string,
    code: string,
  ): Promise<VerifyOtpResponse> {
    try {
      this.logger.log(`Verifying OTP for ${phoneNumber}`);

      // Remove '+' and '960' country code as Message Owl expects just the number
      const cleanNumber = phoneNumber.replace('+960', '');

      const response = await this.axiosInstance.post('/verify', {
        phone_number: cleanNumber,
        code: code,
      });

      // Log the full response for debugging
      this.logger.debug(`Message Owl verify response: ${JSON.stringify(response.data)}`);

      // Message Owl returns 'status' field, not 'verified'
      const isVerified = response.data?.status === true;

      this.logger.log(
        `OTP verification ${isVerified ? 'successful' : 'failed'} for ${phoneNumber}`,
      );

      return {
        success: true,
        verified: isVerified,
        message: isVerified
          ? 'OTP verified successfully'
          : 'Invalid or expired OTP',
      };
    } catch (error) {
      this.logger.error(
        `Failed to verify OTP for ${phoneNumber}:`,
        error.response?.data || error.message,
      );

      // Return verification failed instead of throwing error
      // This allows the controller to handle invalid OTP gracefully
      if (error.response?.status === 400 || error.response?.status === 404) {
        return {
          success: true,
          verified: false,
          message: 'Invalid or expired OTP',
        };
      }

      throw new HttpException(
        {
          success: false,
          message:
            error.response?.data?.message || 'Failed to verify OTP',
          error: error.response?.data,
        },
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * For testing: Mock OTP sending (development and test only)
   */
  async sendOtpMock(phoneNumber: string): Promise<SendOtpResponse> {
    const env = this.configService.get('env');
    if (env === 'production') {
      throw new HttpException(
        'Mock OTP not available in production',
        HttpStatus.FORBIDDEN,
      );
    }

    this.logger.warn(`[MOCK] OTP sent to ${phoneNumber}: 1234`);

    return {
      success: true,
      message: 'Mock OTP sent (development/test only)',
      data: { code: '1234' },
    };
  }

  /**
   * For testing: Mock OTP verification (development and test only)
   */
  async verifyOtpMock(
    phoneNumber: string,
    code: string,
  ): Promise<VerifyOtpResponse> {
    const env = this.configService.get('env');
    if (env === 'production') {
      throw new HttpException(
        'Mock OTP not available in production',
        HttpStatus.FORBIDDEN,
      );
    }

    const isValid = code === '1234';

    this.logger.warn(
      `[MOCK] OTP verification for ${phoneNumber}: ${isValid ? 'SUCCESS' : 'FAILED'}`,
    );

    return {
      success: true,
      verified: isValid,
      message: isValid
        ? 'Mock OTP verified successfully'
        : 'Invalid mock OTP',
    };
  }
}
