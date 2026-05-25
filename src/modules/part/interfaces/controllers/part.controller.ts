import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { PartService } from '../../application/services/part.service';
import {
  CreatePartDto,
  UpdatePartDto,
  UpdateStockDto,
  PartResponseDto,
  PaginatedPartResponseDto,
} from '../../application/dto';
import { PaginationDto } from '@/shared/application/dto';

@ApiTags('Parts')
@ApiBearerAuth('JWT-auth')
@Controller('admin/parts')
export class PartController {
  constructor(private readonly partService: PartService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new part' })
  @ApiResponse({
    status: 201,
    description: 'Part created successfully',
    type: PartResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Part code already exists' })
  async create(@Body() createPartDto: CreatePartDto): Promise<PartResponseDto> {
    return this.partService.create(createPartDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all parts' })
  @ApiResponse({
    status: 200,
    description: 'List of parts',
    type: PaginatedPartResponseDto,
  })
  async findAll(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedPartResponseDto> {
    return this.partService.findAll(pagination.page, pagination.limit);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get parts with low stock' })
  @ApiResponse({
    status: 200,
    description: 'List of parts with low stock',
    type: [PartResponseDto],
  })
  async findLowStock(): Promise<PartResponseDto[]> {
    return this.partService.findLowStock();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get part by ID' })
  @ApiResponse({
    status: 200,
    description: 'Part found',
    type: PartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Part not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PartResponseDto> {
    return this.partService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update part' })
  @ApiResponse({
    status: 200,
    description: 'Part updated successfully',
    type: PartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Part not found' })
  @ApiResponse({ status: 409, description: 'Part code already in use' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePartDto: UpdatePartDto,
  ): Promise<PartResponseDto> {
    return this.partService.update(id, updatePartDto);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Update part stock' })
  @ApiResponse({
    status: 200,
    description: 'Stock updated successfully',
    type: PartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid operation or insufficient stock',
  })
  @ApiResponse({ status: 404, description: 'Part not found' })
  async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStockDto: UpdateStockDto,
  ): Promise<PartResponseDto> {
    return this.partService.updateStock(id, updateStockDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete part (soft delete)' })
  @ApiResponse({ status: 204, description: 'Part deleted successfully' })
  @ApiResponse({ status: 404, description: 'Part not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.partService.delete(id);
  }
}
