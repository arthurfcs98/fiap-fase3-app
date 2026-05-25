/**
 * Standalone script para rodar migrations TypeORM no container do Job K8s.
 * Carrega secrets do AWS Secrets Manager antes de criar a DataSource.
 */
import { loadSecretsToEnv } from '../shared/secrets/load-secrets';
import { DataSource } from 'typeorm';

async function run() {
  await loadSecretsToEnv();

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env['DB_HOST'],
    port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
    username: process.env['DB_USERNAME'],
    password: process.env['DB_PASSWORD'],
    database: process.env['DB_DATABASE'],
    entities: [__dirname + '/../**/*.orm-entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    synchronize: false,
    logging: ['error', 'warn', 'migration'],
    ssl: { rejectUnauthorized: false },
  });

  await dataSource.initialize();
  console.log('[migrations] DataSource initialized');

  const pending = await dataSource.showMigrations();
  console.log(`[migrations] pending=${pending}`);

  const result = await dataSource.runMigrations({ transaction: 'each' });
  console.log(`[migrations] applied ${result.length} migrations`);
  for (const m of result) {
    console.log(`  ✓ ${m.name}`);
  }

  await dataSource.destroy();
  console.log('[migrations] done');
}

run().catch((err) => {
  console.error('[migrations] failed:', err);
  process.exit(1);
});
