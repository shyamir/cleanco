import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PromoCodesService } from './promo-codes.service';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Promo Codes')
@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get active public promotional codes for carousel display' })
  @ApiResponse({
    status: 200,
    description: 'List of active public promo codes',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          code: { type: 'string' },
          discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_AMOUNT'] },
          discountValue: { type: 'number' },
          applicableServices: { type: 'array', items: { type: 'string', enum: ['HOME', 'OFFICE'] } },
          minPurchaseAmount: { type: 'number', nullable: true },
        },
      },
    },
  })
  getActivePromos() {
    return this.promoCodesService.getActivePublicPromos();
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a promo code for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Promo code validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        discount: { type: 'number', description: 'Calculated discount amount in MVR' },
        discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_AMOUNT'] },
        discountValue: { type: 'number', description: 'Raw discount value (e.g., 30 for 30%)' },
        message: { type: 'string', nullable: true, description: 'Error message if invalid' },
      },
    },
  })
  validatePromo(@CurrentUser() user: CurrentUserPayload, @Body() validateDto: ValidatePromoDto) {
    return this.promoCodesService.validatePromoForUser(user.userId, validateDto);
  }
}
