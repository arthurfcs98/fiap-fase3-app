import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VehicleService } from '../../application/services/vehicle.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
  PaginatedVehicleResponseDto,
} from '../../application/dto';
import { PaginationDto } from '@/shared/application/dto';

@ApiTags('Vehicles')
@ApiBearerAuth('JWT-auth')
@Controller('admin/vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle created successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Vehicle already exists' })
  async create(
    @Body() createVehicleDto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.vehicleService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all vehicles' })
  @ApiResponse({
    status: 200,
    description: 'List of vehicles',
    type: PaginatedVehicleResponseDto,
  })
  async findAll(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedVehicleResponseDto> {
    return this.vehicleService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle found',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VehicleResponseDto> {
    return this.vehicleService.findById(id);
  }

  @Get('plate/:licensePlate')
  @ApiOperation({ summary: 'Get vehicle by license plate' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle found',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async findByLicensePlate(
    @Param('licensePlate') licensePlate: string,
  ): Promise<VehicleResponseDto> {
    return this.vehicleService.findByLicensePlate(licensePlate);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get vehicles by customer ID' })
  @ApiResponse({
    status: 200,
    description: 'List of customer vehicles',
    type: [VehicleResponseDto],
  })
  async findByCustomerId(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ): Promise<VehicleResponseDto[]> {
    return this.vehicleService.findByCustomerId(customerId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle updated successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 409, description: 'License plate already in use' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.vehicleService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete vehicle (soft delete)' })
  @ApiResponse({ status: 204, description: 'Vehicle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.vehicleService.delete(id);
  }
}
