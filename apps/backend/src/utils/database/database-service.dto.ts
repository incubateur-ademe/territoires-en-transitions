import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface DatabaseServiceDto {
  db: NodePgDatabase;
}
