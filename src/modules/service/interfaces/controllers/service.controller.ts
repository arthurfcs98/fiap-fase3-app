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
import { ServiceService } from '../../application/services/service.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponseDto,
  PaginatedServiceResponseDto,
} from '../../application/dto';
import { PaginationDto } from '@/shared/application/dto';

@ApiTags('Services')
@ApiBearerAuth('JWT-auth')
@Controller('admin/services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Service code already exists' })
  async create(
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.serviceService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all services' })
  @ApiResponse({
    status: 200,
    description: 'List of services',
    type: PaginatedServiceResponseDto,
  })
  async findAll(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedServiceResponseDto> {
    return this.serviceService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service found',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceResponseDto> {
    return this.serviceService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 409, description: 'Service code already in use' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete service (soft delete)' })
  @ApiResponse({ status: 204, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.serviceService.delete(id);
  }
}
