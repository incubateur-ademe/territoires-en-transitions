import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell, VisibleWhen } from '@tet/ui';
import { useFicheFinanceurs } from '../../../context/hooks/use-fiche-financeurs';
import { DeleteFinanceurButton } from './delete-financeur.button';
import { useFinanceurFormContext } from './financeur-form.context';

type FinanceurActionsCellProps = {
  fiche: FicheWithRelations;
  onDeleteFinanceur: (financeurTagId: number) => Promise<void>;
};

export const FinanceurActionsCell = ({
  fiche,
  onDeleteFinanceur,
}: FinanceurActionsCellProps) => {
  const { form, isReadonly, isTemporary } = useFinanceurFormContext();
  const { getFinanceurName } = useFicheFinanceurs(fiche);
  if (isTemporary) {
    return null;
  }

  return (
    <VisibleWhen condition={!isReadonly}>
      <TableCell className="py-0 flex justify-center">
        <DeleteFinanceurButton
          financeurName={
            getFinanceurName(form.getValues().financeurTagId) ?? ''
          }
          onDelete={async () => {
            await onDeleteFinanceur(form.getValues().financeurTagId ?? 0);
          }}
          fiche={fiche}
        />
      </TableCell>
    </VisibleWhen>
  );
};
