import {
  DEFAULT_SEGMENTATION,
  IndicateurAvecValeursParSource,
  IndicateurSegmentation,
  IndicateurValeurTypeEnum,
  ORDERED_SEGMENTATIONS,
} from '@tet/domain/indicateurs';
import { intersection, isNil } from 'es-toolkit';
import { IndicateurListItem } from '../indicateurs/list-indicateurs/list-indicateurs.output';

type IndicateursBySegmentation = Partial<
  Record<IndicateurSegmentation, number[]>
>;

export const groupIndicateursByOrderedSegmentation = (
  childDefinitions: IndicateurListItem[]
): Readonly<{
  orderedAvailableSegmentations: IndicateurSegmentation[];
  indicateursBySegmentation: IndicateursBySegmentation;
}> => {
  const indicateursBySegmentation =
    childDefinitions.reduce<IndicateursBySegmentation>((acc, definition) => {
      const foundSegmentations = intersection(
        definition.categories?.map(({ nom }) => nom) ?? [],
        ORDERED_SEGMENTATIONS
      ) as IndicateurSegmentation[];
      const segmentations: IndicateurSegmentation[] = foundSegmentations.length
        ? foundSegmentations
        : [DEFAULT_SEGMENTATION];
      segmentations.forEach((segmentation) => {
        (acc[segmentation] ??= []).push(definition.id);
      });
      return acc;
    }, {});

  return {
    orderedAvailableSegmentations: ORDERED_SEGMENTATIONS.filter(
      (segmentation) => indicateursBySegmentation[segmentation]
    ),
    indicateursBySegmentation,
  };
};

export const selectBestIndicateurSourceValeurType = (
  indicateurs: IndicateurAvecValeursParSource[],
  requestedSource?: string,
  requestedValeurType?: 'resultat' | 'objectif'
): { source: string; valeurType: 'resultat' | 'objectif' } | null => {
  const candidates = indicateurs.reduce<
    Record<
      string,
      {
        source: string;
        valeurType: 'resultat' | 'objectif';
        count: number;
      }
    >
  >((acc, indicateur) => {
    const sources = requestedSource
      ? [requestedSource]
      : Object.keys(indicateur.sources);
    const valeurTypes = requestedValeurType
      ? [requestedValeurType]
      : [IndicateurValeurTypeEnum.RESULTAT, IndicateurValeurTypeEnum.OBJECTIF];

    sources.forEach((source) => {
      valeurTypes.forEach((valeurType) => {
        const key = `${source}-${valeurType}`;
        acc[key] ??= { source, valeurType, count: 0 };
        acc[key].count +=
          indicateur.sources[source]?.valeurs.filter(
            (valeur) => !isNil(valeur[valeurType])
          ).length ?? 0;
      });
    });
    return acc;
  }, {});

  const bestCandidate = Object.values(candidates).sort(
    (a, b) => b.count - a.count
  )[0];
  return bestCandidate
    ? {
        source: bestCandidate.source,
        valeurType: bestCandidate.valeurType,
      }
    : null;
};
