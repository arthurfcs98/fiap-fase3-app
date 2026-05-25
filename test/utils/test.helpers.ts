import { ExecutionContext } from '@nestjs/common';

export const createMockExecutionContext = (
  request: Partial<{
    user: any;
    headers: Record<string, string>;
    params: Record<string, string>;
    query: Record<string, string>;
    body: any;
  }> = {},
): ExecutionContext => {
  const mockRequest = {
    user: null,
    headers: {},
    params: {},
    query: {},
    body: {},
    ...request,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }),
      getNext: () => jest.fn(),
    }),
    getClass: () => Object,
    getHandler: () => jest.fn(),
    getArgs: () => [],
    getArgByIndex: () => ({}),
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
    getType: () => 'http',
  } as unknown as ExecutionContext;
};

export const createPaginatedResult = <T>(
  data: T[],
  total: number = data.length,
): [T[], number] => {
  return [data, total];
};
