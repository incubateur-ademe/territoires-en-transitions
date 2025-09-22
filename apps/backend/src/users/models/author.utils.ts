import { sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import z from 'zod';
import { dcpSchema } from './dcp.table';

export const authorSchema = dcpSchema
  .pick({
    nom: true,
    prenom: true,
  })
  .extend({
    id: dcpSchema.shape.userId,
  });

export type Author = z.infer<typeof authorSchema>;

export function sqlAuthorOrNull({
  userIdColumn,
  prenomColumn,
  nomColumn,
}: {
  userIdColumn: PgColumn;
  prenomColumn: PgColumn;
  nomColumn: PgColumn;
}) {
  return sql<Author | null>`
    CASE WHEN ${userIdColumn} IS NULL THEN NULL
    ELSE json_build_object('id', ${userIdColumn}, 'prenom', ${prenomColumn}, 'nom', ${nomColumn})
    END
  `;
}
