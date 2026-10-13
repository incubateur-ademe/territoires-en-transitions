import { bigint, date, integer, text } from 'drizzle-orm/pg-core';
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
    suiviObligation: text('suivi_obligation'),
    suiviAvisEtatLe: date('suivi_avis_etat_le'),
    suiviApprobationLe: date('suivi_approbation_le'),
  }
);
