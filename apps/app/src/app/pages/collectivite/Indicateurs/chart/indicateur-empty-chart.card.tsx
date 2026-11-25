import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import { EmptyCard } from '@tet/ui';
import type { ComponentProps, JSX } from 'react';

type Props = Pick<ComponentProps<typeof EmptyCard>, 'title' | 'actions'>;

export const IndicateurEmptyChartCard = ({
  title,
  actions,
}: Props): JSX.Element => (
  <EmptyCard
    size="xs"
    className="h-64 w-full"
    picto={(props) => <PictoIndicateurVide {...props} />}
    title={title}
    actions={actions}
  />
);
