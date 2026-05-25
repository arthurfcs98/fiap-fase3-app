import jwt from 'jsonwebtoken';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

interface AuthorizerEvent {
  headers?: Record<string, string | undefined>;
  routeKey?: string;
  rawPath?: string;
  requestContext?: { http?: { path?: string } };
}

interface AuthorizerResponse {
  isAuthorized: boolean;
  context?: Record<string, string>;
}

let cachedSecret: string | null = null;
const sm = new SecretsManagerClient({});

const deny = (): AuthorizerResponse => ({ isAuthorized: false });

export const handler = async (event: AuthorizerEvent): Promise<AuthorizerResponse> => {
  try {
    const auth = event.headers?.['authorization'] ?? event.headers?.['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      return deny();
    }

    if (!cachedSecret) {
      const arn = process.env['JWT_SECRET_ARN'];
      if (!arn) throw new Error('JWT_SECRET_ARN not set');
      const resp = await sm.send(new GetSecretValueCommand({ SecretId: arn }));
      if (!resp.SecretString) throw new Error('jwt secret has no SecretString');
      cachedSecret = resp.SecretString;
    }

    const token = auth.slice(7);
    const payload = jwt.verify(token, cachedSecret) as Record<string, unknown>;

    return {
      isAuthorized: true,
      context: {
        customerId: String(payload['sub'] ?? ''),
        name: String(payload['name'] ?? ''),
        cpf: String(payload['cpf'] ?? ''),
      },
    };
  } catch {
    return deny();
  }
};
