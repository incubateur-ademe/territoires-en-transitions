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
}: LevierSubtitleInput): string => {
  const impactLabel =
    impactIndex === undefined
      ? undefined
      : appLabels.impactPotentielEstime(impactIndex);
  const pertinenceLabel =
    pertinence === undefined
      ? undefined
      : appLabels.pertinenceLabel(pertinence);
  return [secteur, impactLabel, pertinenceLabel]
    .filter((part) => part !== undefined)
    .join(' · ');
};
