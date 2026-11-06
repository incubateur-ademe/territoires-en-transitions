'use client';

import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { ErrorCard } from '@/app/utils/error/error.card';
import { RouterOutput } from '@tet/api';
import { Checkbox, ReactTable, TableCell, TableHeaderCell } from '@tet/ui';
import {
  columnVisibilityFeature,
  createColumnHelper,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import {
  useListCot,
  useToggleCotActif,
} from './data/use-dossiers-labellisation';
import {
  CollectiviteHeaderFilter,
  useFilterDossiersLabellisation,
} from './dossiers-labellisation.header-filters';

type Cot =
  RouterOutput['referentiels']['labellisations']['admin']['listCot'][number];

const features = tableFeatures({ columnVisibilityFeature });
const columnHelper = createColumnHelper<typeof features, Cot>();

const ActifCell = ({ cot }: { cot: Cot }) => {
  const { mutate: toggleCotActif, isPending } = useToggleCotActif();
  return (
    <Checkbox
      variant="switch"
      checked={cot.actif}
      disabled={isPending}
      aria-label={`${appLabels.labellisationsAdminCotActif} ${cot.collectiviteNom}`}
      data-test={`referentiels.labellisations-admin.cot-actif-${cot.collectiviteId}`}
      onChange={() =>
        toggleCotActif({
          collectiviteId: cot.collectiviteId,
          actif: !cot.actif,
        })
      }
    />
  );
};

const columns = [
  columnHelper.display({
    id: 'collectivite',
    header: () => (
      <TableHeaderCell
        title={appLabels.labellisationsAdminColonneCollectivite}
        filter={
          <CollectiviteHeaderFilter
            placeholder={appLabels.labellisationsAdminRechercheCollectivite}
          />
        }
      />
    ),
    cell: ({ row }) => (
      <TableCell>
        <div className="flex items-baseline gap-2">
          <span className="text-grey-8">{`#${row.original.collectiviteId}`}</span>
          <span className="font-bold text-primary-9">
            {row.original.collectiviteNom}
          </span>
        </div>
      </TableCell>
    ),
  }),
  columnHelper.display({
    id: 'signataire',
    header: () => (
      <TableHeaderCell title={appLabels.labellisationsAdminSignataire} />
    ),
    cell: ({ row }) => (
      <TableCell>
        {row.original.signataireNom ?? (
          <span className="text-grey-6">{'—'}</span>
        )}
      </TableCell>
    ),
  }),
  columnHelper.display({
    id: 'actif',
    header: () => (
      <TableHeaderCell
        className="w-32"
        title={appLabels.labellisationsAdminCotActif}
      />
    ),
    cell: ({ row }) => (
      <TableCell>
        <ActifCell cot={row.original} />
      </TableCell>
    ),
  }),
];

/** Collectivités en COT : signataire en lecture seule, COT désactivable. */
export const CotView = () => {
  const { filters } = useFilterDossiersLabellisation();
  const { data, isLoading, isError, refetch } = useListCot(filters.search);
  const table = useTable({
    features,
    columns,
    data: data ?? [],
    getRowId: (cot) => cot.collectiviteId.toString(),
  });

  if (isError) {
    return (
      <ErrorCard
        title={appLabels.uneErreurEstSurvenue}
        retry={() => refetch()}
      />
    );
  }

  return (
    <div className="max-h-[90vh] overflow-auto rounded-lg border border-grey-3">
      <ReactTable
        table={table}
        ariaLabel={appLabels.labellisationsAdminOngletCot}
        isLoading={isLoading}
        nbLoadingRows={5}
        isEmpty={!data?.length}
        emptyCard={{
          picto: (props) => <PictoDashboard {...props} />,
          title: appLabels.labellisationsAdminAucunCot,
        }}
      />
    </div>
  );
};
