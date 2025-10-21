import { pgEnum } from 'drizzle-orm/pg-core';
import { referentielIdEnumValues } from './models/referentiel-id.enum';

export const referentielIdPgEnum = pgEnum(
  'referentiel',
  referentielIdEnumValues
);

// export const referentielId = {
//   referentielId: varchar('referentiel_id', { length: 30 })
//     .notNull()
//     .references(() => referentielDefinitionTable.id),
// };
