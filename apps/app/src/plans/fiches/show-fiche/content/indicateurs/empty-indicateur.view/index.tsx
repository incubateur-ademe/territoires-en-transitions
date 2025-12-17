import { EmptyCard } from '@tet/ui';
import { useFicheContext } from '../../../context/fiche-context';
import { ActionButtons } from '../action.buttons';
import { DatavizPicto } from './dataviz.picto';

export const EmptyIndicateursView = () => {
  const { isReadonly } = useFicheContext();
  return (
    <EmptyCard
      picto={(props) => <DatavizPicto {...props} />}
      title="Aucun indicateur associé !"
      subTitle="Observez votre progression grâce aux indicateurs"
      isReadonly={isReadonly}
      actions={[<ActionButtons />]}
      size="xs"
      variant="transparent"
    />
  );
};
