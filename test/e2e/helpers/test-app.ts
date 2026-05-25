import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';

export class TestApp {
  private static instance: INestApplication | null = null;
  private static accessToken = '';

  static async getInstance(): Promise<INestApplication> {
    if (!this.instance) {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      this.instance = moduleFixture.createNestApplication();
      this.instance.setGlobalPrefix('api');
      this.instance.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
      );
      await this.instance.init();
    }
    return this.instance;
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
    }
  }

  static setAccessToken(token: string): void {
    this.accessToken = token;
  }

  static getAccessToken(): string {
    return this.accessToken;
  }
}
