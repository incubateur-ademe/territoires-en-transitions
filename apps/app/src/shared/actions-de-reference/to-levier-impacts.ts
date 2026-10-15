import type { LevierPlace } from '@/app/collectivites/priorisation-leviers/priorisation-leviers.view/data/to-matrix-points';
import { appLabels } from '@/app/labels/catalog';
import { LEVIER_NOM_BY_ID, type LevierId } from '@tet/domain/shared';
import { sumBy } from 'es-toolkit';

type LevierImpact = {
  levierId: LevierId;
  levierNom: string;
  score: number;
};

type LevierImpactPlace = Pick<
  LevierPlace,
  'levierId' | 'potentielReduction' | 'impactIndex'
>;

const toLevierImpacts = ({
  places,
  levierIds,
}: {
  places: readonly LevierImpactPlace[];
  levierIds: readonly LevierId[];
}): LevierImpact[] => {
  const potentielTotal = sumBy(
    places,
    ({ potentielReduction }) => potentielReduction
  );
  if (potentielTotal <= 0) {
    return [];
  }
  return levierIds.flatMap((levierId) => {
    const place = places.find((candidate) => candidate.levierId === levierId);
    if (place === undefined) {
      return [];
    }
    return [
      {
        levierId,
        levierNom: LEVIER_NOM_BY_ID[levierId],
        score: place.impactIndex,
      },
    ];
  });
};

type LevierImpactLine = {
  levierId: LevierId;
  text: string;
};

const toLevierImpactLines = ({
  impacts,
  actionLevierCount,
}: {
  impacts: readonly LevierImpact[];
  actionLevierCount: number;
}): LevierImpactLine[] => {
  const hasSeveralLeviers = actionLevierCount > 1;
  return impacts.map(({ levierId, levierNom, score }) => ({
    levierId,
    text: hasSeveralLeviers
      ? appLabels.actionDeReferenceImpactValeurDuLevier({ levierNom, score })
      : appLabels.actionDeReferenceImpactValeur(score),
  }));
};

export { toLevierImpactLines, toLevierImpacts };
export type { LevierImpact, LevierImpactLine };
