import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';

export class DatabaseCleaner {
  static async clean(app: INestApplication): Promise<void> {
    // SAFETY CHECK: Only clean if we're in test environment
    const nodeEnv = process.env.NODE_ENV;
    const dbName = process.env.DB_DATABASE;

    if (nodeEnv !== 'test') {
      throw new Error(
        `SAFETY: Refusing to clean database. NODE_ENV is "${nodeEnv}", expected "test"`,
      );
    }

    if (!dbName?.includes('test')) {
      throw new Error(
        `SAFETY: Refusing to clean database. DB_DATABASE is "${dbName}", expected to contain "test"`,
      );
    }

    const dataSource = app.get(DataSource);

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Get all table names
    const entities = dataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    if (tableNames.length === 0) {
      return;
    }

    // Truncate all tables with CASCADE
    await dataSource.query(`TRUNCATE TABLE ${tableNames} CASCADE`);
  }

  static async cleanTable(
    app: INestApplication,
    tableName: string,
  ): Promise<void> {
    const nodeEnv = process.env.NODE_ENV;
    const dbName = process.env.DB_DATABASE;

    if (nodeEnv !== 'test' || !dbName?.includes('test')) {
      throw new Error('SAFETY: Can only clean tables in test environment');
    }

    const dataSource = app.get(DataSource);
    await dataSource.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
  }
}
