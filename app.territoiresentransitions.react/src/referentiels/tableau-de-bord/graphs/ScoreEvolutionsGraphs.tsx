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
  const { data: snapshotList } = useSnapshotList(referentiel);

  const snapshotWithoutScoreCourant = removeScoreCourant(
    snapshotList?.snapshots ?? []
  );

  if (!snapshotWithoutScoreCourant?.length) {
    return <></>;
  }

  const snapshots = organizeSnaps(snapshotWithoutScoreCourant);

  return (
    <GraphCard
      title={title}
      subTitle={subTitle}
      href={href}
      renderGraph={() => (
        <ScoreTotalEvolutionsChart allSnapshots={snapshots} chartSize="sm" />
      )}
    />
  );
};

const organizeSnaps = (snapshots: SnapshotDetails[]) => {
  const invertedSnapshots = snapshots.reverse();
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
