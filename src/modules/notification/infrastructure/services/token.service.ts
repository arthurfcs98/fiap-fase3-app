import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface CustomerTokenPayload {
  orderNumber: string;
  customerId: string;
  type: 'customer-action';
}

@Injectable()
export class TokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.secret = this.configService.get<string>(
      'NOTIFICATION_TOKEN_SECRET',
      'notification-secret',
    );
    this.expiresIn = '48h';
  }

  generateCustomerToken(orderNumber: string, customerId: string): string {
    const payload: CustomerTokenPayload = {
      orderNumber,
      customerId,
      type: 'customer-action',
    };

    return this.jwtService.sign(payload, {
      secret: this.secret,
      expiresIn: this.expiresIn,
    });
  }

  verifyCustomerToken(token: string): CustomerTokenPayload | null {
    try {
      const payload = this.jwtService.verify<CustomerTokenPayload>(token, {
        secret: this.secret,
      });

      if (payload.type !== 'customer-action') {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}
