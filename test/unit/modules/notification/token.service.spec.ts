import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '@/modules/notification/infrastructure/services/token.service';

describe('TokenService', () => {
  let service: TokenService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, string> = {
        NOTIFICATION_TOKEN_SECRET: 'test-secret',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCustomerToken', () => {
    it('should generate a JWT with orderNumber and customerId', () => {
      const token = service.generateCustomerToken('OS-2024-00001', 'customer-uuid');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          orderNumber: 'OS-2024-00001',
          customerId: 'customer-uuid',
          type: 'customer-action',
        },
        expect.objectContaining({
          secret: 'test-secret',
          expiresIn: '48h',
        }),
      );
      expect(token).toBe('signed-token');
    });
  });

  describe('verifyCustomerToken', () => {
    it('should return payload for valid token', () => {
      const payload = {
        orderNumber: 'OS-2024-00001',
        customerId: 'customer-uuid',
        type: 'customer-action',
      };
      mockJwtService.verify.mockReturnValue(payload);

      const result = service.verifyCustomerToken('valid-token');

      expect(result).toEqual(payload);
    });

    it('should return null for invalid token', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      const result = service.verifyCustomerToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for wrong token type', () => {
      mockJwtService.verify.mockReturnValue({
        orderNumber: 'OS-2024-00001',
        type: 'wrong-type',
      });

      const result = service.verifyCustomerToken('wrong-type-token');

      expect(result).toBeNull();
    });
  });
});
