import {
  consommationsFinalesAreExhaustiveEnough,
  emissionsGesAreExhaustiveEnough,
  SourceIndicateur,
} from '@/domain/indicateurs';

import { Secteur } from '@/app/app/pages/collectivite/Trajectoire/DonneesCollectivite/TableauDonnees';
import {
  ANNEE_REFERENCE,
  DATE_DEBUT,
  getIndicateurTrajectoireForValueInput,
  getNomSource,
  IndicateurTrajectoireForValueInput,
  IndicateurTrajectoireId,
} from '../../../../../indicateurs/trajectoires/trajectoire-constants';
import {
  IndicateurAvecValeursParSource,
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
): {
  isLoading: boolean;
  data: {
    indicateurTrajectoire: IndicateurTrajectoireForValueInput;
    indicateurs: IndicateurAvecValeursParSource[];
    secteurs: Secteur[];
    sources: Source[];
    dataCompletionStatus: {
      isExhaustiveEnough: boolean;
      warningMessage?: string;
    };
  };
} => {
  const indicateurTrajectoire = getIndicateurTrajectoireForValueInput(id);

  const { secteurs, sources: requestedSources } = indicateurTrajectoire;

  const secteurIds = secteurs.map((s) => s.identifiant);

  const { data, isLoading: isLoadingSecteurs } = useIndicateurValeurs({
    identifiantsReferentiel: secteurIds,
    sources: requestedSources,
    dateDebut: DATE_DEBUT,
    dateFin: `${ANNEE_REFERENCE}-12-31`,
  });

  // cas particulier : les données ALDO ne sont pas disponibles pour l'année de
  // référence (2015) mais pour l'année 2018
  // TODO: l'agrégation des données de référence devraient être réalisée dans le backend
  const { data: dataAldo, isLoading: isLoadingAldo } = useIndicateurValeurs({
    disabled: !requestedSources.includes(SourceIndicateur.ALDO),
    identifiantsReferentiel: secteurIds,
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

  const actualSourcesFromData = [
    ...new Set(indicateurs.flatMap((i) => Object.keys(i.sources))),
  ].map((id) => ({ id, nom: getNomSource(id) }));

  const sources = requestedSources
    .map((s) => actualSourcesFromData.find((sd) => sd.id === s))
    .filter((s) => !!s) as Source[];

  const dataCompletionStatus = isDataExhaustiveEnoughForAComputation(
    id,
    indicateurs,
    secteurIds
  );

  return {
    isLoading: isLoadingSecteurs || isLoadingAldo,
    data: {
      indicateurTrajectoire,
      indicateurs,
      secteurs,
      sources,
      dataCompletionStatus,
    },
  };
};

export type IndicateurAvecSources = {
  definition: { identifiantReferentiel: string };
  sources: Record<string, { valeurs?: IndicateurValeurGroupee[] }>;
};

const extractValue = (
  indicateur: IndicateurAvecSources,
  source: SourceIndicateur
): number | null => {
  return indicateur.sources[source]?.valeurs?.[0]?.resultat ?? null;
};

const isDataExhaustiveEnoughForAComputation = (
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
      extractValue(indicateur, SourceIndicateur.COLLECTIVITE) ||
      extractValue(indicateur, SourceIndicateur.RARE) ||
      extractValue(indicateur, SourceIndicateur.ALDO)
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
