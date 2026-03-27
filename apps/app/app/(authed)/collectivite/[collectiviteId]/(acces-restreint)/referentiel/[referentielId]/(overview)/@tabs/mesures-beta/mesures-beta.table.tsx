'use client';

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { makeReferentielTacheUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ReactTable, TableCell, TableHeaderCell } from '@tet/ui';
import Link from 'next/link';
import { MesuresBetaCommentairesCell } from './mesures-beta-commentaires.cell';
import { MesuresBetaDocumentsCell } from './mesures-beta-documents.cell';
import { MesuresBetaStatutCell } from './mesures-beta-statut.cell';
import type { MesureBetaRow } from './use-mesures-beta-table-data';

const columnHelper = createColumnHelper<MesureBetaRow>();

export const MesuresBetaTable = ({
  data,
  isLoading,
  isSaving,
  updateStatut,
  referentielId,
}: {
  data: MesureBetaRow[];
  isLoading: boolean;
  isSaving: boolean;
  updateStatut: (actionId: string, avancement: string) => void;
  referentielId: string;
}) => {
  const collectiviteId = useCollectiviteId();

  const columns = [
    columnHelper.accessor('identifiant', {
      header: () => <TableHeaderCell title="Identifiant" className="w-24" />,
      cell: (info) => <TableCell>{info.getValue()}</TableCell>,
    }),
    columnHelper.accessor('nom', {
      header: () => <TableHeaderCell title="Mesure / Action" className="min-w-[200px]" />,
      cell: (info) => {
        const row = info.row.original;
        return (
          <TableCell>
            <Link
              href={makeReferentielTacheUrl({
                collectiviteId,
                actionId: row.action_id,
                referentielId: referentielId as import('@tet/domain/referentiels').ReferentielId,
              })}
              className="hover:underline"
            >
              {info.getValue()}
            </Link>
          </TableCell>
        );
      },
    }),
    columnHelper.accessor('avancement', {
      header: () => <TableHeaderCell title="Statut" className="w-40" />,
      cell: (info) => (
        <MesuresBetaStatutCell
          row={info.row.original}
          updateStatut={updateStatut}
        />
      ),
    }),
    columnHelper.display({
      id: 'documents',
      header: () => <TableHeaderCell title="Documents" className="w-32" />,
      cell: (info) => (
        <MesuresBetaDocumentsCell
          row={info.row.original}
          referentielId={referentielId as import('@tet/domain/referentiels').ReferentielId}
        />
      ),
    }),
    columnHelper.display({
      id: 'commentaires',
      header: () => <TableHeaderCell title="Commentaires" className="w-40" />,
      cell: (info) => (
        <MesuresBetaCommentairesCell
          row={info.row.original}
          referentielId={referentielId as import('@tet/domain/referentiels').ReferentielId}
        />
      ),
    }),
  ];

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.identifiant,
  });

  return (
    <div className="overflow-x-auto">
      <ReactTable
        table={table}
        isLoading={isLoading}
        isEmpty={data.length === 0}
        emptyCard={{
          title: 'Aucune mesure à afficher',
          description:
            'Les sous-actions et tâches du référentiel apparaîtront ici.',
        }}
      />
    </div>
  );
};
