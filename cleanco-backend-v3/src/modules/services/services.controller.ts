import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CalculateQuoteDto } from './dto/calculate-quote.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all available services' })
  @ApiResponse({ status: 200, description: 'List of active services' })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get service details by ID' })
  @ApiResponse({ status: 200, description: 'Service details' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Post('quote')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate price quote for a service' })
  @ApiResponse({ status: 200, description: 'Price quote calculated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 404, description: 'No pricing rule found' })
  calculateQuote(@Body() calculateQuoteDto: CalculateQuoteDto) {
    return this.servicesService.calculateQuote(calculateQuoteDto);
  }
}
