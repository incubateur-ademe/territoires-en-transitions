import { integer, pgEnum, pgView } from "drizzle-orm/pg-core";
import { collectiviteTable } from "./collectivite.table";

const typeCollectiviteValues = ['commune', 'syndicat',
  'CA',
  'CC',
  'CU',
  'EPT',
  'METRO',
  'PETR',
  'POLEM',
] as const;
const typeCollectiviteEnum = pgEnum('type_collectivite', typeCollectiviteValues);

export const collectiviteCardView = pgView('collectivite_card', {
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  typeCollectivite: typeCollectiviteEnum('type_collectivite'),
  // TODO: déclarer les autres champs existants de la vue en fonction des besoins
}).existing();
