import {z} from 'zod';
import {DBClient} from '../typeUtils';

export const filterSchema = z.object({
  planActionIds: z.number().array().optional(),

  // Responsables = personne pilote ou service pilote ou structure pilote
  userPiloteIds: z.string().array().optional(),
  personnePiloteIds: z.number().array().optional(),
  structurePiloteIds: z.number().array().optional(),
  servicePiloteIds: z.number().array().optional(),
  // referents: array(string()).optional(),
  // Type TFicheActionStatuts
  statuts: z.number().array().optional(),
  // Type TFicheActionNiveauxPriorite
  priorites: z.number().array().optional(),

  modifiedSince: z.enum([
    'last-90-days',
    'last-60-days',
    'last-30-days',
    'last-15-days',
  ]),
});

export type Filter = z.infer<typeof filterSchema>;

const resultRowsSchema = z
  .object({
    id: z.string(),
  })
  .array();
type ResultRows = z.infer<typeof resultRowsSchema>;

const ficheActionColumns = [
  '*',
];

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  filter: Filter;
};

export async function fetchFilteredFicheActions({
  dbClient,
  collectiviteId,
  filter,
}: Props) {
  // 1. Ajoute les tables liées correspondant aux filtres
  // 👇

  const relatedTables = new Set<string>();

  if (filter.planActionIds?.length) {
    relatedTables.add('fiche_action_axe!inner(axe!inner())');
  }

  if (filter.userPiloteIds?.length) {
    relatedTables.add('fiche_action_pilote!inner()');
  }

  if (filter.personnePiloteIds?.length) {
    relatedTables.add('fiche_action_pilote!inner()');
  }

  if (filter.structurePiloteIds?.length) {
    relatedTables.add('fiche_action_structure_tag!inner()');
  }

  if (filter.servicePiloteIds?.length) {
    relatedTables.add('fiche_action_service_tag!inner(*)');
  }

  // 2. Crée la requête avec les tables liées
  // 👇

  const query = dbClient
    .from('fiches_action')
    .select([...ficheActionColumns, ...relatedTables].join(','), {
      count: 'exact',
    })
    .eq('collectivite_id', collectiviteId);

  // 3. Ajoute les clauses correspondant aux filtres
  // 👇

  if (filter.planActionIds?.length) {
    query.in('fiche_action_axe.axe.plan', filter.planActionIds);
  }

  if (filter.userPiloteIds?.length) {
    query.in('fiche_action_pilote.user_id', filter.userPiloteIds);
  }

  if (filter.personnePiloteIds?.length) {
    query.in('fiche_action_pilote.tag_id', filter.personnePiloteIds);
  }

  if (filter.structurePiloteIds?.length) {
    query.in(
      'fiche_action_structure_tag.structure_tag_id',
      filter.structurePiloteIds
    );
  }

  if (filter.servicePiloteIds?.length) {
    query.in(
      'fiche_action_service_tag.service_tag_id',
      filter.servicePiloteIds
    );
  }

  if (filter.statuts?.length) {
    query.in('statut', filter.statuts);
  }

  if (filter.priorites?.length) {
    query.in('niveau_priorite', filter.priorites);
  }

  const {data, error, count} = await query.returns<ResultRows>();

  if (error) {
    return {error};
  }

  return {data, count};
}
