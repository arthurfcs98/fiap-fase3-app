// OpenTelemetry deve ser o primeiro import pra capturar todas as
// instrumentações (express, pg, http, dns).
import './observability/otel';
import { loadSecretsToEnv } from './shared/secrets/load-secrets';

async function bootstrap() {
  // Carrega secrets do AWS Secrets Manager ANTES de instanciar o app.
  // Popula DB_HOST/PORT/USERNAME/PASSWORD/DATABASE e JWT_SECRET em process.env,
  // pra ConfigService e TypeOrmModule encontrarem na inicialização.
  await loadSecretsToEnv();

  // Imports dinâmicos (após popular env) — assim qualquer leitura
  // estática de env nos módulos pega os valores já corretos.
  const { NestFactory } = await import('@nestjs/core');
  const { Logger, ValidationPipe } = await import('@nestjs/common');
  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
  const { AppModule } = await import('./app.module');
  const { GlobalExceptionFilter } = await import(
    './shared/infrastructure/filters/http-exception.filter'
  );
  const { CorrelationIdInterceptor } = await import(
    './shared/observability/correlation-id.interceptor'
  );

  const { Logger: PinoLogger } = await import('nestjs-pino');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new CorrelationIdInterceptor());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,X-Correlation-Id',
    exposedHeaders: 'X-Correlation-Id',
  });

  const config = new DocumentBuilder()
    .setTitle('Oficina Mecânica API — Fase 3')
    .setDescription(
      'API para gestão de oficina mecânica. Autenticação via CPF (Lambda externa emite o JWT). Rotas protegidas exigem Bearer token.',
    )
    .setVersion('3.0')
    // Server URLs incluem o stage do API Gateway (/prod, /homolog).
    // O Nest internamente NÃO vê o prefix do stage (API GW remove antes
    // do proxy), então sem isso o "Try it out" do Swagger gera URLs sem
    // /prod e dá 404 no API Gateway.
    .addServer(
      process.env['PUBLIC_API_BASE_URL'] ||
        'https://aopti5ygbj.execute-api.us-east-1.amazonaws.com/prod',
      'prod',
    )
    .addServer(
      'https://aopti5ygbj.execute-api.us-east-1.amazonaws.com/homolog',
      'homolog',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT emitido pela Lambda /auth (POST {gateway}/auth { cpf })',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Customers', 'Gestão de clientes')
    .addTag('Vehicles', 'Gestão de veículos')
    .addTag('Services', 'Catálogo de serviços')
    .addTag('Parts', 'Peças e estoque')
    .addTag('Service Orders', 'Ordens de serviço')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API v3.0 listening on port ${port}`);
  logger.log(`Swagger: http://localhost:${port}/api/docs`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal during bootstrap:', err);
  process.exit(1);
});
