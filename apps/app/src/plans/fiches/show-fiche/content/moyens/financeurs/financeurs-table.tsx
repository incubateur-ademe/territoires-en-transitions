import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Financeur } from '@tet/domain/plans';
import { Button, ReactTable, TableHeaderCell } from '@tet/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFicheContext } from '../../../context/fiche-context';
import { FinanceursPicto } from '../empty-view/financeurs.picto';
import { FinanceurActionsCell } from './financeur-actions.cell';
import { FinanceurFormProvider } from './financeur-form.context';
import { FinanceurMontantCell } from './financeur-montant.cell';
import { FinanceurNameCell } from './financeur-name.cell';
import {
  FinanceurRowFormValues,
  TemporaryFinanceurRowFormValues,
} from './types';

const columnHelper = createColumnHelper<Financeur | Partial<Financeur>>();

export const FinanceursTable = () => {
  const { fiche, isReadonly, financeurs: financeursState } = useFicheContext();
  const [columnVisibility, setColumnVisibility] = useState({});
  const [temporaryFinanceurs, setTemporaryFinanceurs] = useState<
    TemporaryFinanceurRowFormValues[]
  >([]);

  const usedFinanceurIds = useMemo(
    () => financeursState.list.map((f) => f.financeurTagId),
    [financeursState.list]
  );

  const tableData = useMemo(() => {
    return [...financeursState.list, ...temporaryFinanceurs];
  }, [financeursState.list, temporaryFinanceurs]);

  const handleUpsertFinanceur = async (data: FinanceurRowFormValues) => {
    await financeursState.upsert({
      financeurTagId: data.financeurTagId,
      montantTtc: data.montantTtc,
    });
    if (data.tempId) {
      setTemporaryFinanceurs((prev) =>
        prev.filter((tf) => tf.tempId !== data.tempId)
      );
    }
  };

  const handleDeleteFinanceur = useCallback(
    async (financeurTagId: number) => {
      await financeursState.delete(financeurTagId);
    },
    [financeursState]
  );

  const handleCreateFinanceur = () => {
    const temporaryFinanceur: TemporaryFinanceurRowFormValues = {
      ficheId: fiche.id,
      financeurTagId: undefined,
      montantTtc: undefined,
      tempId: `temp-${Date.now()}`,
    };
    setTemporaryFinanceurs((prev) => [...prev, temporaryFinanceur]);
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'financeur',
        header: () => <TableHeaderCell title="Financeurs" className="w-3/6" />,
        cell: () => (
          <FinanceurNameCell
            fiche={fiche}
            availableFinanceurIds={usedFinanceurIds}
          />
        ),
      }),
      columnHelper.display({
        id: 'montant',
        header: () => (
          <TableHeaderCell
            title="Montant de subvention obtenu"
            className="w-2/6"
          />
        ),
        cell: () => <FinanceurMontantCell />,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <TableHeaderCell icon="more-2-line" />,
        cell: () => (
          <FinanceurActionsCell
            fiche={fiche}
            onDeleteFinanceur={handleDeleteFinanceur}
          />
        ),
      }),
    ],
    [fiche, usedFinanceurIds, handleDeleteFinanceur]
  );

  const table = useReactTable({
    columns,
    data: tableData,
    getRowId: (row) => {
      return 'tempId' in row ? (row.tempId as string) : `${row.financeurTagId}`;
    },
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    table.getColumn('actions')?.toggleVisibility(!isReadonly);
  }, [isReadonly, table]);

  const isEmpty = tableData.length === 0;

  return (
    <div className="p-2 bg-white rounded-lg border border-grey-3">
      <div className="max-2xl:overflow-x-auto">
        <ReactTable
          table={table}
          isEmpty={isEmpty}
          rowWrapper={({ row, children }) => {
            const financeur = row.original as
              | Financeur
              | TemporaryFinanceurRowFormValues;

            return (
              <FinanceurFormProvider
                financeur={financeur}
                fiche={fiche}
                isReadonly={isReadonly}
                onUpsertFinanceur={handleUpsertFinanceur}
                onCancel={
                  'tempId' in financeur
                    ? () =>
                        setTemporaryFinanceurs((prev) =>
                          prev.filter((tf) => tf.tempId !== financeur.tempId)
                        )
                    : undefined
                }
              >
                {children}
              </FinanceurFormProvider>
            );
          }}
          emptyCard={{
            picto: (props) => <FinanceursPicto {...props} />,
            title: 'Aucun financeur pour le moment',
            description:
              'Ajoutez des financeurs pour documenter les subventions obtenues pour votre action.',
            actions: isReadonly
              ? undefined
              : [
                  {
                    onClick: handleCreateFinanceur,
                    children: 'Ajouter un financeur',
                    icon: 'add-line',
                  },
                ],
          }}
        />
      </div>
      {!isReadonly && (
        <Button
          className="m-4"
          icon="add-line"
          size="xs"
          onClick={handleCreateFinanceur}
        >
          Ajouter un financeur
        </Button>
      )}
    </div>
  );
};
