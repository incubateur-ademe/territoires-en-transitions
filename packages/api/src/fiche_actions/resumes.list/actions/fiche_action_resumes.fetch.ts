import {z} from 'zod';
import {DBClient} from '../../../typeUtils';
import {Options, fetchOptionsSchema} from '../domain/fetch_options.schema';

const outputSchema = z
  .object({
    id: z.string(),
  })
  .array();

type Output = z.infer<typeof outputSchema>;

const ficheActionColumns = ['*'];

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  options: Options;
};

/**
 * Charge une liste de résumés de fiches actions en fonction des filtres en paramètres.
 */
export async function ficheActionResumesFetch({
  dbClient,
  collectiviteId: unsafeCollectiviteId,
  options,
}: Props) {
  const collectiviteId = z.number().parse(unsafeCollectiviteId);
  const {filtre: filter, sort, page, limit} = fetchOptionsSchema.parse(options);

  // 1. Ajoute les tables liées correspondant aux filtres
  // 👇

  const relatedTables = new Set<string>();

  if (filter.planActionIds?.length) {
    relatedTables.add('fiche_action_axe!inner()');
  }

  if (filter.utilisateurPiloteIds?.length) {
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

  if (filter.utilisateurPiloteIds?.length) {
    query.in('fiche_action_pilote.user_id', filter.utilisateurPiloteIds);
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

  const {data, error, count} = await query.returns<Output>();

  if (error) {
    return {error};
  }

  return {data, count, nextPage: count > page * limit ? page + 1 : null};
}
