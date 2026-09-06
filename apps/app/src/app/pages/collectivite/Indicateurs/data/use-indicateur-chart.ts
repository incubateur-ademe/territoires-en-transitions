import {
  IndicateurDefinitionListItem,
  useListIndicateurs,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useListIndicateurValeurs } from '@/app/indicateurs/valeurs/use-list-indicateur-valeurs';
import { PALETTE_LIGHT } from '@/app/ui/charts/echarts/constants';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  formatIndicateurPeriod,
  IndicateurPeriods,
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
    const objectifs = prepareData(
      rawData,
      'objectif',
      sourceFilter.avecDonneesCollectivite
    );
    // Groupe les indicateurs enfant par type de segmentation et conserve les
    // objectifs dont la segmentation n'existe pas dans les résultats.
    const segmentationsResultat = prepareEnfantsParSegmentation(
      definitionEnfants,
      valeursSegments,
      'resultat',
      sourceFilter.avecSecteursSNBC
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
        sourceFilter.avecSecteursSNBC
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

    const periodicite =
      rawData?.definition.periodicite ?? definition?.periodicite;
    const moyenne = periodicite
      ? prepareMoyenne(sourceFilter.moyenne, periodicite)
      : null;
    const resultats = prepareData(
      rawData,
      'resultat',
      sourceFilter.avecDonneesCollectivite,
      moyenne ? [moyenne] : []
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
    }),
    [definition, isLoading, preparedChart, sourceFilter]
  );
};

function prepareMoyenne(
  moyenne: IndicateurMoyenneOutput | undefined,
  periodicite: IndicateurPeriodicite
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
    valeurs: moyenne.valeurs.map((v) => {
      const periode = IndicateurPeriods.fromDateValeur(
        periodicite,
        v.dateValeur
      );
      return {
        id: -1,
        commentaire: null,
        calculAuto: true,
        periode,
        periodeLabel: formatIndicateurPeriod(periode),
        dateValeurISO: `${v.dateValeur}T00:00:00.000Z`,
        valeur: v.valeur,
      };
    }),
  };
}

// groupe les indicateurs enfants par type de segmentation
function prepareEnfantsParSegmentation(
  enfants: IndicateurDefinitionListItem[] | undefined,
  valeursSegments: ListIndicateurValeursOutput | undefined,
  type: 'objectif' | 'resultat',
  avecSecteursSNBC: boolean
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
    const data = prepareData(valeursEnfant, type, false);
    dataParId[enfant.id] = data;

    // sélectionne la source la plus appropriée
    const sourceValeursEnfant = data.sources
      // tri les sources par ordre d'affichage (si disponible)
      .sort(({ ordreAffichage: a }, { ordreAffichage: b }) =>
        a === null ? 1 : b === null ? -1 : a - b
      )
      .find(
        // il faut au moins 2 valeurs pour afficher une surface dans le graphe StackedArea
        (s) =>
          s.valeurs?.length > 1 &&
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
    const sourceValeursEnfant = data?.sources.find(
      (s) => s.source === bestSource
    );

    if (sourceValeursEnfant?.valeurs?.length) {
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
