import {
  DATE_DEBUT_SNBC_V2_REFERENCE,
  DATE_FIN_SNBC_V2_REFERENCE,
  getIndicateurTrajectoireForValueInput,
  hasEnoughConsommationsFinalesDataFromSource,
  hasEnoughEmissionsGesDataFromSource,
  IndicateurAvecValeursParSource,
  IndicateurValeurGroupee,
  SNBC_ALDO_DATE_DEBUT_REFERENCE,
  SNBC_ALDO_DATE_FIN_REFERENCE,
  SourceIndicateur,
  TrajectoirePropertiesType,
} from '@/domain/indicateurs';

import { Secteur } from '@/app/app/pages/collectivite/Trajectoire/DonneesCollectivite/TableauDonnees';
import { useListIndicateurValeurs } from '@/app/indicateurs/valeurs/use-list-indicateur-valeurs';
import {
  getNomSource,
  IndicateurTrajectoireId,
} from '../../../../../indicateurs/trajectoires/trajectoire-constants';

export type DonneesSectorisees = ReturnType<
  typeof useGetDonneesSectoriseesByIndicateurId
>['data'] & {
  isDataComplete: boolean;
};

type Source = {
  id: string;
  nom: string;
};

export const useDonneesSectorisees = () => {
  const { data: emissions_ges, isLoading: isLoadingEmissionsGes } =
    useGetDonneesSectoriseesByIndicateurId('emissions_ges');
  const {
    data: consommations_finales,
    isLoading: isLoadingConsommationsFinales,
  } = useGetDonneesSectoriseesByIndicateurId('consommations_finales');
  const {
    data: sequestration_carbone,
    isLoading: isLoadingSequestrationCarbone,
  } = useGetDonneesSectoriseesByIndicateurId('sequestration_carbone');

  const canComputeTrajectoire =
    emissions_ges.dataCompletionStatus.isDataSufficient &&
    consommations_finales.dataCompletionStatus.isDataSufficient &&
    sequestration_carbone.dataCompletionStatus.isDataSufficient;

  return {
    isLoading:
      isLoadingEmissionsGes ||
      isLoadingConsommationsFinales ||
      isLoadingSequestrationCarbone,
    donneesSectorisees: {
      emissions_ges,
      consommations_finales,
      sequestration_carbone,
    },
    canComputeTrajectoire,
  };
};

/** Charge les données sectorisées pour un onglet du dialogue "Lancer un calcul" */
const useGetDonneesSectoriseesByIndicateurId = (
  id: IndicateurTrajectoireId
): {
  isLoading: boolean;
  data: {
    indicateurTrajectoire: TrajectoirePropertiesType;
    indicateurs: IndicateurAvecValeursParSource[];
    secteurs: Secteur[];
    sources: Source[];
    dataCompletionStatus: {
      isDataSufficient: boolean;
      warningMessage?: string;
    };
  };
} => {
  const indicateurTrajectoire = getIndicateurTrajectoireForValueInput(id);
  const { secteurs, sources: requestedSources } = indicateurTrajectoire;
  const secteurIds = secteurs.map((s) => s.identifiant);

  const { data, isLoading: isLoadingSecteurs } = useListIndicateurValeurs({
    identifiantsReferentiel: secteurIds,
    sources: requestedSources,
    dateDebut: DATE_DEBUT_SNBC_V2_REFERENCE,
    dateFin: DATE_FIN_SNBC_V2_REFERENCE,
  });

  // cas particulier : les données ALDO ne sont pas disponibles pour l'année de
  // référence (2015) mais pour l'année 2018
  // TODO: l'agrégation des données de référence devraient être réalisée dans le backend
  const { data: dataAldo, isLoading: isLoadingAldo } = useListIndicateurValeurs(
    {
      identifiantsReferentiel: secteurIds,
      sources: [SourceIndicateur.ALDO],
      dateDebut: SNBC_ALDO_DATE_DEBUT_REFERENCE,
      dateFin: SNBC_ALDO_DATE_FIN_REFERENCE,
    },
    { enabled: requestedSources.includes(SourceIndicateur.ALDO) }
  );
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

  const dataCompletionStatus = isDataSufficientForATrajectoireComputation(
    id,
    indicateurs,
    secteurIds,
    requestedSources
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
  indicateur: IndicateurAvecValeursParSource,
  source: SourceIndicateur
): number | null => {
  return indicateur.sources[source]?.valeurs?.[0]?.resultat ?? null;
};

/**
 * Checks if data is sufficient for a trajectory computation.
 *
 * For each requested source, extract all values from that source and check
 * if it alone has enough data. Returns true if ANY source has sufficient data.
 */
const isDataSufficientForATrajectoireComputation = (
  id: IndicateurTrajectoireId,
  indicateurs: IndicateurAvecValeursParSource[],
  identifiants: string[],
  requestedSources: SourceIndicateur[]
): {
  isDataSufficient: boolean;
  warningMessage?: string;
} => {
  const dataChecker = {
    emissions_ges: hasEnoughEmissionsGesDataFromSource,
    consommations_finales: hasEnoughConsommationsFinalesDataFromSource,
    sequestration_carbone: () => ({ isDataSufficient: true }),
  };

  for (const source of requestedSources) {
    const valuesFromThisSource = identifiants.map((identifiant) => {
      const indicateur = indicateurs.find(
        (ind) => ind.definition.identifiantReferentiel === identifiant
      );
      if (!indicateur) {
        return null;
      }
      return extractValue(indicateur, source);
    });

    const check = dataChecker[id](valuesFromThisSource);
    if (check.isDataSufficient) {
      return check;
    }
  }

  return {
    isDataSufficient: false,
  };
};
