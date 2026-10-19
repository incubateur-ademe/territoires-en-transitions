import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';

export type Database = NodePgDatabase & { $client: Pool };
