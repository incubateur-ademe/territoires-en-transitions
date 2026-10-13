import { bigint, integer, text } from 'drizzle-orm/pg-core';
import { repriseTecSchema } from './reprise-tec.schema';

export const recetteCollectiviteTable = repriseTecSchema.table(
  'recette_collectivite',
  {
    tecCollectiviteId: bigint('tec_collectivite_id', {
      mode: 'number',
    }).primaryKey(),
    tetCollectiviteId: integer('tet_collectivite_id'),
    nom: text('nom').notNull(),
    siren: text('siren'),
    population: bigint('population', { mode: 'number' }),
  }
);
