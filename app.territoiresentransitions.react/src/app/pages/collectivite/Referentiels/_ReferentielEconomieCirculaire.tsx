import type {ActionReferentiel} from 'generated/models/action_referentiel';
import {ExpandableAction} from 'ui/shared/actions/ExpandableAction';

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
