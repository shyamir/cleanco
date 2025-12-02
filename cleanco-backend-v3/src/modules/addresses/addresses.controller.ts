import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('addresses')
@ApiBearerAuth()
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: any,
    @Body() createDto: CreateAddressDto,
  ) {
    return this.addressesService.create(user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all addresses for current user' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: any) {
    return this.addressesService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your address' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.addressesService.findOne(id, user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your address' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(id, user.userId, updateDto);
  }

  @Put(':id/primary')
  @ApiOperation({ summary: 'Set address as primary (default)' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address set as primary successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your address' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setPrimary(@Param('id') id: string, @CurrentUser() user: any) {
    return this.addressesService.setPrimary(id, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your address' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.addressesService.remove(id, user.userId);
  }
}
