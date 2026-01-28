import { Button, cn, Spacer, TableHead, TableRow, VisibleWhen } from '@tet/ui';
import { useMemo, useState } from 'react';
import { useFicheContext } from '../../../context/fiche-context';
import { FinanceurTableNewRow } from './financeur-table-new-row';
import { FinanceurTableRow } from './financeur-table-row';

const HeaderCell = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <th
      className={cn(
        'text-left uppercase text-sm text-grey-9 font-medium py-3 pl-4 bg-white border-b border-gray-4',
        className
      )}
    >
      {children}
    </th>
  );
};

export const FinanceursTable = () => {
  const { fiche, isReadonly, financeurs: financeursState } = useFicheContext();
  const [isAddingFinanceur, setIsAddingFinanceur] = useState(
    !financeursState.list.length
  );

  const usedFinanceurIds = useMemo(
    () => financeursState.list.map((f) => f.financeurTagId),
    [financeursState.list]
  );

  const handleUpsertFinanceur = async (data: {
    financeurTagId: number;
    montantTtc: number;
    financeurTag: { id: number; nom: string; collectiviteId: number };
  }) => {
    await financeursState.upsert(data);
    setIsAddingFinanceur(false);
  };

  const handleDeleteFinanceur = async (financeurTagId: number) => {
    await financeursState.delete(financeurTagId);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-0 border border-gray-3 bg-grey-1 rounded-lg overflow-hidden [&_tbody_tr:nth-child(even)]:bg-grey-2">
        <TableHead>
          <TableRow>
            <HeaderCell className="w-3/6">Financeurs</HeaderCell>
            <HeaderCell className="w-2/6">
              Montant de subvention obtenu
            </HeaderCell>
            <HeaderCell className="w-1/6" />
          </TableRow>
        </TableHead>
        <tbody>
          {financeursState.list.map((financeur) => (
            <FinanceurTableRow
              key={financeur.financeurTagId}
              financeur={financeur}
              fiche={fiche}
              isReadonly={isReadonly}
              availableFinanceurIds={usedFinanceurIds.filter(
                (id) => id !== financeur.financeurTagId
              )}
              onUpsertFinanceur={handleUpsertFinanceur}
              onDeleteFinanceur={handleDeleteFinanceur}
            />
          ))}
          <VisibleWhen condition={!isReadonly && isAddingFinanceur}>
            <FinanceurTableNewRow
              key="new"
              fiche={fiche}
              availableFinanceurIds={usedFinanceurIds}
              onUpsertFinanceur={handleUpsertFinanceur}
              onCancel={() => setIsAddingFinanceur(false)}
            />
          </VisibleWhen>
        </tbody>
      </table>
      <VisibleWhen condition={!isReadonly}>
        <Spacer height={1} />
        <Button
          size="xs"
          icon="add-line"
          variant="outlined"
          onClick={() => setIsAddingFinanceur((prev) => !prev)}
        >
          Ajouter un financeur
        </Button>
      </VisibleWhen>
    </div>
  );
};
