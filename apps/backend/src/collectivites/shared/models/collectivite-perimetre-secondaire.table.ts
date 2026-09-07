import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import { PerimetreSecondaireSource } from '@tet/domain/collectivites';
import { integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

/**
 * Les périmètres géographiques d'une collectivité au-delà du principal.
 *
 * `collectivite` porte **un** code de région et **un** code de département. Or
 * une DR ADEME peut piloter deux régions, et un EPCI chevaucher plusieurs
 * départements — Redon Agglomération s'étale sur 44, 56 et 35. Le principal
 * reste sur `collectivite`, les autres viennent ici.
 *
 * Une ligne porte un code de région **ou** un code de département, jamais les
 * deux : la base l'impose (`collectivite_perimetre_secondaire_un_seul_code`).
 */
export const collectivitePerimetreSecondaireTable = pgTable(
  'collectivite_perimetre_secondaire',
  {
    id: serial('id').primaryKey(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    regionCode: varchar('region_code', { length: 2 }),
    departementCode: varchar('departement_code', { length: 3 }),
    source: text('source').notNull().$type<PerimetreSecondaireSource>(),
    createdAt,
  }
);
