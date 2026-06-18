'use client';

import { appLabels } from '@/app/labels/catalog';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import { FichesListCellActions } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/cells/fiches-list.cell-actions';
import { FichesListCellDateFin } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/cells/fiches-list.cell-date-fin';
import { FichesListCellPilotes } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/cells/fiches-list.cell-pilotes';
import { FichesListCellTitle } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/cells/fiches-list.cell-title';
import { FichesListPrioriteCell } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/cells/fiches-list.priorite.cell';
import { FichesListStatutCell } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/cells/fiches-list.statut.cell';
import { Plan, FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { TableHeaderCell } from '@tet/ui';
import { Fragment, useMemo } from 'react';

type Props = {
  plan: Plan | undefined;
  fiches: FicheWithRelationsAndCollectivite[];
  isLoading: boolean;
};

const TOTAL_COLUMNS = 6;

export const PcaetPlanFichesTable = ({ plan, fiches, isLoading }: Props) => {
  const { groups, ungroupedFiches } = useMemo(() => {
    if (!plan) {
      return { groups: [], ungroupedFiches: fiches };
    }

    const fichesById = new Map(fiches.map((f) => [f.id, f]));

    // Tous les axes sauf la racine (parent === null), dans l'ordre du plan
    const axes = plan.axes.filter(
      (axe) => axe.parent !== null && axe.fiches.length > 0
    );

    const ficheIdsInGroups = new Set<number>();

    const groups = axes
      .map((axe) => {
        const fichesOfAxe = axe.fiches
          .map((id) => fichesById.get(id))
          .filter((f): f is FicheWithRelationsAndCollectivite => !!f);
        fichesOfAxe.forEach((f) => ficheIdsInGroups.add(f.id));
        return { axe, fiches: fichesOfAxe };
      })
      .filter((g) => g.fiches.length > 0);

    const ungroupedFiches = fiches.filter((f) => !ficheIdsInGroups.has(f.id));

    return { groups, ungroupedFiches };
  }, [plan, fiches]);

  const isEmpty = !isLoading && fiches.length === 0;

  return (
    <div className="w-full bg-white rounded-xl border border-grey-3 overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="border-b border-grey-3">
          <tr>
            <TableHeaderCell title={appLabels.tableauTitre} className="w-auto" />
            <TableHeaderCell title={appLabels.statut} className="w-32" />
            <TableHeaderCell title={appLabels.tableauPilote} className="w-44" />
            <TableHeaderCell title={appLabels.tableauPriorite} className="w-32" />
            <TableHeaderCell title={appLabels.dateFin} className="w-32" />
            <TableHeaderCell className="w-16" icon="more-2-line" />
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={TOTAL_COLUMNS}
                className="px-4 py-6 text-sm text-grey-6 text-center"
              >
                {appLabels.demarchePcaetProgrammeChargement}
              </td>
            </tr>
          ) : isEmpty ? (
            <tr>
              <td colSpan={TOTAL_COLUMNS} className="px-4 py-10 text-center">
                <div className="flex flex-col items-center gap-3 text-grey-6">
                  <PictoExpert className="w-16 h-16 opacity-30" />
                  <span className="text-sm">
                    {appLabels.aucuneActionRecherche}
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            <>
              {groups.map(({ axe, fiches: axeFiches }) => (
                <Fragment key={`axe-${axe.id}`}>
                  <tr
                    className="bg-primary-1 border-b border-primary-3"
                  >
                    <td
                      colSpan={TOTAL_COLUMNS}
                      className="py-2 text-sm font-semibold text-primary-9"
                      style={{ paddingLeft: `${(axe.depth - 1) * 24 + 16}px` }}
                    >
                      {axe.nom ?? '—'}
                    </td>
                  </tr>
                  {axeFiches.map((fiche) => (
                    <tr
                      key={fiche.id}
                      className="group relative border-b border-grey-3 last:border-b-0 even:bg-grey-1 text-sm"
                    >
                      <FichesListCellTitle fiche={fiche} canOpenAction />
                      <FichesListStatutCell action={fiche} />
                      <FichesListCellPilotes action={fiche} />
                      <FichesListPrioriteCell action={fiche} />
                      <FichesListCellDateFin action={fiche} />
                      <FichesListCellActions fiche={fiche} />
                    </tr>
                  ))}
                </Fragment>
              ))}
              {ungroupedFiches.map((fiche) => (
                <tr
                  key={fiche.id}
                  className="group relative border-b border-grey-3 last:border-b-0 even:bg-grey-1 text-sm"
                >
                  <FichesListCellTitle fiche={fiche} canOpenAction />
                  <FichesListStatutCell action={fiche} />
                  <FichesListCellPilotes action={fiche} />
                  <FichesListPrioriteCell action={fiche} />
                  <FichesListCellDateFin action={fiche} />
                  <FichesListCellActions fiche={fiche} />
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};
