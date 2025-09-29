import {
  consommationsFinalesAreExhaustiveEnough,
  emissionsGesAreExhaustiveEnough,
} from '@/domain/indicateurs';

import {
  ANNEE_REFERENCE,
  DATE_DEBUT,
  getIndicateurTrajectoireForValueInput,
  getNomSource,
  IndicateurTrajectoireId,
  SourceIndicateur,
} from '../../../../../indicateurs/trajectoires/trajectoire-constants';
import {
  IndicateurValeurGroupee,
  useIndicateurValeurs,
} from '../useIndicateurValeurs';

export type DonneesSectorisees = ReturnType<
  typeof useGetDonneesSectoriseesByIndicateurId
>;

type Source = {
  id: string;
  nom: string;
};

/** Charge les données
 *  sectorisées pour le dialogue "Lancer un calcul" */
export const useDonneesSectorisees = () => {
  // charge les données de chaque onglet
  const donneesSectorisees: Record<
    IndicateurTrajectoireId,
    DonneesSectorisees
  > = {
    emissions_ges: useGetDonneesSectoriseesByIndicateurId('emissions_ges'),
    consommations_finales: useGetDonneesSectoriseesByIndicateurId(
      'consommations_finales'
    ),
    sequestration_carbone: useGetDonneesSectoriseesByIndicateurId(
      'sequestration_carbone'
    ),
  };

  return {
    donneesSectorisees,
  };
};

/** Charge les données sectorisées pour un onglet du dialogue "Lancer un calcul" */
const useGetDonneesSectoriseesByIndicateurId = (
  id: IndicateurTrajectoireId
) => {
  const indicateurTrajectoire = getIndicateurTrajectoireForValueInput(id);

  const { secteurs, sources: requestedSources } = indicateurTrajectoire;

  const identifiants = secteurs.map((s) => s.identifiant);

  const { data, ...rest } = useIndicateurValeurs({
    identifiantsReferentiel: identifiants,
    sources: requestedSources,
    dateDebut: DATE_DEBUT,
    dateFin: `${ANNEE_REFERENCE}-12-31`,
  });

  // cas particulier : les données ALDO ne sont pas disponibles pour l'année de
  // référence (2015) mais pour l'année 2018
  // TODO: l'agrégation des données de référence devraient être réalisée dans le backend
  const { data: dataAldo } = useIndicateurValeurs({
    disabled: !requestedSources.includes(SourceIndicateur.ALDO),
    identifiantsReferentiel: identifiants,
    sources: [SourceIndicateur.ALDO],
    dateDebut: '2018-01-01',
    dateFin: '2018-12-31',
  });
  const indicateurs = data?.indicateurs ?? [];
  if (dataAldo?.indicateurs?.length && indicateurs.length) {
    // fusionne les données ALDO avec les autres sources
    dataAldo.indicateurs.forEach((indSourceAldo) => {
      if (indSourceAldo.sources[SourceIndicateur.ALDO]) {
        const indicateur = indicateurs.find(
          (ind) => ind.definition.id === indSourceAldo.definition.id
        );
        if (indicateur) {
          indicateur.sources = {
            ...indicateur.sources,
            ...indSourceAldo.sources,
          };
        }
      }
    });
  }

  // sources distinctes disponibles
  const actualSourcesFromData = [
    ...new Set(indicateurs.flatMap((i) => Object.keys(i.sources))),
  ].map((id) => ({ id, nom: getNomSource(id) }));

  const sources = requestedSources
    .map((s) => actualSourcesFromData.find((sd) => sd.id === s))
    .filter((s) => !!s) as Source[];

  // pour chaque indicateur, détermine s'il existe une valeur saisie par la collectivité OU une valeur open data
  const dataCompletionStatus = checkDataCompletion(
    id,
    indicateurs,
    identifiants
  );

  // prépare les données pour le composant TableauDonnees
  const valeursSecteurs = identifiants?.map((identifiant) => {
    const ind = indicateurs?.find(
      (i) => i.definition.identifiantReferentiel === identifiant
    );
    const indicateurId = ind?.definition.id;
    return indicateurId
      ? {
          indicateurId,
          identifiant,
          valeurs: ind
            ? Object.entries(ind.sources).map(([source, { valeurs }]) => ({
                source,
                valeur: valeurs?.[0].resultat ?? valeurs?.[0].objectif ?? null,
                id: valeurs?.[0].id,
              }))
            : [],
        }
      : undefined;
  });

  return {
    ...rest,
    data: {
      indicateurTrajectoire,
      indicateurs,
      secteurs,
      sources,
      valeursSecteurs,
      dataCompletionStatus,
    },
  };
};

type IndicateurAvecSources = {
  definition: { identifiantReferentiel: string };
  sources: Record<string, { valeurs?: IndicateurValeurGroupee[] }>;
};

const checkDataCompletion = (
  id: IndicateurTrajectoireId,
  indicateurs: IndicateurAvecSources[],
  identifiants: string[]
): {
  isExhaustiveEnough: boolean;
  warningMessage?: string;
} => {
  const values = identifiants.map((identifiant) => {
    const indicateur = indicateurs.find(
      (ind) => ind.definition.identifiantReferentiel === identifiant
    );
    if (!indicateur) {
      return null;
    }
    return (
      (indicateur.sources[SourceIndicateur.COLLECTIVITE]?.valeurs?.[0]
        ?.resultat ||
        indicateur.sources[SourceIndicateur.RARE]?.valeurs?.[0]?.resultat) ??
      null
    );
  });

  if (id === 'emissions_ges') {
    return emissionsGesAreExhaustiveEnough(values);
  }
  if (id === 'consommations_finales') {
    return consommationsFinalesAreExhaustiveEnough(values);
  }

  return {
    isExhaustiveEnough: true,
  };
};
