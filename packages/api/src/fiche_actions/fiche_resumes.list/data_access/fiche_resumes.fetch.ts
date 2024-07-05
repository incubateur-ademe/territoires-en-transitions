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
  relatedTables.add('plans:fiche_action_axe!inner(...axe!inner(*))');

  // Toujours récupérer les pilotes liés à la fiche
  relatedTables.add(
    'pilotes:fiche_action_pilote(personne_tag(nom, id), utilisateur:fiche_action_pilote_dcp(prenom, nom, user_id))'
  );

  if (filtre.structurePiloteIds?.length) {
    relatedTables.add('fiche_action_structure_tag!inner()');
  }

  if (filtre.servicePiloteIds?.length) {
    relatedTables.add('fiche_action_service_tag!inner(*)');
  }

  // 2. Crée la requête avec les tables liées
  // 👇

  const query = dbClient
    .from('fiche_action')
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
    query.in('fiche_action_axe.axe.plan', filtre.planActionIds);
  }

  if (filtre.utilisateurPiloteIds?.length) {
    query.not('pilotes', 'is', null);
    query.in('pilotes.user_id', filtre.utilisateurPiloteIds);
  }

  if (filtre.personnePiloteIds?.length) {
    query.not('pilotes', 'is', null);
    query.in('pilotes.tag_id', filtre.personnePiloteIds);
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
    plan_id: fiche.plans?.[0]?.plan,
    pilotes:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fiche.pilotes as any[])?.flatMap(({personne_tag, utilisateur}) => {
        if (personne_tag) {
          return personne_tag;
        }

        if (utilisateur) {
          return {
            ...utilisateur,
            nom: `${utilisateur.prenom} ${utilisateur.nom}`,
          };
        }

        return [];
      }) ?? null,
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
