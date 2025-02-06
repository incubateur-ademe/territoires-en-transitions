import { ReferentielId } from '@/domain/referentiels';
import ScoreTotalEvolutionsChart from '../../evolutions/charts/ScoreTotalEvolutionsChart';
import { SnapshotDetails, useSnapshotList } from '../../use-snapshot';
import { GraphCard } from './EtatDesLieuxGraphs';

type ScoreEvolutionsGraphsProps = {
  referentiel: ReferentielId;
  title: string;
  subTitle: string;
  href: string;
};

const ScoreEvolutionsGraphs = ({
  referentiel,
  title,
  subTitle,
  href,
}: ScoreEvolutionsGraphsProps): JSX.Element => {
  const { data: snapshotList } = useSnapshotList({
    referentielId: referentiel,
  });

  const snapshots = organizeSnaps(snapshotList?.snapshots ?? []);

  return (
    <GraphCard
      title={title}
      subTitle={subTitle}
      href={href}
      renderGraph={() => <ScoreTotalEvolutionsChart allSnapshots={snapshots} />}
    />
  );
};

const organizeSnaps = (snapshots: SnapshotDetails[]) => {
  const snapsWithoutScoreCourant = removeScoreCourant(snapshots);
  const invertedSnapshots = snapsWithoutScoreCourant.reverse();
  const limitedSnapshots = limitSnapshots(invertedSnapshots);
  return limitedSnapshots;
};

const removeScoreCourant = (snapshots: SnapshotDetails[]) => {
  return snapshots.filter((snap) => snap?.nom !== 'Score courant');
};

const limitSnapshots = (snapshots: SnapshotDetails[]) => {
  const HOW_MANY_SNAPSHOTS_TO_SHOW_BY_DEFAULT = 4;
  if (snapshots.length > HOW_MANY_SNAPSHOTS_TO_SHOW_BY_DEFAULT) {
    return snapshots.slice(0, HOW_MANY_SNAPSHOTS_TO_SHOW_BY_DEFAULT);
  }
  return snapshots;
};

export default ScoreEvolutionsGraphs;
