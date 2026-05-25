import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT issued by the external Lambda Auth (fiap-fase3-auth-lambda).
 * Claims: { sub: customerId, name, cpf: masked, iat, exp }
 *
 * Defense-in-depth: API Gateway already validates the token via Lambda
 * Authorizer, but the NestJS strategy validates again to protect against
 * direct access to the pod (e.g., kubectl port-forward).
 */
export interface JwtPayload {
  sub: string;
  name: string;
  cpf: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  customerId: string;
  name: string;
  cpf: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return {
      customerId: payload.sub,
      name: payload.name,
      cpf: payload.cpf,
    };
  }
}
