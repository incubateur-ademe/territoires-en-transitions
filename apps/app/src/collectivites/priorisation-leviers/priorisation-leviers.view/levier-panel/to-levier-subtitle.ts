import { appLabels } from '@/app/labels/catalog';
import { Pertinence } from '@tet/domain/collectivites';

type LevierSubtitleInput = {
  secteur: string;
  impactIndex?: number;
  pertinence?: Pertinence;
};

export const toLevierSubtitle = ({
  secteur,
  impactIndex,
  pertinence,
}: LevierSubtitleInput): string =>
  [
    secteur,
    impactIndex === undefined
      ? undefined
      : appLabels.impactPotentielEstime(impactIndex),
    pertinence === undefined
      ? undefined
      : appLabels.pertinenceLabel(pertinence),
  ]
    .filter((part) => part !== undefined)
    .join(' · ');
