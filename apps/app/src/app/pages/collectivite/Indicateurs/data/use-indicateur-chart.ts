import {
  IndicateurDefinitionListItem,
  useListIndicateurs,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useListIndicateurValeurs } from '@/app/indicateurs/valeurs/use-list-indicateur-valeurs';
import { PALETTE_LIGHT } from '@/app/ui/charts/echarts/constants';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  aggregateIndicateurValeurs,
  formatIndicateurPeriod,
  getIndicateurSourcePeriodicite,
  type IndicateurAggregationOptions,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { intersection } from 'es-toolkit';
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';
import { typeCollectiviteOptions } from '../../../CollectivitesEngagees/data/filtreOptions';
import {
  ListIndicateurValeursOutput,
  prepareData,
  PreparedData,
} from './prepare-data';
import { IndicateurMoyenneOutput } from './use-indicateur-moyenne';
import { type SourceFilter, useSourceFilter } from './use-source-filter';
import { useIndicateurDisplayPeriodicite } from './use-indicateur-display-periodicite';

export const SEGMENTATIONS = [
  'vecteur_filiere',
  'secteur',
  'vecteur',
  'filiere',
  'autre',
] as const;
const SEGMENTATION_PAR_DEFAUT = 'autre';

type PreparedSegment = {
  definition: IndicateurDefinitionListItem;
  source: PreparedData['sources'][number];
};

type PreparedSegmentation = {
  segmentation: string;
  indicateurs: PreparedSegment[];
};

type IndicateurChartData = {
  unite: string | undefined;
  periodicite: IndicateurPeriodicite | undefined;
  valeurs: {
    objectifs: PreparedData;
    resultats: PreparedData;
    segments: PreparedSegment[];
  };
};

export type IndicateurChartInfo = {
  definition: IndicateurDefinitionListItem | undefined;
  typesSegmentation: string[];
  segmentation: string | undefined;
  setSegmentation: Dispatch<SetStateAction<string | undefined>>;
  segmentItemParId: Map<number, { id: number; name: string; color: string }>;
  sourceFilter: SourceFilter;
  data: IndicateurChartData;
  periodiciteAffichage: IndicateurPeriodicite | undefined;
  setPeriodiciteAffichage: (periodicite: IndicateurPeriodicite) => void;
  hasValeurCollectivite: boolean;
  hasValeur: boolean;
  isLoading: boolean;
};

/** Charge et prépare les données pour le graphe */
export const useIndicateurChartInfo = ({
  definition,
  externalCollectiviteId,
}: {
  definition?: IndicateurDefinitionListItem;
  externalCollectiviteId?: number;
}): IndicateurChartInfo => {
  const { id: indicateurId, estAgregation, enfants, unite } = definition ?? {};
  const currentCollectiviteId = useCollectiviteId();
  const dataCollectiviteId = externalCollectiviteId ?? currentCollectiviteId;
  const sourceFilter = useSourceFilter({
    periodicite: definition?.periodicite,
    collectiviteId: dataCollectiviteId,
    indicateurId: indicateurId ?? 0,
  });

  // charge les valeurs à afficher dans le graphe
  const { data: valeurs, isLoading: isLoadingValeurs } =
    useListIndicateurValeurs(
      {
        collectiviteId: dataCollectiviteId,
        indicateurIds: indicateurId ? [indicateurId] : undefined,
        sources: sourceFilter.sources,
      },
      {
        enabled: !!indicateurId,
      }
    );

  // Données brutes du parent, utilisées par le modèle de présentation.
  const rawData = valeurs?.indicateurs?.[0];
  const sourcePeriodicite = definition?.periodicite
    ? getIndicateurSourcePeriodicite(
        definition.periodicite,
        Object.values(rawData?.sources ?? {}).flatMap((source) =>
          source.valeurs.map((value) => value.periodicite)
        )
      )
    : undefined;
  const { periodiciteAffichage, setPeriodiciteAffichage } =
    useIndicateurDisplayPeriodicite({
      indicateurId,
      collectiviteId: dataCollectiviteId,
      periodicite: sourcePeriodicite,
      defaultPeriodicite: definition?.periodicite,
    });

  // pour les agrégations il faut aussi charger les valeurs des sous-indicateurs
  const indicateurIds = useMemo(
    () => (estAgregation && enfants?.length ? enfants.map(({ id }) => id) : []),
    [enfants, estAgregation]
  );
  const { data: valeursSegments, isLoading: isLoadingSegments } =
    useListIndicateurValeurs(
      {
        collectiviteId: dataCollectiviteId,
        indicateurIds,
        sources: sourceFilter.sources,
      },
      {
        enabled: !!indicateurIds?.length,
      }
    );

  // charge aussi les définitions détaillées des enfants pour avoir les
  // catégories permettant de faire la segmentation
  const {
    data: { data: definitionEnfants } = {},
    isLoading: isLoadingEnfants,
  } = useListIndicateurs(
    {
      collectiviteId: dataCollectiviteId,
      filters: {
        indicateurIds,
      },
    },
    { enabled: !!indicateurIds?.length }
  );

  // conserve le type de segmentation sélectionné
  const [selectedSegmentation, setSegmentation] = useState<
    string | undefined
  >();

  const preparedChart = useMemo(() => {
    const displayOptions = periodiciteAffichage
      ? {
          periodiciteAffichage,
          aggregationResultat: definition?.aggregationResultat,
          aggregationObjectif: definition?.aggregationObjectif,
        }
      : undefined;
    const objectifs = prepareData(
      rawData,
      'objectif',
      sourceFilter.avecDonneesCollectivite,
      [],
      displayOptions
    );
    // Groupe les indicateurs enfant par type de segmentation et conserve les
    // objectifs dont la segmentation n'existe pas dans les résultats.
    const segmentationsResultat = prepareEnfantsParSegmentation(
      definitionEnfants,
      valeursSegments,
      'resultat',
      sourceFilter.avecSecteursSNBC,
      displayOptions
    );
    const knownSegmentations = new Set(
      segmentationsResultat.map(({ segmentation }) => segmentation)
    );
    const enfantsParSegmentation = [
      ...segmentationsResultat,
      ...prepareEnfantsParSegmentation(
        definitionEnfants,
        valeursSegments,
        'objectif',
        sourceFilter.avecSecteursSNBC,
        displayOptions
      ).filter(({ segmentation }) => !knownSegmentations.has(segmentation)),
    ];

    const segmentationParDefaut = SEGMENTATIONS.find((candidate) =>
      enfantsParSegmentation.some(
        ({ segmentation }) => segmentation === candidate
      )
    );
    const segmentation = enfantsParSegmentation.some(
      ({ segmentation }) => segmentation === selectedSegmentation
    )
      ? selectedSegmentation
      : segmentationParDefaut;
    const segments =
      enfantsParSegmentation.find(
        ({ segmentation: candidate }) => candidate === segmentation
      )?.indicateurs ?? [];

    const segmentItemParId = new Map<
      number,
      { id: number; name: string; color: string }
    >();
    definitionEnfants
      ?.toSorted((left, right) =>
        left.identifiantReferentiel && right.identifiantReferentiel
          ? left.identifiantReferentiel.localeCompare(
              right.identifiantReferentiel
            )
          : 0
      )
      .forEach(({ id, titreCourt, titre }, index) =>
        segmentItemParId.set(id, {
          id,
          name: titreCourt ?? titre,
          color: PALETTE_LIGHT[index % PALETTE_LIGHT.length],
        })
      );

    const periodicite = sourcePeriodicite;
    const moyenne = periodicite
      ? prepareMoyenne(
          sourceFilter.moyenne,
          definition?.periodicite ?? periodicite,
          displayOptions
        )
      : null;
    const resultats = prepareData(
      rawData,
      'resultat',
      sourceFilter.avecDonneesCollectivite,
      moyenne ? [moyenne] : [],
      displayOptions
    );
    const hasValeurCollectivite =
      (objectifs.donneesCollectivite?.valeurs.length ?? 0) +
        (resultats.donneesCollectivite?.valeurs.length ?? 0) >
      0;
    const valeursReference = sourceFilter.valeursReference;

    return {
      typesSegmentation: enfantsParSegmentation.map(
        ({ segmentation }) => segmentation
      ),
      segmentation,
      segmentItemParId,
      data: {
        unite,
        periodicite,
        valeurs: { objectifs, resultats, segments },
      },
      hasValeurCollectivite,
      hasValeur: Boolean(
        (rawData?.totalFilledValeursCount ?? 0) > 0 ||
          segments.length > 0 ||
          Boolean(moyenne?.valeurs?.length) ||
          (valeursReference &&
            (valeursReference.cible !== null ||
              valeursReference.seuil !== null ||
              valeursReference.objectifs?.length))
      ),
    };
  }, [
    definition?.periodicite,
    definition?.aggregationResultat,
    definition?.aggregationObjectif,
    periodiciteAffichage,
    sourcePeriodicite,
    definitionEnfants,
    rawData,
    selectedSegmentation,
    sourceFilter.avecDonneesCollectivite,
    sourceFilter.avecSecteursSNBC,
    sourceFilter.moyenne,
    sourceFilter.valeursReference,
    unite,
    valeursSegments,
  ]);

  const isLoading = isLoadingValeurs || isLoadingSegments || isLoadingEnfants;

  return useMemo(
    () => ({
      definition,
      ...preparedChart,
      setSegmentation,
      sourceFilter,
      isLoading,
      periodiciteAffichage,
      setPeriodiciteAffichage,
    }),
    [
      definition,
      isLoading,
      preparedChart,
      sourceFilter,
      periodiciteAffichage,
      setPeriodiciteAffichage,
    ]
  );
};

function prepareMoyenne(
  moyenne: IndicateurMoyenneOutput | undefined,
  periodicite: IndicateurPeriodicite,
  displayOptions?: IndicateurAggregationOptions
): PreparedData['sources'][number] | null {
  if (!moyenne?.valeurs?.length) return null;

  const libelleType =
    typeCollectiviteOptions.find((tc) => tc.value === moyenne.typeCollectivite)
      ?.label || moyenne.typeCollectivite;

  const source = moyenne.valeurs[0]?.sourceLibelle;

  return {
    libelle: 'Moyenne des collectivités de même type',
    type: 'resultat' as const,
    calculAuto: true,
    metadonnees: [
      {
        id: -1,
        sourceId: 'moyenne',
        dateVersion: '',
        nomDonnees: `Moyenne basée sur l’open data ${
          source ?? ''
        } des collectivités de type "${libelleType}", inscrites sur Territoires en Transitions`,
        diffuseur: null,
        producteur: null,
        methodologie: null,
        limites: null,
      },
    ],
    ordreAffichage: null,
    source: 'moyenne',
    valeurs: aggregateIndicateurValeurs(
      moyenne.valeurs.map((value) => ({
        ...value,
        periodicite,
        resultat: value.valeur,
      })),
      { periodiciteAffichage: periodicite, ...displayOptions }
    ).map((value) => ({
      id: undefined,
      commentaire: null,
      calculAuto: true,
      periode: value.period,
      periodeLabel: formatIndicateurPeriod(value.period),
      dateValeurISO: `${value.dateValeur}T00:00:00.000Z`,
      valeur: value.resultat,
      isAggregated: value.isAggregated,
    })),
  };
}

// groupe les indicateurs enfants par type de segmentation
function prepareEnfantsParSegmentation(
  enfants: IndicateurDefinitionListItem[] | undefined,
  valeursSegments: ListIndicateurValeursOutput | undefined,
  type: 'objectif' | 'resultat',
  avecSecteursSNBC: boolean,
  displayOptions?: IndicateurAggregationOptions
): PreparedSegmentation[] {
  const enfantsParSegmentation: Record<string, PreparedSegment[]> = {
    [SEGMENTATION_PAR_DEFAUT]: [],
  };

  const dataParId: Record<number, PreparedData> = {};
  const sources: Array<{ source: string; ordreAffichage: number | null }> = [];

  // recherche la source la plus appropriée pour chaque sous-indicateur
  enfants?.forEach((enfant) => {
    // valeurs associées à l'indicateur
    const valeursEnfant = valeursSegments?.indicateurs.find(
      (ind) => ind.definition.id === enfant.id
    );

    if (!valeursEnfant) {
      return;
    }

    // et transformées pour l'affichage
    const data = prepareData(
      valeursEnfant,
      type,
      false,
      [],
      displayOptions
        ? {
            ...displayOptions,
            aggregationResultat: enfant.aggregationResultat,
            aggregationObjectif: enfant.aggregationObjectif,
          }
        : undefined
    );
    dataParId[enfant.id] = data;

    // sélectionne la source la plus appropriée
    const sourceValeursEnfant = data.sources
      // tri les sources par ordre d'affichage (si disponible)
      .sort(({ ordreAffichage: a }, { ordreAffichage: b }) =>
        a === null ? 1 : b === null ? -1 : a - b
      )
      .find(
        (s) =>
          s.valeurs.some((value) => value.valeur != null) &&
          // et on n'affiche pas les objectifs de la SNBC à part si le filtre
          // SNBC est le seul sélectionné
          (s.source !== 'snbc' || avecSecteursSNBC)
      );

    if (sourceValeursEnfant) {
      const { source, ordreAffichage } = sourceValeursEnfant;
      sources.push({ source, ordreAffichage });
    }
  });

  // puis sélectionne la meilleure source par ordre d'affichage
  const bestSource = sources.sort(parOrdreAffichage)[0]?.source;
  if (!bestSource) return [];

  // ventile les données par segmentation pour chaque indicateur
  enfants?.forEach((enfant) => {
    const data = dataParId[enfant.id];

    // sélectionne les données pour la source voulue
    const sourcesValeursEnfant =
      data?.sources.filter(
        (source) =>
          source.source === bestSource &&
          source.valeurs.some((value) => value.valeur != null)
      ) ?? [];

    for (const sourceValeursEnfant of sourcesValeursEnfant) {
      // segmentations auxquelles est rattaché l'indicateur
      const categorieNames = enfant.categories?.map((c) => c.nom) ?? [];
      const segmentations = intersection(categorieNames, SEGMENTATIONS);

      // assigne l'indicateur au(x) segmentation(s) appropriée(s)
      const source = { definition: enfant, source: sourceValeursEnfant };
      if (segmentations.length) {
        segmentations.forEach((segmentation) => {
          if (!enfantsParSegmentation[segmentation])
            enfantsParSegmentation[segmentation] = [];
          enfantsParSegmentation[segmentation].push(source);
        });
      } else {
        enfantsParSegmentation[SEGMENTATION_PAR_DEFAUT].push(source);
      }
    }
  });

  // renvoi le résultat sous forme de tableau
  return Object.entries(enfantsParSegmentation)
    .filter(([, indicateurs]) => indicateurs?.length)
    .map(([segmentation, indicateurs]) => ({ segmentation, indicateurs }));
}

type ItemSource = { ordreAffichage: number | null };
const parOrdreAffichage = (
  { ordreAffichage: a }: ItemSource,
  { ordreAffichage: b }: ItemSource
) => (a === b ? 0 : a === null ? 1 : b === null ? -1 : a - b);
