'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  Badge,
  EmptyCardProps,
  ReactTable,
  TableCell,
  TableHeaderCell,
} from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ComponentProps } from 'react';
import {
  columnVisibilityFeature,
  createColumnHelper,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { DossierLabellisation } from './data/use-dossiers-labellisation';
import { DossierLabellisationDecisionActions } from './dossier/dossier-labellisation.decision';
import {
  useOpenDossierId,
  useOpenDossier,
} from './dossier/dossier-labellisation.side-panel';
import { Etoiles } from './labellisations-admin.etoiles';
import { ReferentielBadge } from './labellisations-admin.referentiel-badge';
import {
  CollectiviteHeaderFilter,
  DossiersSort,
  DossiersView,
  StatutHeaderFilter,
  SujetHeaderFilter,
  useFilterDossiersLabellisation,
} from './dossiers-labellisation.header-filters';
import {
  formatShortDate,
  statutBadgeVariant,
} from './labellisations-admin.utils';

const features = tableFeatures({ columnVisibilityFeature });
const columnHelper = createColumnHelper<
  typeof features,
  DossierLabellisation
>();

/** En-tête triable : le tri vit dans l'URL, comme les filtres. */
const SortableHeaderCell = ({
  sort,
  ...props
}: { sort: DossiersSort } & Omit<
  ComponentProps<typeof TableHeaderCell>,
  'sortFn' | 'sortDirection'
>) => {
  const { sortBy, sortDirection } = useFilterDossiersLabellisation();
  return (
    <TableHeaderCell
      {...props}
      sortFn={() => sortBy(sort)}
      sortDirection={sortDirection(sort)}
    />
  );
};

const Empty = () => <span className="text-grey-6">{'—'}</span>;

/** Colonnes figées par vue : reconstruites au rendu, les en-têtes remonteraient. */
const buildColumns = (view: DossiersView) => {
  const columns = [
    columnHelper.display({
      id: 'dossier',
      header: () => (
        <TableHeaderCell
          className="w-80"
          title={appLabels.labellisationsAdminColonneCollectivite}
          filter={<CollectiviteHeaderFilter />}
        />
      ),
      cell: ({ row }) => <DossierCell dossier={row.original} />,
    }),
    columnHelper.display({
      id: 'envoyeeLe',
      header: () => (
        <SortableHeaderCell
          sort="envoyeeLe"
          className="w-28"
          title={appLabels.labellisationsAdminEnvoyeeLe}
        />
      ),
      cell: ({ row }) => (
        <TableCell>
          {formatShortDate(row.original.envoyeeLe) ?? <Empty />}
        </TableCell>
      ),
    }),
    columnHelper.display({
      id: 'sujet',
      header: () => (
        <SortableHeaderCell
          sort="sujet"
          className="w-40"
          title={appLabels.labellisationsAdminColonneSujet}
          filter={<SujetHeaderFilter />}
        />
      ),
      cell: ({ row }) => (
        <TableCell>
          {row.original.sujet ? (
            appLabels.labellisationsAdminSujet[row.original.sujet]
          ) : (
            <Empty />
          )}
        </TableCell>
      ),
    }),
    columnHelper.display({
      id: 'statut',
      header: () => (
        <SortableHeaderCell
          sort="statut"
          className="w-52"
          title={appLabels.labellisationsAdminColonneStatut}
          filter={<StatutHeaderFilter />}
        />
      ),
      cell: ({ row }) => (
        <TableCell>
          <Badge
            size="sm"
            trim={false}
            variant={statutBadgeVariant(row.original)}
            title={appLabels.labellisationsAdminStatut[row.original.statut]}
          />
        </TableCell>
      ),
    }),
    columnHelper.display({
      id: 'auditeurs',
      header: () => (
        <TableHeaderCell
          className="w-44"
          title={appLabels.labellisationsAdminColonneAuditeurs}
        />
      ),
      cell: ({ row }) => (
        <TableCell>
          <AuditeursCell dossier={row.original} />
        </TableCell>
      ),
    }),
    columnHelper.display({
      id: 'attribution',
      header: () => (
        <SortableHeaderCell
          sort="auditAttribueLe"
          className="w-32"
          title={appLabels.labellisationsAdminAuditAttribueLe}
        />
      ),
      cell: ({ row }) => (
        <TableCell>
          {formatShortDate(row.original.auditAttribueLe) ?? <Empty />}
        </TableCell>
      ),
    }),
    columnHelper.display({
      id: 'cloture',
      header: () => (
        <SortableHeaderCell
          sort="dateFin"
          className="w-32"
          title={appLabels.labellisationsAdminColonneClotureAudit}
        />
      ),
      cell: ({ row }) => (
        <TableCell>
          {formatShortDate(row.original.dateFin) ?? <Empty />}
        </TableCell>
      ),
    }),
    columnHelper.display({
      id: 'labellisation',
      header: () => (
        <SortableHeaderCell
          sort="labellisationObtenueLe"
          className="w-32"
          title={appLabels.labellisationsAdminColonneLabelliseeLe}
        />
      ),
      cell: ({ row }) => (
        <TableCell>
          {row.original.labellisationObtenueLe ? (
            formatShortDate(row.original.labellisationObtenueLe)
          ) : row.original.statut === 'audit_valide' ? (
            appLabels.labellisationsAdminAActer
          ) : (
            <Empty />
          )}
        </TableCell>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => (
        <TableHeaderCell
          className={cn('w-56', pinnedRightClassName, 'bg-white')}
          title={appLabels.labellisationsAdminColonneActions}
          align="right"
        />
      ),
      cell: ({ row }) => (
        <TableCell
          className={cn(pinnedRightClassName, rowSeparatorClassName)}
          // Les actions et leurs modales (portails) n'ouvrent pas le dossier.
          onClick={(e) => e.stopPropagation()}
        >
          <DossierLabellisationDecisionActions
            dossier={row.original}
            size="xs"
            className="justify-end"
            isTable
          />
        </TableCell>
      ),
    }),
  ];
  // Statut toujours « Clos » et aucune action possible : inutiles en « clos ».
  // En cours : on suit l'attribution, sans action ni clôture à afficher.
  const hiddenColumnIds =
    view === 'clos'
      ? ['statut', 'actions', 'attribution']
      : view === 'en-attente'
      ? ['labellisation', 'attribution']
      : ['labellisation', 'cloture', 'actions'];
  return columns.filter(
    (column) => !hiddenColumnIds.includes(column.id as string)
  );
};

const columnsByView = {
  'en-attente': buildColumns('en-attente'),
  'en-cours': buildColumns('en-cours'),
  clos: buildColumns('clos'),
};

/**
 * Les actions restent visibles quand le tableau défile horizontalement. Pas de
 * z-index : l'en-tête collant (z-1) doit passer par-dessus au défilement
 * vertical.
 */
const pinnedRightClassName =
  'sticky right-0 bg-inherit shadow-[-1px_0_0_0] shadow-grey-3';

/** La cellule collante recouvre la bordure de sa ligne : on la redessine. */
const rowSeparatorClassName =
  'shadow-[-1px_0_0_0,inset_0_-1px_0_0] shadow-grey-3';

const OuvrirDossierButton = ({
  dossier,
}: {
  dossier: DossierLabellisation;
}) => {
  const openDossier = useOpenDossier();
  return (
    <button
      type="button"
      data-test={`referentiels.labellisations-admin.ouvrir-dossier-${dossier.auditId}`}
      className="font-bold text-primary-9 hover:underline text-left"
      onClick={(e) => {
        // La ligne ouvre aussi le dossier : on évite une double ouverture.
        e.stopPropagation();
        openDossier(dossier.auditId);
      }}
    >
      {dossier.collectiviteNom}
    </button>
  );
};

const DossierCell = ({ dossier }: { dossier: DossierLabellisation }) => {
  const etoiles = Number(dossier.etoiles ?? 0);
  return (
    <TableCell>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <ReferentielBadge referentielId={dossier.referentielId} />
          <OuvrirDossierButton dossier={dossier} />
        </div>
        <div className="flex items-center gap-2">
          {etoiles > 0 && <Etoiles etoiles={etoiles} />}
          <span className="text-grey-8">{`(#${dossier.collectiviteId})`}</span>
        </div>
      </div>
    </TableCell>
  );
};

const AuditeursCell = ({ dossier }: { dossier: DossierLabellisation }) => {
  if (dossier.statut === 'premiere_etoile_a_valider') {
    return (
      <span className="text-grey-6">
        {appLabels.labellisationsAdminPasDAudit}
      </span>
    );
  }
  if (dossier.auditeurs.length === 0) {
    return <Empty />;
  }
  return dossier.auditeurs
    .map(({ prenom, nom }) => `${prenom} ${nom}`)
    .join(', ');
};

const ariaLabelByView: Record<DossiersView, string> = {
  'en-attente': appLabels.labellisationsAdminOngletEnAttente,
  'en-cours': appLabels.labellisationsAdminOngletEnCours,
  clos: appLabels.labellisationsAdminOngletClos,
};

export const DossiersLabellisationTable = ({
  dossiers,
  isLoading,
  emptyCard,
  view,
}: {
  dossiers: DossierLabellisation[];
  isLoading: boolean;
  emptyCard: EmptyCardProps;
  view: DossiersView;
}) => {
  const ariaLabel = ariaLabelByView[view];

  const openDossier = useOpenDossier();
  const [openDossierId] = useOpenDossierId();
  const table = useTable({
    features,
    columns: columnsByView[view],
    data: dossiers,
    getRowId: (dossier) => dossier.auditId.toString(),
  });

  return (
    <section className="rounded-xl border border-grey-3 bg-white p-6">
      {/* Région défilante atteignable au clavier (WCAG 2.1.1). */}
      <div
        className="max-h-[90vh] overflow-auto"
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
      >
        <ReactTable
          table={table}
          ariaLabel={ariaLabel}
          className="min-w-[80rem]"
          isLoading={isLoading}
          nbLoadingRows={5}
          isEmpty={dossiers.length === 0}
          emptyCard={emptyCard}
          getRowProps={(row) => {
            // Le dossier ouvert dans le panneau reste repérable dans la liste.
            const isOpenRow = row.original.auditId === openDossierId;
            return {
              'data-test': `referentiels.labellisations-admin.dossier-${row.original.auditId}`,
              'aria-current': isOpenRow || undefined,
              // Le bouton du nom reste l'accès au clavier ; la ligne élargit la cible.
              onClick: () => openDossier(row.original.auditId),
              className: cn(
                'text-primary-9 cursor-pointer hover:bg-primary-1',
                isOpenRow && 'bg-primary-1 even:bg-primary-1'
              ),
            };
          }}
        />
      </div>
    </section>
  );
};
