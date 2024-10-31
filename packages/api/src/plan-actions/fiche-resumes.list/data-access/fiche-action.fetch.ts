import { objectToCamel } from 'ts-case-convert';
import { DBClient } from '../../../typeUtils';
import { FicheAction } from '../../domain';
import { fetchFilteredIndicateurs } from '@tet/api/indicateurs';

const ficheActionColumns = [
  // 'id',
  // 'titre',
  // 'description',
  // 'piliers_eci',
  // 'statut',
  // 'collectivite_id',
  // 'modified_at',
  // 'date_fin_provisoire',
  // 'niveau_priorite',
  // 'cibles',
  // 'restreint',
  // 'amelioration_continue',
  // 'date_debut',
  // 'date_fin_provisoire',
  // 'budget_previsionnel',
  // 'resultats_attendus',
  // 'notes_complementaires',
  // 'objectifs',
  // 'ressources',
  // 'financements',
  // 'calendrier',
  '*',
];

type Props = {
  dbClient: DBClient;
  ficheActionId: number;
};

/**
 * Charge une fiche action avec son id.
 */
export async function ficheActionFetch({ dbClient, ficheActionId }: Props) {
  // 1. Ajoute les tables liées correspondant aux filtres
  // 👇

  const relatedTables = new Set<string>();

  // Toujours récupérer les pilotes liés à la fiche
  // relatedTables.add(
  //   'pilotes:fiche_action_pilote(personne_tag(nom, tag_id:id), user:dcp(prenom, nom, user_id))'
  // );

  // relatedTables.add('services:service_tag(*)');
  // relatedTables.add('structures:structure_tag(*)');
  // relatedTables.add('partenaires:partenaire_tag(*)');
  // relatedTables.add('actions:action_relation(*)');
  // relatedTables.add('plans:fiche_action_plan(*)');
  // relatedTables.add('thematiques:thematique(*)');
  // relatedTables.add('sous_thematiques:sous_thematique(*)');
  // relatedTables.add(
  //   'referents:fiche_action_referent(personne_tag(nom, tag_id:id), user:dcp(prenom, nom, user_id))'
  // );
  // relatedTables.add('financeurs:financeur_tag(*)');
  // relatedTables.add('indicateurs:indicateur_definition(*)');

  // 2. Crée la requête avec les tables liées
  // 👇

  const query = dbClient
    .from('fiches_action')
    .select([...ficheActionColumns, ...relatedTables].join(','))
    .eq('id', ficheActionId)
    .single();

  const { data, error } = await query;

  if (error) {
    console.error(error);
    throw error;
  }

  const rawFicheAction = objectToCamel(data) as unknown as FicheAction;

  const indicateurs = await fetchFilteredIndicateurs(
    dbClient,
    rawFicheAction.collectiviteId,
    {
      filtre: {
        ficheActionIds: [rawFicheAction.id],
        withChildren: true,
      },
    }
  );

  // Transforme les données pour les adapter au format attendu
  // 👇
  const ficheAction = {
    ...rawFicheAction,
    planId: rawFicheAction.plans?.[0]?.plan,
    indicateurs: indicateurs.data,
  };

  return ficheAction as FicheAction;
}
