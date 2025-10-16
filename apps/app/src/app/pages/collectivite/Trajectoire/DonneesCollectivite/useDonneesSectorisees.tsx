import {
  ANNEE_REFERENCE_SNBC_V2,
  consommationsFinalesDataIsSufficient,
  DATE_DEBUT_SNBC_V2,
  emissionsGesDataIsSufficient,
  getIndicateurTrajectoireForValueInput,
  IndicateurAvecValeursParSource,
  IndicateurValeurGroupee,
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
    dateDebut: DATE_DEBUT_SNBC_V2,
    dateFin: `${ANNEE_REFERENCE_SNBC_V2}-12-31`,
  });

  // cas particulier : les données ALDO ne sont pas disponibles pour l'année de
  // référence (2015) mais pour l'année 2018
  // TODO: l'agrégation des données de référence devraient être réalisée dans le backend
  const { data: dataAldo, isLoading: isLoadingAldo } = useListIndicateurValeurs(
    {
      identifiantsReferentiel: secteurIds,
      sources: [SourceIndicateur.ALDO],
      dateDebut: '2018-01-01',
      dateFin: '2018-12-31',
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

  const dataCompletionStatus = isDataSufficientEnoughForAComputation(
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
  indicateur: IndicateurAvecValeursParSource,
  source: SourceIndicateur
): number | null => {
  return indicateur.sources[source]?.valeurs?.[0]?.resultat ?? null;
};

const isDataSufficientEnoughForAComputation = (
  id: IndicateurTrajectoireId,
  indicateurs: IndicateurAvecValeursParSource[],
  identifiants: string[]
): {
  isDataSufficient: boolean;
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
    return emissionsGesDataIsSufficient(values);
  }
  if (id === 'consommations_finales') {
    return consommationsFinalesDataIsSufficient(values);
  }

  return {
    isDataSufficient: true,
  };
};
