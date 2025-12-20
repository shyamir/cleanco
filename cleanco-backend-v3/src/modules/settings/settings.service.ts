import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// Default settings keys
export const SETTINGS_KEYS = {
  SUPPORT_PHONE: 'support_phone',
  SUPPORT_WHATSAPP: 'support_whatsapp',
} as const;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a setting value by key
   */
  async get(key: string): Promise<string | null> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });
    return config?.value || null;
  }

  /**
   * Set a setting value
   */
  async set(key: string, value: string): Promise<void> {
    await this.prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  /**
   * Get support contact information
   */
  async getSupportContacts(): Promise<{
    phone: string | null;
    whatsapp: string | null;
  }> {
    const [phone, whatsapp] = await Promise.all([
      this.get(SETTINGS_KEYS.SUPPORT_PHONE),
      this.get(SETTINGS_KEYS.SUPPORT_WHATSAPP),
    ]);

    return { phone, whatsapp };
  }

  /**
   * Update support contact information (admin only)
   */
  async updateSupportContacts(phone: string, whatsapp: string): Promise<void> {
    await Promise.all([
      this.set(SETTINGS_KEYS.SUPPORT_PHONE, phone),
      this.set(SETTINGS_KEYS.SUPPORT_WHATSAPP, whatsapp),
    ]);
  }
}
