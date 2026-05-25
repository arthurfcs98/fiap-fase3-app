export const createMockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ sub: 'user-uuid' }),
  verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-uuid' }),
  decode: jest.fn().mockReturnValue({ sub: 'user-uuid' }),
});
