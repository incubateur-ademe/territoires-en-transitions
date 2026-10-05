'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import {
  DEMARCHE_PCAET_STATUT_VARIANTS,
  formatDemarcheStatut,
} from '@/app/demarches/pcaet/constants';
import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { RouterOutput } from '@tet/api';
import { Badge, ReactTable, TableCell, TableHeaderCell } from '@tet/ui';
import {
  columnVisibilityFeature,
  createColumnHelper,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { DemarchePcaetActionsButton } from './demarche-pcaet-actions.button';

type Demarche = RouterOutput['demarches']['pcaet']['list'][number];

const getDetailUrl = (demarche: Demarche) =>
  makeCollectiviteDemarchePcaetRootUrl({
    collectiviteId: demarche.collectiviteId,
    demarcheId: demarche.id,
  });

const DateCell = ({ date }: { date: string | null }) =>
  date ? (
    <span className="text-primary-9">{getTextFormattedDate({ date })}</span>
  ) : (
    <span className="text-grey-6">{'—'}</span>
  );

const features = tableFeatures({ columnVisibilityFeature });

const columnHelper = createColumnHelper<typeof features, Demarche>();

/**
 * Mêmes conventions que la liste d'instruction des services : largeurs posées
 * colonne par colonne sauf sur le texte libre, et l'action principale en
 * bouton visible plutôt que cachée dans un menu.
 */
const columns = [
  columnHelper.display({
    id: 'titre',
    header: () => (
      <TableHeaderCell title={appLabels.demarcheListeColonneTitre} />
    ),
    cell: ({ row }) => (
      <TableCell>
        <Link
          href={getDetailUrl(row.original)}
          className="font-bold text-primary-9 hover:underline"
        >
          {row.original.titre}
        </Link>
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'pilotes',
    header: () => (
      <TableHeaderCell title={appLabels.demarcheListeColonnePilotes} />
    ),
    cell: ({ row }) => (
      <TableCell>
        {row.original.pilotes.length > 0 ? (
          <span className="text-primary-9">
            {row.original.pilotes.map((pilote) => pilote.nom).join(', ')}
          </span>
        ) : (
          <span className="text-grey-6">{'—'}</span>
        )}
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'statut',
    header: () => (
      <TableHeaderCell
        className="w-44"
        title={appLabels.demarcheListeColonneStatut}
      />
    ),
    cell: ({ row }) => (
      <TableCell>
        <Badge
          title={formatDemarcheStatut(row.original.status)}
          variant={DEMARCHE_PCAET_STATUT_VARIANTS[row.original.status]}
          size="sm"
        />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'creation',
    header: () => (
      <TableHeaderCell
        className="w-36"
        title={appLabels.demarcheListeColonneCreation}
      />
    ),
    cell: ({ row }) => (
      <TableCell>
        <DateCell date={row.original.createdAt} />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'lancement',
    header: () => (
      <TableHeaderCell
        className="w-36"
        title={appLabels.demarcheListeColonneLancement}
      />
    ),
    cell: ({ row }) => (
      <TableCell>
        <DateCell date={row.original.launchedAt} />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'modification',
    header: () => (
      <TableHeaderCell
        className="w-36"
        title={appLabels.demarcheListeColonneModification}
      />
    ),
    cell: ({ row }) => (
      <TableCell>
        <DateCell date={row.original.modifiedAt} />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'actions',
    header: () => (
      <TableHeaderCell
        className="w-52"
        title={appLabels.demarcheListeColonneActions}
        align="right"
      />
    ),
    cell: ({ row }) => (
      <TableCell>
        <div className="flex justify-end">
          <DemarchePcaetActionsButton demarche={row.original} />
        </div>
      </TableCell>
    ),
  }),
];

export const DemarchesPcaetTable = ({
  demarches,
}: {
  demarches: Demarche[];
}) => {
  const table = useTable({
    features,
    columns,
    data: demarches,
    getRowId: (demarche) => demarche.id.toString(),
  });

  return <ReactTable table={table} />;
};
