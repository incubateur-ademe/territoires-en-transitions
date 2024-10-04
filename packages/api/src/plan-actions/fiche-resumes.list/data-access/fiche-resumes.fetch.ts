import { z } from 'zod';
import { DBClient } from '@tet/api/typeUtils';
import {
  SortFichesAction,
  FetchOptions,
  Filtre as FiltreFicheActions,
  fetchOptionsSchema,
} from '../domain/fetch-options.schema';
import { FicheResume } from '../../domain';
import { objectToCamel } from 'ts-case-convert';

const ficheActionColumns = [
  'id',
  'titre',
  'statut',
  'collectivite_id',
  'modified_at',
  'date_fin_provisoire',
  'niveau_priorite',
  'cibles',
  'restreint',
  'amelioration_continue',
  'date_debut',
  'date_fin_provisoire',
  'budget_previsionnel',
];

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  options?: FetchOptions;
};

/**
 * Charge une liste de résumés de fiches actions en fonction des filtres en paramètres.
 */
export async function ficheResumesFetch({
  dbClient,
  collectiviteId: unsafeCollectiviteId,
  options = { filtre: {} },
}: Props) {
  const collectiviteId = z.number().parse(unsafeCollectiviteId);
  const { filtre, sort, page, limit } = fetchOptionsSchema.parse(options);

  // 1. Ajoute les tables liées correspondant aux filtres
  // 👇

  const relatedTables = new Set<string>();

  // Toujours récupérer les pilotes liés à la fiche
  relatedTables.add(
    'pilotes:fiche_action_pilote(personne_tag(nom, tag_id:id), utilisateur:dcp(prenom, nom, user_id))'
  );

  // Toujours récupérer les services liés à la fiche
  relatedTables.add('services:service_tag(*)');

  // Toujours récupérer le plan lié à la fiche
  relatedTables.add('plans:fiche_action_plan(*)');

  if (filtre.referentielActionIds?.length) {
    relatedTables.add('fiche_action_action!inner()');
  }

  if (filtre.linkedFicheActionIds?.length) {
    relatedTables.add(
      'fiche_action_lien_1:fiche_action_lien!fiche_action_lien_fiche_une_fkey()'
    );
    relatedTables.add(
      'fiche_action_lien_2:fiche_action_lien!fiche_action_lien_fiche_deux_fkey()'
    );
  }

  if (
    filtre.personneReferenteIds?.length ||
    filtre.utilisateurReferentIds?.length
  ) {
    relatedTables.add('referents:fiche_action_referent!inner(*)');
  }

  if (filtre.structurePiloteIds?.length) {
    relatedTables.add('fiche_action_structure_tag!inner()');
  }

  if (filtre.servicePiloteIds?.length) {
    relatedTables.add('fiche_action_service_tag!inner(*)');
  }

  if (filtre.thematiqueIds?.length) {
    relatedTables.add('fiche_action_thematique!inner(*)');
  }

  if (filtre.financeurIds?.length) {
    relatedTables.add('fiche_action_financeur_tag!inner(*)');
  }

  if (filtre.partenaireIds?.length) {
    relatedTables.add('fiche_action_partenaire_tag!inner(*)');
  }

  if (filtre.hasIndicateurLies) {
    relatedTables.add('fiche_action_indicateur()');
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

  // Par défaut tri par ordre alphabétique
  const defaultSort: SortFichesAction = {
    field: 'titre',
    direction: 'desc',
  };

  // S'il l'utilisateur a spécifié un tri, on le met en premier
  const finalSort = sort ? [...sort, defaultSort] : [defaultSort];

  finalSort.forEach((sort) => {
    query.order(sort.field, { ascending: sort.direction === 'asc' });
  });

  // 3. Ajoute les clauses correspondant aux filtres
  // 👇

  if (filtre.planActionIds?.length) {
    query.not('plans', 'is', null);
    query.in('plans.plan', filtre.planActionIds);
  }

  if (filtre.referentielActionIds?.length) {
    query.in('fiche_action_action.action_id', filtre.referentielActionIds);
  }

  if (filtre.linkedFicheActionIds?.length) {
    query.or(
      `not.and(fiche_action_lien_1.is.null, fiche_action_lien_2.is.null)`
    );
    query.not('id', 'in', `(${filtre.linkedFicheActionIds})`);
  }

  if (filtre.utilisateurPiloteIds?.length && filtre.personnePiloteIds?.length) {
    query.not('pilotes', 'is', null);
    query.or(
      `user_id.in.(${filtre.utilisateurPiloteIds.join(
        ','
      )}),tag_id.in.(${filtre.personnePiloteIds.join(',')})`,
      {
        foreignTable: 'pilotes',
      }
    );
    query.in('pilotes.tag_id', filtre.personnePiloteIds);
  } else if (filtre.utilisateurPiloteIds?.length) {
    query.not('pilotes', 'is', null);
    query.in('pilotes.user_id', filtre.utilisateurPiloteIds);
  } else if (filtre.personnePiloteIds?.length) {
    query.not('pilotes', 'is', null);
    query.in('pilotes.tag_id', filtre.personnePiloteIds);
  }

  if (filtre.utilisateurReferentIds?.length) {
    query.not('referents', 'is', null);
    query.in('referents.user_id', filtre.utilisateurReferentIds);
  }

  if (filtre.personneReferenteIds?.length) {
    query.not('referents', 'is', null);
    query.in('referents.tag_id', filtre.personneReferenteIds);
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

  if (filtre.thematiqueIds?.length) {
    query.in('fiche_action_thematique.thematique_id', filtre.thematiqueIds);
  }

  if (filtre.financeurIds?.length) {
    query.in(
      'fiche_action_financeur_tag.financeur_tag_id',
      filtre.financeurIds
    );
  }

  if (filtre.partenaireIds?.length) {
    query.in(
      'fiche_action_partenaire_tag.partenaire_tag_id',
      filtre.partenaireIds
    );
  }

  if (filtre.cibles?.length) {
    // query.in('cibles', filtre.cibles);
    query.containedBy('cibles', filtre.cibles);
  }

  if (filtre.hasIndicateurLies) {
    query.not('fiche_action_indicateur', 'is', null);
  }

  if (filtre.budgetPrevisionnel) {
    query.not('budget_previsionnel', 'is', null);
  }

  if (filtre.restreint) {
    query.is('restreint', true);
  }

  if (filtre.statuts?.length) {
    query.in('statut', filtre.statuts);
  }

  if (filtre.priorites?.length) {
    query.in('niveau_priorite', filtre.priorites);
  }

  if (filtre.dateDebut) {
    query.gte('date_debut', filtre.dateDebut);
  }

  if (filtre.dateFin) {
    query.lte('date_fin_provisoire', filtre.dateFin);
  }

  if (filtre.ameliorationContinue) {
    query.is('amelioration_continue', true);
  }

  if (filtre.modifiedSince) {
    query.gte('modified_at', getDateSince(filtre.modifiedSince));
  }

  if (filtre.texteNomOuDescription) {
    query.or(
      `titre.ilike.*${filtre.texteNomOuDescription}*,description.ilike.*${filtre.texteNomOuDescription}*`
    );
  }

  const { data, error, count } = await query.returns<any[]>();

  if (error) {
    console.error(error);
    return { error };
  }

  const nextPage = (count ?? 0) > page * limit ? page + 1 : null;
  const nbOfPages = Math.ceil((count ?? 0) / limit);

  // 4. Transforme les données pour les adapter au format attendu

  const fiches = data.map((fiche) => ({
    ...fiche,
    plan_id: fiche.plans?.[0]?.plan,
    pilotes:
      (fiche.pilotes as any[])?.flatMap(({ personne_tag, utilisateur }) => {
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

  return {
    data: objectToCamel(fiches) as FicheResume[],
    count,
    nextPage,
    nbOfPages,
  };
}

function getDateSince(value: NonNullable<FiltreFicheActions['modifiedSince']>) {
  const match = value.match(/\d+/) as RegExpMatchArray;
  const nombreDeJours = parseInt(match[0]);

  const date = new Date();
  date.setDate(date.getDate() - nombreDeJours);
  const modifiedSince = date.toISOString();

  return modifiedSince;
}
