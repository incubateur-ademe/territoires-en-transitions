import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Financeur } from '@tet/domain/plans';
import { Button, ReactTable, TableHeaderCell } from '@tet/ui';
import { useCallback, useMemo } from 'react';
import { useFicheContext } from '../../../context/fiche-context';
import { emptyViewsProps } from '../empty-view';
import { FinanceurActionsCell } from './financeur-actions.cell';
import { FinanceurFormProvider } from './financeur-form.context';
import { FinanceurMontantCell } from './financeur-montant.cell';
import { FinanceurNameCell } from './financeur-name.cell';
import { DraftFinanceurRowFormValues, FinanceurRowFormValues } from './types';
import { useDraftFinanceurs } from './use-draft-financeurs';

const columnHelper = createColumnHelper<Financeur | Partial<Financeur>>();

export const FinanceursTable = () => {
  const { fiche, isReadonly, financeurs: financeursState } = useFicheContext();
  const { draftFinanceurs, updateDraftFinanceur, deleteDraftFinanceur } =
    useDraftFinanceurs(fiche.id);

  const usedFinanceurIds = useMemo(
    () => financeursState.list.map((f) => f.financeurTagId),
    [financeursState.list]
  );

  const tableData = useMemo(() => {
    return [...financeursState.list, ...(draftFinanceurs ?? [])];
  }, [financeursState.list, draftFinanceurs]);

  const handleUpsertFinanceur = async (data: FinanceurRowFormValues) => {
    await financeursState.upsert({
      financeurTagId: data.financeurTagId,
      montantTtc: data.montantTtc,
    });
  };

  const handleDeleteFinanceur = useCallback(
    async ({
      financeurTagId,
      draftId,
    }: {
      financeurTagId: number | undefined;
      draftId: string | undefined;
    }) => {
      if (draftId) {
        deleteDraftFinanceur(draftId);
      } else if (financeurTagId) {
        await financeursState.delete(financeurTagId);
      }
    },
    [deleteDraftFinanceur, financeursState]
  );

  const handleCreateDraftFinanceur = () => {
    const draftFinanceur: DraftFinanceurRowFormValues = {
      ficheId: fiche.id,
      financeurTagId: undefined,
      montantTtc: undefined,
      draftId: `draft-${Date.now()}`,
    };
    updateDraftFinanceur(draftFinanceur);
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
            onDeleteFinanceur={(args) => {
              return handleDeleteFinanceur({
                draftId: args.draftId,
                financeurTagId: args.financeurTagId,
              });
            }}
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
      return 'draftId' in row
        ? (row.draftId as string)
        : `${row.financeurTagId}`;
    },
    getCoreRowModel: getCoreRowModel(),
  });

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
              | DraftFinanceurRowFormValues;

            return (
              <FinanceurFormProvider
                financeur={financeur}
                isReadonly={isReadonly}
                onUpsertFinanceur={handleUpsertFinanceur}
                onCancel={() =>
                  'draftId' in row.original
                    ? deleteDraftFinanceur(row.original.draftId as string)
                    : undefined
                }
                onDraftFinanceurChange={updateDraftFinanceur}
                onDeleteDraftFinanceur={deleteDraftFinanceur}
              >
                {children}
              </FinanceurFormProvider>
            );
          }}
          emptyCard={{
            ...emptyViewsProps.financeurs,
            actions: isReadonly
              ? undefined
              : [
                  {
                    onClick: handleCreateDraftFinanceur,
                    children: 'Ajouter un financeur',
                    icon: 'add-line',
                    variant: 'outlined',
                  },
                ],
          }}
        />
      </div>
      {!isReadonly && tableData.length !== 0 && (
        <Button
          className="m-4"
          icon="add-line"
          size="xs"
          onClick={handleCreateDraftFinanceur}
          variant="outlined"
        >
          Ajouter un financeur
        </Button>
      )}
    </div>
  );
};
