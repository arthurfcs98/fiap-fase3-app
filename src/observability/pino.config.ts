import type { Params } from 'nestjs-pino';
import { getCorrelationId } from '../shared/observability/correlation-id.interceptor';

/**
 * Config global do nestjs-pino:
 * - logs em JSON (uma linha por evento)
 * - inclui correlationId em todos os logs (lido do AsyncLocalStorage)
 * - ignora /api/health do log de request
 * - mascara campos sensíveis (Authorization header, senhas)
 */
export const pinoConfig: Params = {
  pinoHttp: {
    level: process.env['LOG_LEVEL'] ?? 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    customProps: () => ({
      correlationId: getCorrelationId(),
      service: 'fiap-fase3-app',
    }),
    autoLogging: {
      ignore: (req) => {
        const url = (req as { url?: string }).url ?? '';
        return url.startsWith('/api/health') || url.startsWith('/api/docs');
      },
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.cpf',
      ],
      remove: true,
    },
  },
};
