import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { ServiceModule } from './modules/service/service.module';
import { PartModule } from './modules/part/part.module';
import { ServiceOrderModule } from './modules/service-order/service-order.module';
import { NotificationModule } from './modules/notification/notification.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const env = configService.get('NODE_ENV');
        const isTest = env === 'test';
        // SSL controlado por env var explicita (DB_SSL=true no ConfigMap K8s).
        const sslEnabled =
          String(configService.get('DB_SSL', 'false')).toLowerCase() === 'true';
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_DATABASE', 'oficina_mecanica'),
          entities: [__dirname + '/**/*.orm-entity{.ts,.js}'],
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          synchronize: isTest || env === 'development',
          // Migrations rodam em um Job K8s separado antes do deploy (run-migrations.ts).
          // Manter false aqui pra evitar race condition entre múltiplos pods.
          migrationsRun: false,
          logging: !isTest && env === 'development',
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/orders',
      exclude: ['/api/(.*)'],
    }),
    AuthModule,
    CustomerModule,
    VehicleModule,
    ServiceModule,
    PartModule,
    ServiceOrderModule,
    NotificationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
