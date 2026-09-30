import { levierGesIdPgEnum } from '@tet/backend/collectivites/shared/models/levier-ges-id.column';
import { voletCategoriePgEnum } from '@tet/backend/collectivites/shared/models/volet-categorie.column';
import { ActionDeReferenceId } from '@tet/domain/shared';
import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, unique } from 'drizzle-orm/pg-core';

const whitespaceTrimmedByJsLiteral = sql.raw(
  String.raw`E' \t\n\u000B\f\r\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF'`
);

export const actionDeReferenceTable = pgTable(
  'action_de_reference',
  {
    id: integer('id')
      .primaryKey()
      .generatedAlwaysAsIdentity()
      .$type<ActionDeReferenceId>(),
    titre: text('titre').notNull(),
    description: text('description').notNull(),
    levier: levierGesIdPgEnum('levier').notNull(),
    categorie: voletCategoriePgEnum('categorie').notNull(),
  },
  (table) => [
    unique('action_de_reference_unique').on(
      table.levier,
      table.categorie,
      table.titre
    ),
    check(
      'action_de_reference_titre_non_vide',
      sql`${table.titre} <> '' AND ${table.titre} = btrim(${table.titre}, ${whitespaceTrimmedByJsLiteral})`
    ),
    check(
      'action_de_reference_titre_longueur_max',
      sql`char_length(${table.titre}) <= 300`
    ),
    check(
      'action_de_reference_description_non_vide',
      sql`${table.description} <> '' AND ${table.description} = btrim(${table.description}, ${whitespaceTrimmedByJsLiteral})`
    ),
  ]
);
