import { EmptyCard } from '@tet/ui';
import { useFicheContext } from '../../../context/fiche-context';
import { ActionButtons } from '../action.buttons';
import { DatavizPicto } from './dataviz-picto';

export const EmptyIndicateursView = () => {
  const { isReadonly } = useFicheContext();
  return (
    <EmptyCard
      picto={(props) => <DatavizPicto {...props} />}
      title="Aucun indicateur associé !"
      subTitle="Mesurez les résultats et l’impact de l’action grâce à des indicateurs"
      isReadonly={isReadonly}
      actions={[<ActionButtons />]}
      size="md"
      variant="transparent"
    />
  );
};
