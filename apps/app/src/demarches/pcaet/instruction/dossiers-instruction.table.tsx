'use client';

import { appLabels } from '@/app/labels/catalog';
import type { DemarchePcaetObligation } from '@tet/domain/demarches';
import { type PcaetStatutInstruction } from '@tet/domain/demarches';
import type { EmptyCardProps } from '@tet/ui';
import { Badge, ReactTable, TableCell, TableHeaderCell } from '@tet/ui';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo } from 'react';
import type {
  ColonneTriable,
  DirectionTri,
  NbFiltresActifs,
} from './data/use-list-dossiers-instruction';
import {
  ActionsCell,
  CollectiviteCell,
  DateCell,
  EcheanceCell,
  PiloteCell,
  RegionCell,
  type Dossier,
} from './dossiers-instruction.cells';
import {
  ObligationHeaderFilter,
  RegionHeaderFilter,
  StatutHeaderFilter,
} from './dossiers-instruction.header-filters';
import {
  statutInstructionLabel,
  STATUT_INSTRUCTION_VARIANTS,
} from './instruction.constants';

/**
 * La clé d'une ligne, du plus précis au plus général.
 *
 * Une collectivité peut en porter plusieurs — un PCAET publié et son
 * renouvellement en cours sont deux dossiers — et celle qui n'a rien déposé n'a
 * pas de démarche à nommer. La saisine passe en premier : c'est par elle que
 * les tests et les liens désignent un dossier.
 */
const getRowKey = (dossier: Dossier): string => {
  if (dossier.demandeAvisId !== null) {
    return `demande-${dossier.demandeAvisId}`;
  }
  return dossier.demarcheId !== null
    ? `demarche-${dossier.demarcheId}`
    : `collectivite-${dossier.collectivite.id}`;
};

const columnHelper = createColumnHelper<Dossier>();

export const DossiersInstructionTable = ({
  dossiers,
  deposeAvis,
  afficherRegion,
  regionsOptions,
  filtres,
  nbFiltresActifs,
  setFiltres,
  sort,
  direction,
  trierPar,
  etatVide,
}: {
  dossiers: Dossier[];
  /**
   * Le nom accessible du tableau suit la famille, comme le titre visible : il
   * dit ce que ce service fait d'ordinaire.
   *
   * Le statut de chaque ligne, lui, se lit sur la ligne — `dossier.deposeAvis`.
   * Une DREAL dépose sur le dossier de sa région et lit celui de l'EPCI voisin
   * qui déborde chez elle : les deux tiennent dans ce tableau.
   */
  deposeAvis: boolean;
  /**
   * La région n'a de sens que pour un service qui en couvre plusieurs : un
   * national, ou la DR ADEME Océan Indien. Ailleurs, la colonne répéterait la
   * même valeur sur chaque ligne.
   */
  afficherRegion: boolean;
  regionsOptions: { code: string; libelle: string }[];
  filtres: {
    statuts: PcaetStatutInstruction[];
    obligations: DemarchePcaetObligation[];
    regions: string[];
  };
  /**
   * Ce que chaque filtre retient **une fois le défaut mis à part** : c'est le
   * nombre que porte son badge, et non la taille de la sélection. Voir
   * `nbFiltresActifs`.
   */
  nbFiltresActifs: NbFiltresActifs;
  setFiltres: (filtres: {
    statuts?: PcaetStatutInstruction[];
    obligations?: DemarchePcaetObligation[];
    regions?: string[];
  }) => void;
  sort: ColonneTriable;
  direction: DirectionTri;
  trierPar: (colonne: ColonneTriable) => void;
  /**
   * Ce qu'affiche le corps du tableau quand rien ne ressort.
   *
   * Dans le tableau et non à sa place : l'en-tête porte les filtres, et c'est
   * précisément eux que l'agent doit pouvoir desserrer. Les masquer le
   * laisserait devant un écran vide sans prise.
   */
  etatVide: EmptyCardProps;
}) => {
  /**
   * Les largeurs sont posées colonne par colonne, et volontairement absentes
   * des deux qui portent du texte libre.
   *
   * Le tableau est en `table-fixed` : sans elles, une date et un nom de
   * collectivité occupent la même part de la largeur, et les sept colonnes
   * s'étalent bien au-delà de ce qu'elles ont à montrer.
   */
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'collectivite',
        header: () => (
          <TableHeaderCell
            title={appLabels.instructionListeColonneCollectivite}
            sortFn={() => trierPar('collectivite')}
            sortDirection={sort === 'collectivite' ? direction : null}
            filter={
              <ObligationHeaderFilter
                obligations={filtres.obligations}
                filterCount={nbFiltresActifs.obligations}
                onChange={(obligations) => setFiltres({ obligations })}
              />
            }
          />
        ),
        cell: ({ row }) => (
          <TableCell>
            <CollectiviteCell dossier={row.original} />
          </TableCell>
        ),
      }),

      ...(afficherRegion
        ? [
            columnHelper.display({
              id: 'region',
              header: () => (
                <TableHeaderCell
                  className="w-40"
                  title={appLabels.instructionListeColonneRegion}
                  filter={
                    <RegionHeaderFilter
                      regions={filtres.regions}
                      options={regionsOptions}
                      filterCount={nbFiltresActifs.regions}
                      onChange={(regions) => setFiltres({ regions })}
                    />
                  }
                />
              ),
              cell: ({ row }) => (
                <TableCell>
                  <RegionCell dossier={row.original} />
                </TableCell>
              ),
            }),
          ]
        : []),

      columnHelper.display({
        id: 'pilote',
        header: () => (
          <TableHeaderCell
            title={appLabels.instructionListeColonnePilotes}
            sortFn={() => trierPar('contact')}
            sortDirection={sort === 'contact' ? direction : null}
          />
        ),
        cell: ({ row }) => (
          <TableCell>
            <PiloteCell dossier={row.original} />
          </TableCell>
        ),
      }),

      columnHelper.display({
        id: 'statut',
        header: () => (
          <TableHeaderCell
            className="w-40"
            title={appLabels.instructionListeColonneStatut}
            sortFn={() => trierPar('statut')}
            sortDirection={sort === 'statut' ? direction : null}
            filter={
              <StatutHeaderFilter
                statuts={filtres.statuts}
                filterCount={nbFiltresActifs.statuts}
                onChange={(statuts) => setFiltres({ statuts })}
              />
            }
          />
        ),
        cell: ({ row }) => (
          <TableCell>
            <Badge
              title={statutInstructionLabel(row.original.statut)}
              variant={STATUT_INSTRUCTION_VARIANTS[row.original.statut]}
              size="sm"
            />
          </TableCell>
        ),
      }),

      columnHelper.display({
        id: 'dateDebut',
        header: () => (
          <TableHeaderCell
            className="w-36"
            title={appLabels.instructionListeColonneDateLancement}
            sortFn={() => trierPar('dateDebut')}
            sortDirection={sort === 'dateDebut' ? direction : null}
          />
        ),
        cell: ({ row }) => (
          <TableCell>
            <DateCell date={row.original.launchedAt} />
          </TableCell>
        ),
      }),

      columnHelper.display({
        id: 'echeance',
        header: () => (
          <TableHeaderCell
            className="w-40"
            title={appLabels.instructionListeColonneEcheance}
            sortFn={() => trierPar('echeance')}
            sortDirection={sort === 'echeance' ? direction : null}
          />
        ),
        cell: ({ row }) => (
          <TableCell>
            <EcheanceCell dossier={row.original} />
          </TableCell>
        ),
      }),

      columnHelper.display({
        id: 'actions',
        header: () => (
          <TableHeaderCell
            className="w-52"
            title={appLabels.instructionListeColonneActions}
            align="right"
          />
        ),
        cell: ({ row }) => (
          <TableCell>
            <ActionsCell dossier={row.original} />
          </TableCell>
        ),
      }),
    ],
    [
      afficherRegion,
      direction,
      filtres,
      nbFiltresActifs,
      regionsOptions,
      setFiltres,
      sort,
      trierPar,
    ]
  );

  const table = useReactTable({
    columns,
    data: dossiers,
    // Le tri et le filtrage se font côté serveur, page par page : la clé d'une
    // ligne doit donc venir du dossier, et non de son rang dans la page.
    getRowId: getRowKey,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <ReactTable
      table={table}
      ariaLabel={appLabels.instructionListeIntitule({ deposeAvis })}
      isEmpty={dossiers.length === 0}
      emptyCard={{ className: 'min-h-[12rem]', ...etatVide }}
      getRowProps={(row) => ({
        'data-test': `demarches.pcaet.instruction.ligne-${row.id}`,
      })}
    />
  );
};
