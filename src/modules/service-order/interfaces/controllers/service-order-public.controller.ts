import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Public } from '@/modules/auth/decorators';
import { ServiceOrderService } from '../../application/services/service-order.service';
import { PublicServiceOrderResponseDto } from '../../application/dto';
import { TokenService } from '@/modules/notification/infrastructure/services/token.service';
import { CustomerTokenGuard } from '../guards/customer-token.guard';
import {
  ICustomerRepository,
  CUSTOMER_REPOSITORY,
} from '@/modules/customer/domain/repositories/customer.repository.interface';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../domain/repositories/service-order.repository.interface';
import { ServiceOrderErrors, CustomerErrors } from '@/shared/domain/exceptions/errors';

class CustomerAccessDto {
  @IsNotEmpty()
  @IsString()
  document: string;

  @IsNotEmpty()
  @IsString()
  orderNumber: string;
}

@ApiTags('Public')
@Controller('public/service-orders')
export class ServiceOrderPublicController {
  constructor(
    private readonly serviceOrderService: ServiceOrderService,
    private readonly tokenService: TokenService,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
  ) {}

  @Public()
  @Post('access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Customer access - get token via CPF/CNPJ + order number' })
  @ApiBody({ type: CustomerAccessDto })
  @ApiResponse({ status: 200, description: 'Access granted, token returned' })
  @ApiResponse({ status: 404, description: 'Order or customer not found' })
  async customerAccess(@Body() dto: CustomerAccessDto) {
    const cleanDoc = dto.document.replace(/\D/g, '');
    const customer = await this.customerRepository.findByDocument(cleanDoc);
    if (!customer) {
      throw CustomerErrors.NOT_FOUND();
    }

    const order = await this.serviceOrderRepository.findByOrderNumber(dto.orderNumber);
    if (!order || order.customerId !== customer.id) {
      throw ServiceOrderErrors.ORDER_BY_NUMBER_NOT_FOUND(dto.orderNumber);
    }

    const token = this.tokenService.generateCustomerToken(dto.orderNumber, customer.id);
    const publicOrder = await this.serviceOrderService.findByOrderNumber(dto.orderNumber);

    return { token, order: publicOrder };
  }

  @Public()
  @Get('verify-token')
  @ApiOperation({ summary: 'Verify customer token and return order data' })
  @ApiQuery({ name: 'token', required: true })
  @ApiQuery({ name: 'orderNumber', required: true })
  @ApiResponse({ status: 200, description: 'Token valid, order data returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyToken(
    @Query('token') token: string,
    @Query('orderNumber') orderNumber: string,
  ) {
    const payload = this.tokenService.verifyCustomerToken(token);
    if (!payload || payload.orderNumber !== orderNumber) {
      throw ServiceOrderErrors.INVALID_STATUS_TRANSITION('INVALID_TOKEN', 'ACCESS');
    }

    const order = await this.serviceOrderService.findByOrderNumber(orderNumber);
    return { valid: true, order };
  }

  @Public()
  @UseGuards(CustomerTokenGuard)
  @Get(':orderNumber')
  @ApiBearerAuth('Customer-Token')
  @ApiOperation({
    summary: 'Get service order status by order number (requires customer token)',
  })
  @ApiResponse({
    status: 200,
    description: 'Service order status',
    type: PublicServiceOrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing customer token' })
  @ApiResponse({ status: 404, description: 'Service order not found' })
  async findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
  ): Promise<PublicServiceOrderResponseDto> {
    return this.serviceOrderService.findByOrderNumber(orderNumber);
  }

  @Public()
  @UseGuards(CustomerTokenGuard)
  @Post(':orderNumber/approve')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Customer-Token')
  @ApiOperation({ summary: 'Approve service order quote (requires customer token)' })
  @ApiResponse({
    status: 200,
    description: 'Quote approved, service order moved to in progress',
    type: PublicServiceOrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing customer token' })
  @ApiResponse({ status: 400, description: 'Order is not awaiting approval' })
  @ApiResponse({ status: 404, description: 'Service order not found' })
  async approveQuote(
    @Param('orderNumber') orderNumber: string,
  ): Promise<PublicServiceOrderResponseDto> {
    return this.serviceOrderService.approveQuote(orderNumber);
  }

  @Public()
  @UseGuards(CustomerTokenGuard)
  @Post(':orderNumber/reject')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Customer-Token')
  @ApiOperation({ summary: 'Reject service order quote (requires customer token)' })
  @ApiResponse({
    status: 200,
    description: 'Quote rejected, service order cancelled',
    type: PublicServiceOrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing customer token' })
  @ApiResponse({ status: 400, description: 'Order is not awaiting approval' })
  @ApiResponse({ status: 404, description: 'Service order not found' })
  async rejectQuote(
    @Param('orderNumber') orderNumber: string,
  ): Promise<PublicServiceOrderResponseDto> {
    return this.serviceOrderService.rejectQuote(orderNumber);
  }
}
