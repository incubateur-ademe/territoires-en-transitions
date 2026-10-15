import { appLabels } from '@/app/labels/catalog';

type LevierSubtitleInput = {
  secteur: string;
  impactIndex?: number;
};

export const toLevierSubtitle = ({
  secteur,
  impactIndex,
}: LevierSubtitleInput): string =>
  impactIndex === undefined
    ? secteur
    : `${secteur} · ${appLabels.impactPotentielEstime(impactIndex)}`;
