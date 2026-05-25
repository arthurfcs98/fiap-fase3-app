import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TokenService } from '@/modules/notification/infrastructure/services/token.service';
import { AuthErrors } from '@/shared/domain/exceptions/errors';

@Injectable()
export class CustomerTokenGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AuthErrors.INVALID_TOKEN();
    }

    const token = authHeader.split(' ')[1];
    const payload = this.tokenService.verifyCustomerToken(token);

    if (!payload) {
      throw AuthErrors.INVALID_TOKEN();
    }

    const orderNumber = request.params.orderNumber;
    if (payload.orderNumber !== orderNumber) {
      throw AuthErrors.INVALID_TOKEN();
    }

    // Attach payload to request for use in controller
    request.customerToken = payload;
    return true;
  }
}
