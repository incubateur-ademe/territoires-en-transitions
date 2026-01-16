import { dcpSchema } from '@tet/domain/users';
import { sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import * as z from 'zod/mini';

export const authorSchema = z.object({
  id: dcpSchema.shape.id,
  nom: dcpSchema.shape.nom,
  prenom: dcpSchema.shape.prenom,
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
