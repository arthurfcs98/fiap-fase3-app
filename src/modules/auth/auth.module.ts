import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * AuthModule da Fase 3.
 *
 * Em comparação à Fase 2:
 * - REMOVIDO: AuthController (POST /login, /register, /refresh)
 * - REMOVIDO: AuthService, UserRepository, UserOrmEntity
 * - REMOVIDO: registro de RolesGuard (sem hierarquia operador/admin/cliente)
 * - REMOVIDO: APP_GUARD global do JwtAuthGuard (controllers usam @UseGuards explícito)
 *
 * MANTIDO:
 * - JwtStrategy: valida tokens emitidos pela Lambda Auth externa (HS256, secret do SM)
 * - JwtAuthGuard: usado via @UseGuards(JwtAuthGuard) nos controllers
 *
 * O JWT vem do Lambda /auth e contém claims { sub, name, cpf }.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtStrategy],
})
export class AuthModule {}
