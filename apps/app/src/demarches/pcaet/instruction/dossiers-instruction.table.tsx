'use client';

import { appLabels } from '@/app/labels/catalog';
import type { DemarchePcaetObligation } from '@tet/domain/demarches';
import { type PcaetStatutInstruction } from '@tet/domain/demarches';
import type { EmptyCardProps } from '@tet/ui';
import {
  Badge,
  Table,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
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

/** Les colonnes rendues, dans l'ordre : c'est ce qui donne son `colSpan` à l'état vide. */
const colonnes = (afficherRegion: boolean): string[] =>
  [
    'collectivite',
    afficherRegion ? 'region' : null,
    'pilote',
    'statut',
    'dateDebut',
    'echeance',
    'actions',
  ].filter((colonne): colonne is string => colonne !== null);

/**
 * La clé d'une ligne, du plus précis au plus général.
 *
 * Une collectivité peut en porter plusieurs — un PCAET publié et son
 * renouvellement en cours sont deux dossiers — et celle qui n'a rien déposé n'a
 * pas de démarche à nommer. La saisine passe en premier : c'est par elle que
 * les tests et les liens désignent un dossier.
 */
const cleLigne = (dossier: Dossier): string => {
  if (dossier.demandeAvisId !== null) {
    return `demande-${dossier.demandeAvisId}`;
  }
  return dossier.demarcheId !== null
    ? `demarche-${dossier.demarcheId}`
    : `collectivite-${dossier.collectivite.id}`;
};

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
}) => (
  <Table aria-label={appLabels.instructionListeIntitule({ deposeAvis })}>
    <TableHead>
      <TableRow>
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
        {afficherRegion && (
          <TableHeaderCell
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
        )}
        <TableHeaderCell
          title={appLabels.instructionListeColonnePilote}
          sortFn={() => trierPar('contact')}
          sortDirection={sort === 'contact' ? direction : null}
        />
        <TableHeaderCell
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
        <TableHeaderCell
          title={appLabels.instructionListeColonneDateLancement}
          sortFn={() => trierPar('dateDebut')}
          sortDirection={sort === 'dateDebut' ? direction : null}
        />
        <TableHeaderCell
          title={appLabels.instructionListeColonneEcheance}
          sortFn={() => trierPar('echeance')}
          sortDirection={sort === 'echeance' ? direction : null}
        />
        <TableHeaderCell
          title={appLabels.instructionListeColonneActions}
          className="text-right"
        />
      </TableRow>
    </TableHead>
    <tbody>
      {dossiers.length === 0 && (
        <TableEmpty
          columnIds={colonnes(afficherRegion)}
          className="min-h-[12rem]"
          {...etatVide}
        />
      )}
      {dossiers.map((dossier) => (
        <TableRow
          key={cleLigne(dossier)}
          data-test={`demarches.pcaet.instruction.ligne-${cleLigne(dossier)}`}
        >
          <TableCell>
            <CollectiviteCell dossier={dossier} />
          </TableCell>
          {afficherRegion && (
            <TableCell>
              <RegionCell dossier={dossier} />
            </TableCell>
          )}
          <TableCell>
            <PiloteCell dossier={dossier} />
          </TableCell>
          <TableCell>
            <Badge
              title={statutInstructionLabel(dossier.statut)}
              variant={STATUT_INSTRUCTION_VARIANTS[dossier.statut]}
              size="sm"
            />
          </TableCell>
          <TableCell>
            <DateCell date={dossier.launchedAt} />
          </TableCell>
          <TableCell>
            <EcheanceCell dossier={dossier} />
          </TableCell>
          <TableCell>
            <ActionsCell dossier={dossier} />
          </TableCell>
        </TableRow>
      ))}
    </tbody>
  </Table>
);
