import { DBClient } from '@/api/typeUtils';
import { objectToCamel } from 'ts-case-convert';

import {
  FiltreRessourceLiees,
  FiltreValues,
  filtreRessourceLieesSchema,
} from '@/domain/shared';

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
}: Input): Promise<{ data: FiltreValues }> {
  const filtre = filtreRessourceLieesSchema.parse(unsafeFiltre);

  try {
    // 1. Ajoute les tables liées correspondant aux filtres
    // 👇

    const relatedTables = new Set<string>();

    if (filtre.planActionIds?.length) {
      relatedTables.add('planActions:axe!inner(*)');
    }

    if (filtre.utilisateurPiloteIds?.length) {
      relatedTables.add('utilisateurPilotes:collectivite_utilisateur!inner(*)');
    }

    if (filtre.personnePiloteIds?.length) {
      relatedTables.add('personnePilotes:personne_tag!inner(*)');
    }

    if (filtre.utilisateurReferentIds?.length) {
      relatedTables.add(
        'utilisateurReferents:collectivite_utilisateur!inner(*)'
      );
    }

    if (filtre.personneReferenteIds?.length) {
      relatedTables.add('personneReferentes:personne_tag!inner(*)');
    }

    if (filtre.structurePiloteIds?.length) {
      relatedTables.add('structurePilotes:structure_tag!inner(*)');
    }

    if (filtre.libreTagsIds?.length) {
      relatedTables.add('libreTags:libre_tag!inner(*)');
    }

    if (filtre.servicePiloteIds?.length) {
      relatedTables.add(
        'servicePilotes:service_tag!service_tag_collectivite_id_fkey!inner(*)'
      );
    }

    if (filtre.thematiqueIds?.length) {
      relatedTables.add('thematiques:collectivite_thematique!inner(*)');
    }

    if (filtre.financeurIds?.length) {
      relatedTables.add('financeurs:financeur_tag!inner(*)');
    }

    if (filtre.partenaireIds?.length) {
      relatedTables.add('partenaires:partenaire_tag!inner(*)');
    }

    if (relatedTables.size === 0) {
      return { data: {} };
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
      query.in('axe.id', filtre.planActionIds);
    }

    if (filtre.utilisateurPiloteIds?.length) {
      query.in('collectivite_utilisateur.user_id', filtre.utilisateurPiloteIds);
    }

    if (filtre.personnePiloteIds?.length) {
      query.in('personne_tag.id', filtre.personnePiloteIds);
    }

    if (filtre.utilisateurReferentIds?.length) {
      query.in(
        'collectivite_utilisateur.user_id',
        filtre.utilisateurReferentIds
      );
    }

    if (filtre.personneReferenteIds?.length) {
      query.in('personne_tag.id', filtre.personneReferenteIds);
    }

    if (filtre.structurePiloteIds?.length) {
      query.in('structure_tag.id', filtre.structurePiloteIds);
    }

    if (filtre.libreTagsIds?.length) {
      query.in('libre_tag.id', filtre.libreTagsIds);
    }

    if (filtre.servicePiloteIds?.length) {
      query.in('service_tag.id', filtre.servicePiloteIds);
    }

    if (filtre.thematiqueIds?.length) {
      query.in('collectivite_thematique.id', filtre.thematiqueIds);
    }

    if (filtre.financeurIds?.length) {
      query.in('financeur_tag.id', filtre.financeurIds);
    }

    if (filtre.partenaireIds?.length) {
      query.in('partenaire_tag.id', filtre.partenaireIds);
    }

    const { data: rawData, error } = await query.single();

    if (error) {
      throw error;
    }

    const data = objectToCamel(rawData) as FiltreValues;

    return { data };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
