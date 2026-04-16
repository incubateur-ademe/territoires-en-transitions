import { appLabels } from '@/app/labels/catalog';
import { Etoile } from '@tet/domain/referentiels';

export const numLabels: Record<Etoile, string> = {
  1: appLabels.etoilePremiere,
  2: appLabels.etoileDeuxieme,
  3: appLabels.etoileTroisieme,
  4: appLabels.etoileQuatrieme,
  5: appLabels.etoileCinquieme,
};
