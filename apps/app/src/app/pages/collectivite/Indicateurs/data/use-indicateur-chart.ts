import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import {
  IndicateurDefinitionListItem,
  useListIndicateurDefinitions,
} from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import { useListIndicateurValeurs } from '@/app/indicateurs/valeurs/use-list-indicateur-valeurs';
import { getAnnee, PALETTE_LIGHT } from '@/app/ui/charts/echarts';
import { intersection } from 'es-toolkit';
import { useEffect, useState } from 'react';
import { typeCollectiviteOptions } from '../../../CollectivitesEngagees/data/filtreOptions';
import {
  getAnneesDistinctes,
  ListIndicateurValeursOutput,
  prepareData,
  PreparedData,
} from './prepare-data';
import { IndicateurMoyenneOutput } from './use-indicateur-moyenne';
import { useSourceFilter } from './use-source-filter';

export const SEGMENTATIONS = [
  'vecteur_filiere',
  'secteur',
  'vecteur',
  'filiere',
  'autre',
] as const;
const SEGMENTATION_PAR_DEFAUT = 'autre';

export type IndicateurChartInfo = ReturnType<typeof useIndicateurChartInfo>;

/** Charge et prépare les données pour le graphe */
export const useIndicateurChartInfo = ({
  definition,
  externalCollectiviteId,
}: {
  definition?: IndicateurDefinitionListItem;
  externalCollectiviteId?: number;
}) => {
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

  // sépare objectifs et résultats
  const rawData = valeurs?.indicateurs?.[0];
  const objectifs = prepareData(
    rawData,
    'objectif',
    sourceFilter.avecDonneesCollectivite
  );
  const resultats = prepareData(
    rawData,
    'resultat',
    sourceFilter.avecDonneesCollectivite
  );

  // pour les agrégations il faut aussi charger les valeurs des sous-indicateurs
  const indicateurIds =
    estAgregation && enfants?.length ? enfants.map((e) => e.id) : [];
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
  } = useListIndicateurDefinitions(
    {
      filters: {
        indicateurIds,
      },
    },
    { enabled: !!indicateurIds?.length }
  );

  // groupe les indicateurs enfant par type de segmentation (secteur,
  // vecteur...) et type de valeurs
  const enfantsParSegmentation = prepareEnfantsParSegmentation(
    definitionEnfants,
    valeursSegments,
    'resultat',
    sourceFilter.avecSecteursSNBC
  );
  const objectifsParSegment = prepareEnfantsParSegmentation(
    definitionEnfants,
    valeursSegments,
    'objectif',
    sourceFilter.avecSecteursSNBC
  );
  const segmentsResultats = enfantsParSegmentation.map(
    ({ segmentation: segment }) => segment
  );
  objectifsParSegment.forEach((objectifs) => {
    if (!segmentsResultats.includes(objectifs.segmentation)) {
      enfantsParSegmentation.push(objectifs);
    }
  });

  // la segmentation par défaut est la 1ère segmentation disponible dans l'ordre d'affichage voulu
  const segmentationParDefaut =
    SEGMENTATIONS.find((s) =>
      enfantsParSegmentation?.find((e) => e.segmentation === s)
    ) ?? undefined;

  // conserve le type de segmentation sélectionné
  const [segmentation, setSegmentation] = useState<string | undefined>(
    segmentationParDefaut
  );
  useEffect(() => {
    if (segmentationParDefaut) {
      setSegmentation(segmentationParDefaut);
    }
  }, [segmentationParDefaut]);

  // extrait les sous-indicateurs et leurs valeurs pour la segmentation courante
  const segments =
    enfantsParSegmentation?.find(
      ({ segmentation: segment }) => segment === segmentation
    )?.indicateurs || [];

  // extrait les types de segmentation disponibles
  const typesSegmentation = enfantsParSegmentation.map(
    ({ segmentation }) => segmentation
  );

  // génère la liste triée des sous-indicateurs pour que l'attribution des couleurs
  // reste constante, que les données par segment soient disponibles ou non
  const segmentItemParId = new Map<
    number,
    { id: number; name: string; color: string }
  >();
  definitionEnfants
    ?.sort((a, b) =>
      a.identifiantReferentiel && b.identifiantReferentiel
        ? a.identifiantReferentiel.localeCompare(b.identifiantReferentiel)
        : 0
    )
    .forEach(({ id, titreCourt, titre }, i) =>
      segmentItemParId.set(id, {
        id,
        name: titreCourt ?? titre,
        color: PALETTE_LIGHT[i % PALETTE_LIGHT.length],
      })
    );

  // détermine si l'indicateur a au moins une valeur résultat ou objectif saisie
  // par la collectivité
  const hasValeurCollectivite =
    (objectifs.donneesCollectivite?.valeurs.length ?? 0) +
      (resultats.donneesCollectivite?.valeurs.length ?? 0) >
    0;

  // ajoute une entrée dans le tableau des sources "résultats" pour la moyenne
  const moyenne = prepareMoyenne(sourceFilter.moyenne);
  if (moyenne) {
    resultats.sources.push(moyenne);
  }

  const data = {
    unite,
    valeurs: {
      objectifs: { ...objectifs, annees: getAnneesDistinctes(objectifs) },
      resultats: { ...resultats, annees: getAnneesDistinctes(resultats) },
      segments,
    },
  };

  // détermine si l'indicateur a au moins une valeur
  const valeursReference = sourceFilter.valeursReference;
  const hasValeur =
    data.valeurs.objectifs.annees.length +
      data.valeurs.resultats.annees.length >
      0 ||
    !!segments?.length ||
    !!moyenne?.valeurs?.length ||
    (valeursReference &&
      (valeursReference.cible !== null ||
        valeursReference.seuil !== null ||
        valeursReference.objectifs?.length));

  const isLoading = isLoadingValeurs || isLoadingSegments || isLoadingEnfants;

  return {
    definition,
    typesSegmentation,
    segmentation,
    setSegmentation,
    segmentItemParId,
    sourceFilter,
    data,
    hasValeurCollectivite,
    hasValeur,
    isLoading,
  };
};

function prepareMoyenne(moyenne: IndicateurMoyenneOutput | undefined) {
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
      const { annee, anneeISO } = getAnnee(v.dateValeur);
      return {
        id: -1,
        commentaire: null,
        calculAuto: true,
        annee,
        anneeISO,
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
) {
  const enfantsParSegmentation: Record<
    string,
    {
      definition: IndicateurDefinitionListItem;
      source: PreparedData['sources'][number];
    }[]
  > = { [SEGMENTATION_PAR_DEFAUT]: [] };

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
) => (a === null ? 1 : b === null ? -1 : a - b);

export type IndicateursParSegment = ReturnType<
  typeof prepareEnfantsParSegmentation
>;
