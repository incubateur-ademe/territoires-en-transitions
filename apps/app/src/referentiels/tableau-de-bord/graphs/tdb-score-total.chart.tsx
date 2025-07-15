import { ReferentielId } from '@/domain/referentiels';
import { SnapshotJalonEnum } from '@/domain/referentiels/snapshots';
import { ScoreTotalEvolutionsChart } from '../../comparisons/evolutions-score-total.chart';
import { useListSnapshots } from '../../use-snapshot';
import { GraphCard } from './EtatDesLieuxGraphs';

type ScoreEvolutionsGraphsProps = {
  referentielId: ReferentielId;
  title: string;
  subTitle: string;
  href: string;
};

export const TdbScoreTotalChart = ({
  referentielId,
  title,
  subTitle,
  href,
}: ScoreEvolutionsGraphsProps) => {
  const { data } = useListSnapshots({
    referentielId,
    options: {
      jalons: [
        SnapshotJalonEnum.LABELLISATION_EMT,
        SnapshotJalonEnum.PRE_AUDIT,
        SnapshotJalonEnum.POST_AUDIT,
      ],
    },
  });

  if (!data?.length) {
    return <></>;
  }

  const last4Snapshots = data.slice(0, 4);

  return (
    <GraphCard
      title={title}
      subTitle={subTitle}
      href={href}
      renderGraph={() => (
        <ScoreTotalEvolutionsChart
          snapshots={last4Snapshots}
          chartSize="sm"
          referentielId={referentielId}
        />
      )}
    />
  );
};
