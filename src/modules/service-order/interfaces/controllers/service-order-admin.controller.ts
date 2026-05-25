import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServiceOrderService } from '../../application/services/service-order.service';
import {
  CreateServiceOrderDto,
  UpdateServiceOrderStatusDto,
  AddServiceOrderItemDto,
  AddServiceOrderPartDto,
  ServiceOrderResponseDto,
  PaginatedServiceOrderResponseDto,
  ServiceOrderMetricsResponseDto,
  GeneralMetricsResponseDto,
  ServiceOrderFilterDto,
} from '../../application/dto';

@ApiTags('Service Orders')
@ApiBearerAuth('JWT-auth')
@Controller('admin/service-orders')
export class ServiceOrderAdminController {
  constructor(private readonly serviceOrderService: ServiceOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service order' })
  @ApiResponse({
    status: 201,
    description: 'Service order created successfully',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Customer or vehicle not found' })
  async create(
    @Body() createDto: CreateServiceOrderDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrderService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all service orders' })
  @ApiResponse({
    status: 200,
    description: 'List of service orders',
    type: PaginatedServiceOrderResponseDto,
  })
  async findAll(
    @Query() filter: ServiceOrderFilterDto,
  ): Promise<PaginatedServiceOrderResponseDto> {
    return this.serviceOrderService.findAll(filter.page, filter.limit, {
      status: filter.status,
      customerId: filter.customerId,
      vehicleId: filter.vehicleId,
    });
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get general metrics for all service orders' })
  @ApiResponse({
    status: 200,
    description: 'General service order metrics',
    type: GeneralMetricsResponseDto,
  })
  async getGeneralMetrics(): Promise<GeneralMetricsResponseDto> {
    return this.serviceOrderService.getGeneralMetrics();
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get metrics for a specific service order' })
  @ApiResponse({
    status: 200,
    description: 'Service order metrics',
    type: ServiceOrderMetricsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service order not found' })
  async getMetrics(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceOrderMetricsResponseDto> {
    return this.serviceOrderService.getMetrics(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service order found',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service order not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrderService.findById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update service order status' })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Service order not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateServiceOrderStatusDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrderService.updateStatus(id, updateDto);
  }

  @Post(':id/services')
  @ApiOperation({ summary: 'Add service to order' })
  @ApiResponse({
    status: 201,
    description: 'Service added successfully',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot add items in current status',
  })
  @ApiResponse({
    status: 404,
    description: 'Service order or service not found',
  })
  async addService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddServiceOrderItemDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrderService.addServiceItem(id, dto);
  }

  @Post(':id/parts')
  @ApiOperation({ summary: 'Add part to order' })
  @ApiResponse({
    status: 201,
    description: 'Part added successfully',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot add items in current status or insufficient stock',
  })
  @ApiResponse({ status: 404, description: 'Service order or part not found' })
  async addPart(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddServiceOrderPartDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrderService.addPartItem(id, dto);
  }

  @Delete(':id/services/:itemId')
  @ApiOperation({ summary: 'Remove service from order' })
  @ApiResponse({
    status: 200,
    description: 'Service removed successfully',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot remove items in current status',
  })
  @ApiResponse({ status: 404, description: 'Service order or item not found' })
  async removeService(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrderService.removeServiceItem(id, itemId);
  }

  @Delete(':id/parts/:itemId')
  @ApiOperation({ summary: 'Remove part from order' })
  @ApiResponse({
    status: 200,
    description: 'Part removed successfully',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot remove items in current status',
  })
  @ApiResponse({ status: 404, description: 'Service order or item not found' })
  async removePart(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrderService.removePartItem(id, itemId);
  }
}
