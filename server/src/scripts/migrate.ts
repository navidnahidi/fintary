#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { db } from '../models/database';
import { MigrationFile, MigrationRow } from '../types/migration';

class MigrationRunner {
  private migrationsDir: string;
  private seedsDir: string;

  constructor() {
    this.migrationsDir = join(process.cwd(), 'sql', 'migrations');
    this.seedsDir = join(process.cwd(), 'sql', 'seeds');
  }

  public async runMigrations(): Promise<void> {
    try {
      // Test database connection
      await db.testConnection();

      // Get all migration files
      const migrationFiles = this.getMigrationFiles();

      // Check which migrations have already been run
      const executedMigrations = await this.getExecutedMigrations();

      // Run pending migrations
      for (const migration of migrationFiles) {
        if (!executedMigrations.includes(migration.name)) {
          `📝 Running migration: ${migration.name}`;
          await this.executeMigration(migration);
          `✅ Migration ${migration.name} completed`;
        } else {
          `⏭️  Migration ${migration.name} already executed, skipping`;
        }
      }

      ('🎉 All migrations completed successfully!');
    } catch (error) {
      throw error;
    }
  }

  public async runSeeds(): Promise<void> {
    try {
      ('🌱 Starting seed process...');

      // Test database connection
      await db.testConnection();

      // Get all seed files
      const seedFiles = this.getSeedFiles();

      // Check which seeds have already been run
      const executedSeeds = await this.getExecutedMigrations();

      // Run pending seeds
      for (const seed of seedFiles) {
        if (!executedSeeds.includes(seed.name)) {
          `🌱 Running seed: ${seed.name}`;
          await this.executeMigration(seed);
          `✅ Seed ${seed.name} completed`;
        } else {
          `⏭️  Seed ${seed.name} already executed, skipping`;
        }
      }

      ('🎉 All seeds completed successfully!');
    } catch (error) {
      throw error;
    }
  }

  public async resetDatabase(): Promise<void> {
    try {
      ('🔄 Resetting database...');

      await db.testConnection();

      // Drop all tables
      await db.query('DROP TABLE IF EXISTS transactions CASCADE');
      await db.query('DROP TABLE IF EXISTS orders CASCADE');
      await db.query('DROP TABLE IF EXISTS migrations CASCADE');

      ('✅ Database reset completed');
    } catch (error) {
      throw error;
    }
  }

  public async showStatus(): Promise<void> {
    try {
      await db.testConnection();

      const result = await db.query<MigrationRow>(`
                SELECT migration_name, executed_at, checksum, execution_time_ms 
                FROM migrations 
                ORDER BY executed_at
            `);

      ('\n📊 Migration Status:');
      ('==================');

      if (result.rows.length === 0) {
        ('No migrations have been executed yet.');
      } else {
        result.rows.forEach((row: MigrationRow) => {
          `✅ ${row.migration_name} - ${row.executed_at} (${row.execution_time_ms}ms)`;
        });
      }
    } catch (error) {
      throw error;
    }
  }

  private getMigrationFiles(): MigrationFile[] {
    try {
      const files = readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      return files.map(file => ({
        name: file,
        path: join(this.migrationsDir, file),
        content: readFileSync(join(this.migrationsDir, file), 'utf-8'),
      }));
    } catch (error) {
      return [];
    }
  }

  private getSeedFiles(): MigrationFile[] {
    try {
      const files = readdirSync(this.seedsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      return files.map(file => ({
        name: file,
        path: join(this.seedsDir, file),
        content: readFileSync(join(this.seedsDir, file), 'utf-8'),
      }));
    } catch (error) {
      return [];
    }
  }

  private async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await db.query<{ migration_name: string }>(
        'SELECT migration_name FROM migrations'
      );
      return result.rows.map(row => row.migration_name);
    } catch (error) {
      // If migrations table doesn't exist yet, return empty array
      return [];
    }
  }

  private async executeMigration(migration: MigrationFile): Promise<void> {
    const startTime = Date.now();

    try {
      await db.query(migration.content);

      const executionTime = Date.now() - startTime;
      `⏱️  Migration ${migration.name} took ${executionTime}ms`;
    } catch (error) {
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'migrate':
        await runner.runMigrations();
        break;
      case 'seed':
        await runner.runSeeds();
        break;
      case 'reset':
        await runner.resetDatabase();
        break;
      case 'status':
        await runner.showStatus();
        break;
      case 'fresh':
        await runner.resetDatabase();
        await runner.runMigrations();
        await runner.runSeeds();
        break;
      default:
        `
🔄 Migration Runner

Usage: npm run migrate [command]

Commands:
  migrate  - Run pending migrations
  seed     - Run pending seeds
  reset    - Reset database (drop all tables)
  status   - Show migration status
  fresh    - Reset and run all migrations and seeds

Examples:
  npm run migrate migrate
  npm run migrate seed
  npm run migrate status
  npm run migrate fresh
                `;
        break;
    }
  } catch (error) {
    process.exit(1);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  main();
}

export default MigrationRunner;
