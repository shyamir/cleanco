import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all active zones' })
  @ApiResponse({ status: 200, description: 'Zones retrieved successfully' })
  async findAll() {
    return this.zonesService.findAll();
  }
}
