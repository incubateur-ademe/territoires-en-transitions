import {objectToCamel} from 'ts-case-convert';
import {DBClient} from '../../../typeUtils';
import {useQuery} from 'react-query';

import {
  FiltreRessourceLiees,
  FiltreValues,
  filtreRessourceLieesSchema,
} from '../domain/filtre_ressource_liees.schema';

type Input = {
  dbClient: DBClient;
  collectiviteId: number;
  filtre: FiltreRessourceLiees;
};

/**
 * Fetch les valeurs du filtre de fetch de fiches actions
 */
export async function filtreValuesFetch({
  dbClient,
  collectiviteId,
  filtre: unsafeFiltre,
}: Input): Promise<{data: FiltreValues}> {
  const filtre = filtreRessourceLieesSchema.parse(unsafeFiltre);

  try {
    // 1. Ajoute les tables liées correspondant aux filtres
    // 👇

    const relatedTables = new Set<string>();

    if (filtre.planActionIds?.length) {
      relatedTables.add('planActions:collectivite_axe!inner(*)');
    }

    if (filtre.utilisateurPiloteIds?.length) {
      relatedTables.add('utilisateurPilotes:collectivite_utilisateur!inner(*)');
    }

    if (filtre.personnePiloteIds?.length) {
      relatedTables.add('personnePilotes:collectivite_personne_tag!inner(*)');
    }

    if (filtre.structurePiloteIds?.length) {
      relatedTables.add('structurePilotes:collectivite_structure_tag!inner(*)');
    }

    if (filtre.servicePiloteIds?.length) {
      relatedTables.add('servicePilotes:collectivite_service_tag!inner(*)');
    }

    if (filtre.thematiqueIds?.length) {
      relatedTables.add('thematiques:collectivite_thematique!inner(*)');
    }

    if (relatedTables.size === 0) {
      return {data: {}};
    }

    // 2. Crée la requête avec les tables liées
    // 👇

    const query = dbClient
      .from('collectivite')
      .select([...relatedTables].join(','))
      .eq('id', collectiviteId)
      .limit(1);

    // 3. Ajoute les clauses correspondant aux filtres
    // 👇

    if (filtre.planActionIds?.length) {
      query.in('collectivite_axe.id', filtre.planActionIds);
    }

    if (filtre.utilisateurPiloteIds?.length) {
      query.in('collectivite_utilisateur.user_id', filtre.utilisateurPiloteIds);
    }

    if (filtre.personnePiloteIds?.length) {
      query.in('collectivite_personne_tag.id', filtre.personnePiloteIds);
    }

    if (filtre.structurePiloteIds?.length) {
      query.in('collectivite_structure_tag.id', filtre.structurePiloteIds);
    }

    if (filtre.servicePiloteIds?.length) {
      query.in('collectivite_service_tag.id', filtre.servicePiloteIds);
    }

    if (filtre.thematiqueIds?.length) {
      query.in('collectivite_thematique.id', filtre.thematiqueIds);
    }

    const {data: rawData, error} = await query.single();

    if (error) {
      throw error;
    }

    const data = objectToCamel(rawData) as FiltreValues;

    return {data};
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const useFiltreValuesFetch = ({
  dbClient,
  collectiviteId,
  filtre,
}: Input) => {
  const {data} = useQuery(
    ['collectivite_filtre_values', collectiviteId, filtre],
    () =>
      filtreValuesFetch({
        dbClient,
        collectiviteId,
        filtre,
      })
  );

  return data;
};
