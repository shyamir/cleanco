import { PartialType } from '@nestjs/swagger';
import { CreateHomePricingRuleDto } from './create-home-pricing-rule.dto';

export class UpdateHomePricingRuleDto extends PartialType(CreateHomePricingRuleDto) {}
