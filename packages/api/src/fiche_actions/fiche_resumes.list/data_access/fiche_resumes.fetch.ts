import {z} from 'zod';
import {DBClient} from '../../../typeUtils';
import {
  FetchOptions,
  Filtre as FiltreFicheActions,
  fetchOptionsSchema,
} from '../domain/fetch_options.schema';
import {FicheResume} from '../domain/fiche_resumes.schema';

type Output = Array<FicheResume>;

const ficheActionColumns = [
  'id',
  'titre',
  'statut',
  'collectivite_id',
  'modified_at',
  'pilotes',
  // 'plans',
  'date_fin_provisoire',
  'niveau_priorite',
  'restreint',
  'amelioration_continue',
];

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  options: FetchOptions;
};

/**
 * Charge une liste de résumés de fiches actions en fonction des filtres en paramètres.
 */
export async function ficheResumesFetch({
  dbClient,
  collectiviteId: unsafeCollectiviteId,
  options,
}: Props) {
  const collectiviteId = z.number().parse(unsafeCollectiviteId);
  const {filtre: filtre, sort, page, limit} = fetchOptionsSchema.parse(options);

  // 1. Ajoute les tables liées correspondant aux filtres
  // 👇

  const relatedTables = new Set<string>();

  // Toujours récupérer les axes pour avoir l'id du plan racine
  relatedTables.add('plans:fiche_action_axe!inner(*)');
  // if (filtre.planActionIds?.length) {
  // }

  if (filtre.utilisateurPiloteIds?.length) {
    relatedTables.add('fiche_action_pilote!inner()');
  }

  if (filtre.personnePiloteIds?.length) {
    relatedTables.add('fiche_action_pilote!inner()');
  }

  if (filtre.structurePiloteIds?.length) {
    relatedTables.add('fiche_action_structure_tag!inner()');
  }

  if (filtre.servicePiloteIds?.length) {
    relatedTables.add('fiche_action_service_tag!inner(*)');
  }

  // 2. Crée la requête avec les tables liées
  // 👇

  const query = dbClient
    .from('fiches_action')
    .select([...ficheActionColumns, ...relatedTables].join(','), {
      count: 'exact',
    })
    .range((page - 1) * limit, page * limit - 1)
    .eq('collectivite_id', collectiviteId);

  if (sort?.length) {
    sort.forEach(sort => {
      query.order(sort.field, {ascending: sort.direction === 'asc'});
    });
  }

  // 3. Ajoute les clauses correspondant aux filtres
  // 👇

  if (filtre.planActionIds?.length) {
    query.in('fiche_action_axe.plan', filtre.planActionIds);
  }

  if (filtre.utilisateurPiloteIds?.length) {
    query.in('fiche_action_pilote.user_id', filtre.utilisateurPiloteIds);
  }

  if (filtre.personnePiloteIds?.length) {
    query.in('fiche_action_pilote.tag_id', filtre.personnePiloteIds);
  }

  if (filtre.structurePiloteIds?.length) {
    query.in(
      'fiche_action_structure_tag.structure_tag_id',
      filtre.structurePiloteIds
    );
  }

  if (filtre.servicePiloteIds?.length) {
    query.in(
      'fiche_action_service_tag.service_tag_id',
      filtre.servicePiloteIds
    );
  }

  if (filtre.statuts?.length) {
    query.in('statut', filtre.statuts);
  }

  if (filtre.priorites?.length) {
    query.in('niveau_priorite', filtre.priorites);
  }

  if (filtre.modifiedSince) {
    query.gte('modified_at', getDateSince(filtre.modifiedSince));
  }

  if (filtre.texteNomOuDescription) {
    query.or(
      `titre.ilike.*${filtre.texteNomOuDescription}*,description.ilike.*${filtre.texteNomOuDescription}*`
    );
    // query.ilike('titre', `%${filtre.texteNomOuDescription}%`);
  }

  query.order('modified_at', {ascending: false});

  const {data, error, count} = await query.returns<Output>();

  if (error) {
    console.error(error);
    return {error};
  }

  const nextPage = (count ?? 0) > page * limit ? page + 1 : null;
  const nbOfPages = Math.ceil((count ?? 0) / limit);

  // 4. Transforme les données pour les adapter au format attendu

  const fiches = data.map(fiche => ({
    ...fiche,
    plan_id: fiche.plans?.[0]?.id,
  }));

  return {data: fiches, count, nextPage, nbOfPages};
}

function getDateSince(value: NonNullable<FiltreFicheActions['modifiedSince']>) {
  const match = value.match(/\d+/) as RegExpMatchArray;
  const nombreDeJours = parseInt(match[0]);

  const date = new Date();
  date.setDate(date.getDate() - nombreDeJours);
  const modifiedSince = date.toISOString();

  return modifiedSince;
}
