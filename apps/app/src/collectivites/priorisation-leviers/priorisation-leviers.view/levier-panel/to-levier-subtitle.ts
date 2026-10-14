import { appLabels } from '@/app/labels/catalog';

type LevierSubtitleInput = {
  secteur: string;
  potentielScore?: number;
};

export const toLevierSubtitle = ({
  secteur,
  potentielScore,
}: LevierSubtitleInput): string =>
  potentielScore === undefined
    ? secteur
    : `${secteur} · ${appLabels.impactPotentielEstime(potentielScore)}`;
