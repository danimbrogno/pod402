import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@project/drizzle';

// Create the connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/app';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

// Create the database instance
export const db = drizzle(client, { schema });

// Export schema for convenience
export { schema };
