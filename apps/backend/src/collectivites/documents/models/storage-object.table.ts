import { createdAt } from '@tet/backend/utils/column.utils';
import { sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

const storageSchema = pgSchema('storage');

export const storageObjectTable = storageSchema.table(
  'objects',
  {
    id: uuid('id').defaultRandom().notNull(),
    bucketId: text('bucket_id'),
    name: text('name'),
    owner: uuid('owner'),
    createdAt: createdAt,
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    lastAccessedAt: timestamp('last_accessed_at', {
      withTimezone: true,
    }).defaultNow(),
    metadata: jsonb('metadata'),
    pathTokens: text('path_tokens')
      .array()
      .generatedAlwaysAs(sql`string_to_array(name, '/'::text)`),
    version: text('version'),
    ownerId: text('owner_id'),
    userMetadata: jsonb('user_metadata'),
    level: integer('level'),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'objects_pkey' })]
);
