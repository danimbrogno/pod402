export interface DatabaseConfig {
  url: string;
  schema: string;
}

export const defaultDatabaseConfig: DatabaseConfig = {
  url: 'postgres://localhost:5432/app',
  schema: 'public'
};

export function getDrizzleConfig(overrides: Partial<DatabaseConfig> = {}): DatabaseConfig {
  return { ...defaultDatabaseConfig, ...overrides };
}
