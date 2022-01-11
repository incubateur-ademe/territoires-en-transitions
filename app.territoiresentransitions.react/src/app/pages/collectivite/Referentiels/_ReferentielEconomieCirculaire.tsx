import {ExpandableAction} from 'ui/shared/actions/ExpandableAction';
import {ActionReferentiel} from 'types/action_referentiel';

export const ReferentielEconomieCirculaire = ({
  eciAxes,
}: {
  eciAxes: ActionReferentiel[];
}) => {
  return (
    <section>
      {eciAxes.map(axis => (
        <ExpandableAction action={axis} key={axis.id} />
      ))}
    </section>
  );
};
