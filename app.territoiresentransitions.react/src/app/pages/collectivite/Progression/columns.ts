import {Column} from 'react-table';
import {CellAction} from '../ReferentielTable/CellAction';
import {CellPercent, CellPoints} from '../AidePriorisation/Cells';
import {makeFiltrePourcentage} from '../AidePriorisation/FiltrePourcentage';
import {ProgressionRow} from './queries';

export type TColumn = Column<ProgressionRow> & {accessor: string};

// défini les colonnes de la table
export const columns: TColumn[] = [
  {
    accessor: 'nom', // la clé pour accéder à la valeur
    Header: 'Actions', // rendu dans la ligne d'en-tête
    Cell: CellAction, // rendu d'une cellule
    width: '100%',
  },
  {
    accessor: 'score_realise',
    Header: makeFiltrePourcentage('score_realise', '% Réalisé'),
    Cell: CellPercent,
    width: 120,
  },
  {
    accessor: 'score_programme',
    Header: makeFiltrePourcentage('score_programme', '% Programmé'),
    Cell: CellPercent,
    width: 128,
  },
  {
    accessor: 'score_realise_plus_programme',
    Header: makeFiltrePourcentage(
      'score_realise_plus_programme',
      '% Réa. + Prog.'
    ),
    Cell: CellPercent,
    width: 125,
  },
  {
    accessor: 'score_pas_fait',
    Header: makeFiltrePourcentage('score_pas_fait', '% Pas fait'),
    Cell: CellPercent,
    width: 125,
  },
  {
    accessor: 'score_non_renseigne',
    Header: makeFiltrePourcentage('score_non_renseigne', '% Non renseigné'),
    Cell: CellPercent,
    width: 125,
  },
  {
    accessor: 'points_realises',
    Header: 'Points réalisés',
    Cell: CellPoints,
    width: 125,
  },
  {
    accessor: 'points_programmes',
    Header: 'Points programmés',
    Cell: CellPoints,
    width: 125,
  },
  {
    accessor: 'points_max_personnalises',
    Header: 'Points max. personnalisés',
    Cell: CellPoints,
    width: 125,
  },
  {
    accessor: 'points_max_referentiel',
    Header: 'Points max. référentiel',
    Cell: CellPoints,
    width: 125,
  },
];

// les colonnes toujours visibles
const alwaysVisible = ['nom'];

// les colonnes initialement cachées
export type TColumnOptions = {
  visibleColumns: string[];
};
export type TSetColumnOptions = (newOptions: TColumnOptions | null) => void;

export const initialColumnOptions: TColumnOptions = {
  visibleColumns: ['score_realise', 'score_programme'],
};

// mapping nom de l'option => params dans l'url
export const optionToShortNames: Record<keyof TColumnOptions, string> = {
  visibleColumns: 'c',
};

export const getHiddenColumnsId = (visibleColumns: string[]) =>
  columns
    .filter(
      ({accessor}) =>
        !alwaysVisible.includes(accessor) &&
        !visibleColumns.includes(accessor as string)
    )
    .map(({accessor}) => accessor);

export const initialState = {
  hiddenColumns: getHiddenColumnsId(initialColumnOptions.visibleColumns),
};
