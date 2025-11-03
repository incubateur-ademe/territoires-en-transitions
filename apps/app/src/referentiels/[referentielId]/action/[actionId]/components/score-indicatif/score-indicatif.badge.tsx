import { useIsScoreIndicatifEnabled } from '@/app/referentiels/comparisons/use-is-score-indicatif-enabled';
import { Badge } from '@/ui';
import { useGetScoreIndicatif } from './use-get-score-indicatif';

type Props = {
  actionId: string;
};

export const ScoreIndicatifBadge = ({ actionId }: Props) => {
  const { data, isLoading } = useGetScoreIndicatif(actionId);
  const isScoreIndicatifEnabled = useIsScoreIndicatifEnabled();
  if (!data || isLoading || !isScoreIndicatifEnabled) return null;

  const scoreIndicatif = data[actionId];
  if (!scoreIndicatif) return null;

  const nbIndicateurs = scoreIndicatif.indicateurs?.length;
  if (!nbIndicateurs) return null;

  return (
    <Badge
      title={`Score lié à ${
        nbIndicateurs > 1 ? 'des indicateurs' : 'un indicateur'
      }`}
      state="info"
      size="sm"
      uppercase={false}
      iconPosition="left"
      icon="line-chart-line"
    />
  );
};
