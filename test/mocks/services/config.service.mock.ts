export const createMockConfigService = (config: Record<string, any> = {}) => ({
  get: jest.fn((key: string, defaultValue?: any) => {
    const defaults: Record<string, any> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_REFRESH_EXPIRES_IN: '7d',
      ...config,
    };
    return defaults[key] ?? defaultValue;
  }),
  getOrThrow: jest.fn((key: string) => {
    const defaults: Record<string, any> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_REFRESH_EXPIRES_IN: '7d',
      ...config,
    };
    if (!(key in defaults)) {
      throw new Error(`Config key "${key}" not found`);
    }
    return defaults[key];
  }),
});
