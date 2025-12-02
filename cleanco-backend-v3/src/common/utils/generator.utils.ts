import { customAlphabet } from 'nanoid';

export class GeneratorUtils {
  /**
   * Generate a unique booking number
   * Format: BK-YYYYMMDD-XXXXX
   */
  static generateBookingNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5);
    const uniqueId = nanoid();

    return `BK-${year}${month}${day}-${uniqueId}`;
  }

  /**
   * Generate a random OTP code
   */
  static generateOTP(length: number = 6): string {
    const nanoid = customAlphabet('0123456789', length);
    return nanoid();
  }

  /**
   * Generate a random string
   */
  static generateRandomString(length: number = 32): string {
    const nanoid = customAlphabet(
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      length,
    );
    return nanoid();
  }

  /**
   * Generate a slug from text
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
