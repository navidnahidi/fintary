// Migration and script-related types

export interface MigrationFile {
  name: string;
  path: string;
  content: string;
}

export interface MigrationRow {
  migration_name: string;
  executed_at: string;
  checksum: string;
  execution_time_ms: number;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  executedMigrations?: string[];
  errors?: string[];
}
