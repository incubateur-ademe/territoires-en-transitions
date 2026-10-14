import type { JSX } from 'react';
import type { UpdateActionDeReferenceWithoutFichesProps } from './actions-de-reference.contract';
import { useListFichesActionDeReference } from './data/use-list-fiches-action-de-reference';
import { UpdateActionDeReferenceForm } from './update-action-de-reference.form';

export const UpdateActionDeReferenceContainer = ({
  action,
  onUpdated,
}: UpdateActionDeReferenceWithoutFichesProps): JSX.Element => {
  const fichesList = useListFichesActionDeReference(action.id);
  return (
    <UpdateActionDeReferenceForm
      action={action}
      onUpdated={onUpdated}
      fichesList={fichesList}
    />
  );
};
