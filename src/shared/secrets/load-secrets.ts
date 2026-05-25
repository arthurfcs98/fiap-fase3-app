import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

interface DbCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  dbname: string;
}

/**
 * Carrega secrets do AWS Secrets Manager e popula process.env ANTES da inicialização
 * do NestJS, para que ConfigService/TypeOrmModule encontrem as variáveis no boot.
 *
 * Chama essa função no início do main.ts, antes de NestFactory.create().
 *
 * Skip se SKIP_SECRETS_LOADER=true (útil em dev local com docker-compose).
 */
export async function loadSecretsToEnv(): Promise<void> {
  if (process.env['SKIP_SECRETS_LOADER'] === 'true') {
    console.log('[secrets-loader] SKIP_SECRETS_LOADER=true, lendo env do .env');
    return;
  }

  const dbSecretArn = process.env['DB_SECRET_ARN'];
  const jwtSecretArn = process.env['JWT_SECRET_ARN'];

  if (!dbSecretArn || !jwtSecretArn) {
    console.warn(
      '[secrets-loader] DB_SECRET_ARN ou JWT_SECRET_ARN não definidos, pulando carga do SM',
    );
    return;
  }

  const region = process.env['AWS_REGION'] ?? 'us-east-1';
  const client = new SecretsManagerClient({ region });

  const [dbResp, jwtResp] = await Promise.all([
    client.send(new GetSecretValueCommand({ SecretId: dbSecretArn })),
    client.send(new GetSecretValueCommand({ SecretId: jwtSecretArn })),
  ]);

  if (!dbResp.SecretString) throw new Error('db secret has no SecretString');
  if (!jwtResp.SecretString) throw new Error('jwt secret has no SecretString');

  const db = JSON.parse(dbResp.SecretString) as DbCredentials;

  process.env['DB_HOST'] = db.host;
  process.env['DB_PORT'] = String(db.port);
  process.env['DB_USERNAME'] = db.username;
  process.env['DB_PASSWORD'] = db.password;
  process.env['DB_DATABASE'] = db.dbname;
  process.env['JWT_SECRET'] = jwtResp.SecretString;

  console.log(
    `[secrets-loader] env carregado (DB_HOST=${db.host}, dbname=${db.dbname}, JWT_SECRET=*** ${jwtResp.SecretString.length} chars)`,
  );
}
