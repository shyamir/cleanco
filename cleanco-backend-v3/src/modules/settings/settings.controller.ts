import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('support-contacts')
  @ApiOperation({ summary: 'Get customer support contact information' })
  @ApiResponse({
    status: 200,
    description: 'Support contact information',
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '+960XXXXXXX' },
        whatsapp: { type: 'string', example: '+960XXXXXXX' },
      },
    },
  })
  async getSupportContacts() {
    return this.settingsService.getSupportContacts();
  }
}
