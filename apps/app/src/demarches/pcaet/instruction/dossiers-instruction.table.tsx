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
import { createContext, useContext, useMemo } from 'react';
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

type Filtres = {
  statuts: PcaetStatutInstruction[];
  obligations: DemarchePcaetObligation[];
  regions: string[];
};

type Pilotage = {
  deposeAvis: boolean;
  regionsOptions: { code: string; libelle: string }[];
  filtres: Filtres;
  nbFiltresActifs: NbFiltresActifs;
  setFiltres: (filtres: Partial<Filtres>) => void;
  sort: ColonneTriable;
  direction: DirectionTri;
  trierPar: (colonne: ColonneTriable) => void;
};

/**
 * Le tri et les filtres atteignent les en-têtes par le contexte, et non par une
 * fermeture.
 *
 * Les colonnes sont définies **une fois pour toutes**, hors du composant : un
 * en-tête reconstruit à chaque rendu change d'identité aux yeux de React, qui le
 * démonte et le remonte. Le menu du filtre qu'il porte se referme alors entre
 * deux clics, et il devient impossible d'en cocher deux d'affilée.
 */
const PilotageContext = createContext<Pilotage | null>(null);

const usePilotage = (): Pilotage => {
  const pilotage = useContext(PilotageContext);
  if (pilotage === null) {
    throw new Error(
      'Les en-têtes de la liste d’instruction attendent un PilotageContext.'
    );
  }
  return pilotage;
};

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

const CollectiviteHeader = () => {
  const { filtres, nbFiltresActifs, setFiltres, sort, direction, trierPar } =
    usePilotage();

  return (
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
  );
};

const RegionHeader = () => {
  const { filtres, nbFiltresActifs, setFiltres, regionsOptions } =
    usePilotage();

  return (
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
  );
};

const PiloteHeader = () => {
  const { sort, direction, trierPar } = usePilotage();

  return (
    <TableHeaderCell
      title={appLabels.instructionListeColonnePilotes}
      sortFn={() => trierPar('contact')}
      sortDirection={sort === 'contact' ? direction : null}
    />
  );
};

const StatutHeader = () => {
  const {
    deposeAvis,
    filtres,
    nbFiltresActifs,
    setFiltres,
    sort,
    direction,
    trierPar,
  } = usePilotage();

  return (
    <TableHeaderCell
      className="w-56"
      title={appLabels.instructionListeColonneStatut}
      sortFn={() => trierPar('statut')}
      sortDirection={sort === 'statut' ? direction : null}
      filter={
        <StatutHeaderFilter
          deposeAvis={deposeAvis}
          statuts={filtres.statuts}
          filterCount={nbFiltresActifs.statuts}
          onChange={(statuts) => setFiltres({ statuts })}
        />
      }
    />
  );
};

const DateLancementHeader = () => {
  const { sort, direction, trierPar } = usePilotage();

  return (
    <TableHeaderCell
      className="w-36"
      title={appLabels.instructionListeColonneDateLancement}
      sortFn={() => trierPar('dateLancement')}
      sortDirection={sort === 'dateLancement' ? direction : null}
    />
  );
};

const EcheanceHeader = () => {
  const { sort, direction, trierPar } = usePilotage();

  return (
    <TableHeaderCell
      className="w-40"
      title={appLabels.instructionListeColonneEcheance}
      sortFn={() => trierPar('echeance')}
      sortDirection={sort === 'echeance' ? direction : null}
    />
  );
};

const columnHelper = createColumnHelper<Dossier>();

/**
 * Les largeurs sont posées colonne par colonne, et volontairement absentes des
 * deux qui portent du texte libre.
 *
 * Le tableau est en `table-fixed` : sans elles, une date et un nom de
 * collectivité occupent la même part de la largeur, et les sept colonnes
 * s'étalent bien au-delà de ce qu'elles ont à montrer.
 */
const columns = [
  columnHelper.display({
    id: 'collectivite',
    header: CollectiviteHeader,
    cell: ({ row }) => (
      <TableCell>
        <CollectiviteCell dossier={row.original} />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'region',
    header: RegionHeader,
    cell: ({ row }) => (
      <TableCell>
        <RegionCell dossier={row.original} />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'pilote',
    header: PiloteHeader,
    cell: ({ row }) => (
      <TableCell>
        <PiloteCell dossier={row.original} />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'statut',
    header: StatutHeader,
    cell: ({ row }) => (
      <TableCell>
        <Badge
          title={statutInstructionLabel(row.original.statut, {
            deposeAvis: row.original.deposeAvis,
          })}
          variant={STATUT_INSTRUCTION_VARIANTS[row.original.statut]}
          size="sm"
        />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'dateLancement',
    header: DateLancementHeader,
    cell: ({ row }) => (
      <TableCell>
        <DateCell date={row.original.launchedAt} />
      </TableCell>
    ),
  }),

  columnHelper.display({
    id: 'echeance',
    header: EcheanceHeader,
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
];

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
  filtres: Filtres;
  /**
   * Ce que chaque filtre retient **une fois le défaut mis à part** : c'est le
   * nombre que porte son badge, et non la taille de la sélection. Voir
   * `nbFiltresActifs`.
   */
  nbFiltresActifs: NbFiltresActifs;
  setFiltres: (filtres: Partial<Filtres>) => void;
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
  const pilotage = useMemo(
    () => ({
      deposeAvis,
      regionsOptions,
      filtres,
      nbFiltresActifs,
      setFiltres,
      sort,
      direction,
      trierPar,
    }),
    [
      deposeAvis,
      regionsOptions,
      filtres,
      nbFiltresActifs,
      setFiltres,
      sort,
      direction,
      trierPar,
    ]
  );

  const table = useReactTable({
    columns,
    data: dossiers,
    // La colonne se masque plutôt qu'elle ne disparaît de la définition : la
    // retirer changerait la liste des colonnes, donc l'identité des en-têtes.
    state: { columnVisibility: { region: afficherRegion } },
    // Le tri et le filtrage se font côté serveur, page par page : la clé d'une
    // ligne doit donc venir du dossier, et non de son rang dans la page.
    getRowId: getRowKey,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PilotageContext.Provider value={pilotage}>
      <ReactTable
        table={table}
        ariaLabel={appLabels.instructionListeIntitule({ deposeAvis })}
        isEmpty={dossiers.length === 0}
        emptyCard={{ className: 'min-h-[12rem]', ...etatVide }}
        getRowProps={(row) => ({
          'data-test': `demarches.pcaet.instruction.ligne-${row.id}`,
        })}
      />
    </PilotageContext.Provider>
  );
};
