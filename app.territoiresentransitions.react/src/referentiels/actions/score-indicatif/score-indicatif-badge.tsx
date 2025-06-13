import { Badge } from '@/ui';

export const ScoreIndicatifBadge = ({
  nbIndicateurs,
}: {
  nbIndicateurs: number;
}) => (
  <Badge
    title={`Score lié à ${
      nbIndicateurs > 1 ? 'des indicateurs' : 'un indicateur'
    }`}
    state="info"
    uppercase={false}
    iconPosition="left"
    icon="line-chart-line"
  />
);
