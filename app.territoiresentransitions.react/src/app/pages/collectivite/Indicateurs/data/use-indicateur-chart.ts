import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { intersection } from 'es-toolkit';
import { useEffect, useState } from 'react';
import { PALETTE_LIGHT } from '../../../../../ui/charts/echarts';
import { useIndicateurDefinitions } from '../Indicateur/useIndicateurDefinition';
import { TIndicateurDefinition } from '../types';
import { prepareData, PreparedData } from './prepare-data';
import {
  ListIndicateurValeursOutput,
  useIndicateurValeurs,
} from './use-indicateur-valeurs';

const SEGMENTATIONS = ['secteur', 'vecteur', 'vecteur_filiere'];
const SEGMENTATION_PAR_DEFAUT = 'parDefaut';

export type IndicateurChartInfo = ReturnType<typeof useIndicateurChartInfo>;

/** Charge et prépare les données pour le graphe */
export const useIndicateurChartInfo = ({
  definition,
}: {
  definition?: TIndicateurDefinition;
}) => {
  const { id: indicateurId, estAgregation, enfants, unite } = definition ?? {};

  // charge les valeurs à afficher dans le graphe
  const collectiviteId = useCollectiviteId()!;
  const { data: valeurs, isLoading: isLoadingValeurs } = useIndicateurValeurs({
    collectiviteId,
    indicateurIds: indicateurId ? [indicateurId] : undefined,
  });

  // sépare objectifs et résultats
  const rawData = valeurs?.indicateurs?.[0];
  const objectifs = prepareData(rawData, 'objectif');
  const resultats = prepareData(rawData, 'resultat');

  // pour les agrégations il faut aussi charger les valeurs des sous-indicateurs
  const indicateurIds =
    estAgregation && enfants?.length ? enfants.map((e) => e.id) : [];
  const { data: valeursSegments, isLoading: isLoadingSegments } =
    useIndicateurValeurs({
      collectiviteId,
      indicateurIds,
    });

  // charge aussi les définitions détaillées des enfants pour avoir les
  // catégories permettant de faire la segmentation
  const { data: definitionEnfants, isLoading: isLoadingEnfants } =
    useIndicateurDefinitions(indicateurIds);

  // groupe les indicateurs enfant par type de segmentation (secteur,
  // vecteur...) et type de valeurs
  const enfantsParSegmentation = prepareEnfantsParSegmentation(
    definitionEnfants,
    valeursSegments,
    'resultat'
  );
  const objectifsParSegment = prepareEnfantsParSegmentation(
    definitionEnfants,
    valeursSegments,
    'objectif'
  );
  const segmentsResultats = enfantsParSegmentation.map(
    ({ segmentation: segment }) => segment
  );
  objectifsParSegment.forEach((objectifs) => {
    if (!segmentsResultats.includes(objectifs.segmentation)) {
      enfantsParSegmentation.push(objectifs);
    }
  });

  // conserve le type de segmentation sélectionné
  const segmentationParDefaut =
    enfantsParSegmentation?.[0]?.segmentation ?? undefined;
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
  const data = {
    unite,
    valeurs: { objectifs, resultats, segments },
  };

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
      a.identifiant && b.identifiant
        ? a.identifiant.localeCompare(b.identifiant)
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
    objectifs.donneesCollectivite.valeurs.length +
      resultats.donneesCollectivite.valeurs.length >
    0;

  // détermine si l'indicateur a au moins une valeur
  const hasValeur =
    objectifs.annees.length + resultats.annees.length > 0 || !!segments?.length;

  const isLoading = isLoadingValeurs || isLoadingSegments || isLoadingEnfants;
  return {
    definition,
    typesSegmentation,
    segmentation,
    setSegmentation,
    segmentItemParId,
    data,
    hasValeurCollectivite,
    hasValeur,
    isLoading,
  };
};

// groupe les indicateurs enfants par type de segmentation
function prepareEnfantsParSegmentation(
  enfants: TIndicateurDefinition[] | undefined,
  valeursSegments: ListIndicateurValeursOutput | undefined,
  type: 'objectif' | 'resultat'
) {
  const enfantsParSegmentation: Record<
    string,
    {
      definition: TIndicateurDefinition;
      source: PreparedData['sources'][number];
    }[]
  > = { [SEGMENTATION_PAR_DEFAUT]: [] };

  enfants?.forEach((enfant) => {
    // valeurs associées à l'indicateur
    const valeursEnfant = valeursSegments?.indicateurs.find(
      (ind) => ind.definition.id === enfant.id
    );

    if (!valeursEnfant) {
      return;
    }

    // et transformées pour l'affichage
    const data = prepareData(valeursEnfant, type);

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
          // et on n'affiche pas les objectifs de la SNBC
          s.source !== 'snbc'
      );

    if (sourceValeursEnfant) {
      // segmentations auxquelles est rattaché l'indicateur
      const segmentations = intersection(enfant.categories, SEGMENTATIONS);

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

export type IndicateursParSegment = ReturnType<
  typeof prepareEnfantsParSegmentation
>;
