import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell, VisibleWhen } from '@tet/ui';
import { useFicheFinanceurs } from '../../../context/hooks/use-fiche-financeurs';
import { DeleteFinanceurButton } from './delete-financeur.button';
import { useFinanceurFormContext } from './financeur-form.context';

type FinanceurActionsCellProps = {
  fiche: FicheWithRelations;
  onDeleteFinanceur: (data: {
    financeurTagId: number | undefined;
    draftId: string | undefined;
  }) => Promise<void>;
};

export const FinanceurActionsCell = ({
  fiche,
  onDeleteFinanceur,
}: FinanceurActionsCellProps) => {
  const { form, isReadonly } = useFinanceurFormContext();
  const { getFinanceurName } = useFicheFinanceurs(fiche);

  return (
    <VisibleWhen condition={!isReadonly}>
      <TableCell className="flex justify-center ">
        <DeleteFinanceurButton
          financeurName={
            getFinanceurName(form.getValues().financeurTagId) ?? ''
          }
          onDelete={async () => {
            const { financeurTagId, draftId } = form.getValues();
            await onDeleteFinanceur({
              financeurTagId,
              draftId,
            });
          }}
          fiche={fiche}
        />
      </TableCell>
    </VisibleWhen>
  );
};
