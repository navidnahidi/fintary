// Migration and script-related types

export interface MigrationFile {
  name: string;
  path: string;
  content: string;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  executedMigrations?: string[];
  errors?: string[];
}
