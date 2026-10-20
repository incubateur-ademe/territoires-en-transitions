'use client';

import {
  DEMARCHE_PCAET_STATUT_VARIANTS,
  formatDemarcheStatut,
} from '@/app/demarches/pcaet/constants';
import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { HeaderFilterButton } from '@/app/demarches/components/header-filter.button';
import { Z_INDEX_ABOVE_STICKY_HEADER } from '@tet/design-tokens';
import { type DemarchePcaetStatus } from '@tet/domain/demarches';
import type { EmptyCardProps } from '@tet/ui';
import {
  Badge,
  ReactTable,
  SelectFilter,
  TableCell,
  TableHeaderCell,
} from '@tet/ui';
import {
  columnVisibilityFeature,
  createColumnHelper,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import type {
  ColonneTriable,
  DemarcheListItem,
  DirectionTri,
} from './use-filter-demarches-pcaet';

type Pilotage = {
  sort: ColonneTriable;
  direction: DirectionTri;
  trierPar: (colonne: ColonneTriable) => void;
  statuts: DemarchePcaetStatus[];
  setStatuts: (statuts: DemarchePcaetStatus[]) => void;
};

/** Ce qui distingue la liste d'édition de la liste publique. */
type Variant = {
  /** Les statuts que propose le filtre : ceux que la liste peut contenir. */
  statutOptions: readonly DemarchePcaetStatus[];
  getDetailUrl: (demarche: DemarcheListItem) => string;
  /** Sans actions, la colonne disparaît. */
  renderActions?: (demarche: DemarcheListItem) => ReactNode;
};

/**
 * Le tri et le filtre atteignent les en-têtes par le contexte, et non par une
 * fermeture : des colonnes reconstruites à chaque rendu remonteraient leurs
 * en-têtes, et le menu du filtre se refermerait entre deux clics.
 */
const PilotageContext = createContext<(Pilotage & Variant) | null>(null);

const usePilotage = (): Pilotage & Variant => {
  const pilotage = useContext(PilotageContext);
  if (pilotage === null) {
    throw new Error(
      'Les en-têtes de la liste des démarches attendent un PilotageContext.'
    );
  }
  return pilotage;
};

const SortableHeader = ({
  colonne,
  title,
  className,
  filter,
}: {
  colonne: ColonneTriable;
  title: string;
  className?: string;
  filter?: ReactNode;
}) => {
  const { sort, direction, trierPar } = usePilotage();

  return (
    <TableHeaderCell
      className={className}
      title={title}
      sortFn={() => trierPar(colonne)}
      sortDirection={sort === colonne ? direction : null}
      filter={filter}
    />
  );
};

/** Les statuts, dans l'ordre du cycle de vie — celui de l'enum du domaine. */
const StatutHeaderFilter = () => {
  const { statuts, setStatuts, statutOptions } = usePilotage();

  return (
    <SelectFilter
      dataTest="demarches.pcaet.liste.filtre-statut"
      dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
      options={statutOptions.map((value) => ({
        value,
        label: formatDemarcheStatut(value),
      }))}
      values={statuts}
      onChange={({ values }) =>
        setStatuts((values ?? []) as DemarchePcaetStatus[])
      }
      placeholder={appLabels.filtrer}
      small
      custom={{
        triggerButton: {
          button: <HeaderFilterButton filterCount={statuts.length} />,
        },
        renderOptionItem: (item) => (
          <Badge
            title={formatDemarcheStatut(item.value as DemarchePcaetStatus)}
            variant={
              DEMARCHE_PCAET_STATUT_VARIANTS[item.value as DemarchePcaetStatus]
            }
            size="sm"
          />
        ),
      }}
    />
  );
};

const DateCell = ({ date }: { date: string | null }) =>
  date ? (
    <span className="text-primary-9">{getTextFormattedDate({ date })}</span>
  ) : (
    <span className="text-grey-6">{'—'}</span>
  );

const features = tableFeatures({ columnVisibilityFeature });

const columnHelper = createColumnHelper<typeof features, DemarcheListItem>();

const TitreCell = ({ demarche }: { demarche: DemarcheListItem }) => {
  const { getDetailUrl } = usePilotage();
  return (
    <Link
      href={getDetailUrl(demarche)}
      className="font-bold text-primary-9 hover:underline"
    >
      {demarche.titre}
    </Link>
  );
};

const ActionsCell = ({ demarche }: { demarche: DemarcheListItem }) => {
  const { renderActions } = usePilotage();
  return <div className="flex justify-end">{renderActions?.(demarche)}</div>;
};

/**
 * Mêmes conventions que la liste d'instruction des services : largeurs posées
 * colonne par colonne sauf sur le texte libre, et l'action principale en
 * bouton visible plutôt que cachée dans un menu.
 */
const columns = [
  columnHelper.display({
    id: 'titre',
    header: () => (
      <SortableHeader
        colonne="titre"
        title={appLabels.demarcheListeColonneTitre}
      />
    ),
    cell: ({ row }) => (
      <TableCell>
        <TitreCell demarche={row.original} />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'pilotes',
    header: () => (
      <SortableHeader
        colonne="pilotes"
        title={appLabels.demarcheListeColonnePilotes}
      />
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
      <SortableHeader
        colonne="statut"
        className="w-52"
        title={appLabels.demarcheListeColonneStatut}
        filter={<StatutHeaderFilter />}
      />
    ),
    cell: ({ row }) => (
      <TableCell>
        <Badge
          title={formatDemarcheStatut(row.original.status)}
          variant={DEMARCHE_PCAET_STATUT_VARIANTS[row.original.status]}
          size="sm"
          trim={false}
        />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'creation',
    header: () => (
      <SortableHeader
        colonne="creation"
        className="w-40"
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
      <SortableHeader
        colonne="lancement"
        className="w-40"
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
      <SortableHeader
        colonne="modification"
        className="w-40"
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
        <ActionsCell demarche={row.original} />
      </TableCell>
    ),
  }),
];

export const DemarchesPcaetTable = <T extends DemarcheListItem>({
  demarches,
  sort,
  direction,
  trierPar,
  statuts,
  setStatuts,
  statutOptions,
  getDetailUrl,
  renderActions,
  etatVide,
}: Pilotage & {
  demarches: T[];
  statutOptions: Variant['statutOptions'];
  getDetailUrl: (demarche: T) => string;
  renderActions?: (demarche: T) => ReactNode;
  /**
   * Ce qu'affiche le corps du tableau quand le filtre ne laisse rien : dans le
   * tableau et non à sa place, pour que l'en-tête qui porte le filtre reste à
   * portée.
   */
  etatVide: EmptyCardProps;
}) => {
  // Les lignes rendues sont celles reçues : la fermeture rend aux rappels le
  // type qu'ils attendent, que les colonnes stables ne peuvent pas porter.
  const pilotage = useMemo(
    () => ({
      sort,
      direction,
      trierPar,
      statuts,
      setStatuts,
      statutOptions,
      getDetailUrl: (demarche: DemarcheListItem) => getDetailUrl(demarche as T),
      renderActions:
        renderActions &&
        ((demarche: DemarcheListItem) => renderActions(demarche as T)),
    }),
    [
      sort,
      direction,
      trierPar,
      statuts,
      setStatuts,
      statutOptions,
      getDetailUrl,
      renderActions,
    ]
  );

  const table = useTable({
    features,
    columns,
    data: demarches,
    getRowId: (demarche) => demarche.id.toString(),
    state: { columnVisibility: { actions: renderActions !== undefined } },
  });

  return (
    <PilotageContext.Provider value={pilotage}>
      <ReactTable
        table={table}
        isEmpty={demarches.length === 0}
        emptyCard={{ className: 'min-h-[12rem]', ...etatVide }}
      />
    </PilotageContext.Provider>
  );
};
