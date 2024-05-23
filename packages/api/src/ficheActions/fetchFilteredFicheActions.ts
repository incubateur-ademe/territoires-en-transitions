import {z} from 'zod';
import {DBClient} from '../typeUtils';
import {niveauPriorites, statuts} from './domain/schemas';
import {array} from 'yup';

const filterSchema = z.object({
  planActionIds: z.number().array().optional(),

  userPiloteIds: z.string().array().optional(),
  personnePiloteIds: z.number().array().optional(),
  structurePiloteIds: z.number().array().optional(),
  servicePiloteIds: z.number().array().optional(),
  // referents: array(string()).optional(),

  statuts: statuts.array().optional(),
  priorites: niveauPriorites.array().optional(),

  modifiedSince: z
    .enum(['last-90-days', 'last-60-days', 'last-30-days', 'last-15-days'])
    .optional(),
});

const sortSchema = z.object({
  field: z.enum(['titre', 'modified_at']),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const queryOptionsSchema = z.object({
  filter: filterSchema,
  sort: sortSchema.array().optional(),
  page: z.number().optional().default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type QueryOptions = z.infer<typeof queryOptionsSchema>;

const resultRowsSchema = z
  .object({
    id: z.string(),
  })
  .array();
type ResultRows = z.infer<typeof resultRowsSchema>;

const ficheActionColumns = [
  '*',
  // 'id',
  // 'services',
  // 'structures',
  // 'pilotes',
  // 'statuts',
];

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  options: QueryOptions;
};

/**
 * Charge une liste de fiches actions en fonction des filtres en paramètre.
 */
export async function fetchFilteredFicheActions({
  dbClient,
  collectiviteId,
  options,
}: Props) {
  const {filter, sort, page, limit} = queryOptionsSchema.parse(options);

  // 1. Ajoute les tables liées correspondant aux filtres
  // 👇

  const relatedTables = new Set<string>();

  if (filter.planActionIds?.length) {
    relatedTables.add('fiche_action_axe!inner()');
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
    .from('fiche_resume')
    .select([...ficheActionColumns, ...relatedTables].join(','), {
      count: 'exact',
    })
    .range((page - 1) * limit + 1, page * limit)
    .eq('collectivite_id', collectiviteId);

  if (sort?.length) {
    sort.forEach(sort => {
      query.order(sort.field, {ascending: sort.direction === 'asc'});
    });
  }

  // 3. Ajoute les clauses correspondant aux filtres
  // 👇

  if (filter.planActionIds?.length) {
    query.in('fiche_action_axe.plan', filter.planActionIds);
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

  if (filter.modifiedSince) {
    query.gte(
      'modified_at',
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
    );
  }

  const {data, error, count} = await query.returns<ResultRows>();

  if (error) {
    return {error};
  }

  return {data, count, nextPage: count > page * limit ? page + 1 : null};
}
