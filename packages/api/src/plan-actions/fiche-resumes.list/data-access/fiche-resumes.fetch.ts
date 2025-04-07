import { DBClient } from '@/api/typeUtils';
import { trpc } from '@/api/utils/trpc/client';
import { endOfDay, startOfDay } from 'date-fns';
import { objectToCamel } from 'ts-case-convert';
import { z } from 'zod';
import { FicheResume } from '../../domain';
import {
  FetchOptions,
  Filtre as FiltreFicheActions,
  SortFichesAction,
  fetchOptionsSchema,
} from '../domain/fetch-options.schema';

const ficheActionColumns = [
  'id',
  'titre',
  'statut',
  'collectivite_id',
  'modified_at',
  'date_fin_provisoire',
  'priorite:niveau_priorite',
  'cibles',
  'restreint',
  'amelioration_continue',
  'date_debut',
  'budget_previsionnel',
];

type Props = {
  dbClient: DBClient;
  trpcUtils: ReturnType<typeof trpc.useUtils>;
  collectiviteId: number;
  options?: FetchOptions;
};

/**
 * Charge une liste de résumés de fiches actions en fonction des filtres en paramètres.
 */
export async function ficheResumesFetch({
  dbClient,
  trpcUtils,
  collectiviteId: unsafeCollectiviteId,
  options = { filtre: {} },
}: Props) {
  const collectiviteId = z.number().parse(unsafeCollectiviteId);
  const { filtre, sort, page, limit } = fetchOptionsSchema.parse(options);

  // 1. Ajoute les tables liées correspondant aux filtres
  // 👇

  const relatedTables = new Set<string>();

  // Toujours récupérer les pilotes liés à la fiche
  relatedTables.add('pilotes:fiche_action_pilote(*)');

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

  if (filtre.libreTagsIds?.length) {
    relatedTables.add('fiche_action_libre_tag!inner(*)');
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

  if (filtre.ficheActionIds?.length) {
    query.in('id', filtre.ficheActionIds);
  }

  if (filtre.planActionIds?.length) {
    query.not('plans', 'is', null);
    query.in('plans.plan', filtre.planActionIds);
  }

  if (filtre.referentielActionIds?.length) {
    query.or(
      filtre.referentielActionIds
        .map((id) => `action_id.like.${id}%`)
        .join(','),
      {
        referencedTable: 'fiche_action_action',
      }
    );
  }

  if (filtre.linkedFicheActionIds?.length) {
    query.or(
      `not.and(fiche_action_lien_1.is.null, fiche_action_lien_2.is.null)`
    );

    query.or(`fiche_deux.in.(${filtre.linkedFicheActionIds})`, {
      referencedTable: 'fiche_action_lien_1',
    });

    query.or(`fiche_une.in.(${filtre.linkedFicheActionIds})`, {
      referencedTable: 'fiche_action_lien_2',
    });

    query.not('id', 'in', `(${filtre.linkedFicheActionIds})`);
  }

  if (filtre.utilisateurPiloteIds?.length && filtre.personnePiloteIds?.length) {
    query.not('pilotes', 'is', null);
    query.or(
      `user_id.in.(${filtre.utilisateurPiloteIds.join(
        ','
      )}),tag_id.in.(${filtre.personnePiloteIds.join(',')})`,
      {
        referencedTable: 'pilotes',
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

  if (filtre.libreTagsIds?.length) {
    query.in('fiche_action_libre_tag.libre_tag_id', filtre.libreTagsIds);
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

  if (filtre.noPilote) {
    query.is('pilotes', null);
  }

  if (filtre.noServicePilote) {
    query.is('services', null);
  }

  if (filtre.noStatut) {
    query.is('statut', null);
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

  const addDateRange = (
    field: 'created_at' | 'modified_at' | 'date_debut' | 'date_fin_provisoire'
  ) => {
    if (filtre.debutPeriode)
      query.gte(field, startOfDay(new Date(filtre.debutPeriode)).toISOString());
    if (filtre.finPeriode)
      query.lte(field, endOfDay(new Date(filtre.finPeriode)).toISOString());
  };

  if (filtre.typePeriode) {
    switch (filtre.typePeriode) {
      case 'creation':
        addDateRange('created_at');
        break;

      case 'modification':
        addDateRange('modified_at');
        break;

      case 'debut':
        addDateRange('date_debut');
        break;

      case 'fin':
        addDateRange('date_fin_provisoire');
        break;
    }
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

  const personnes = await trpcUtils.collectivites.personnes.list.ensureData({
    collectiviteId,
    filter: {
      activeOnly: false,
    },
  });

  const fiches = data.map((fiche) => ({
    ...fiche,
    plan_id: fiche.plans?.[0]?.plan,
    pilotes: (fiche.pilotes as any[]).map(({ tag_id, user_id }) =>
      personnes.find((p) =>
        tag_id !== null ? p.tagId === tag_id : p.userId === user_id
      )
    ),
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
