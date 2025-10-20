import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface DatabaseServiceInterface {
  db: NodePgDatabase;
}
