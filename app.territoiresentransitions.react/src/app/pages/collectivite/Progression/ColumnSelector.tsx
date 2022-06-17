import {MultiSelectColumn} from 'ui/shared/MultiSelectColumn';

export const columns = [
  {separator: 'Part du total personnalisé'},
  {value: 'score_realise', label: '% Réalisé'},
  {value: 'score_programme', label: '% Programmé'},
  {value: 'score_realise_plus_programme', label: '% Réalisé + Programmé'},
  {value: 'score_pas_fait', label: '% Pas fait'},
  {value: 'score_non_renseigne', label: '% Non renseigné'},
  {separator: 'Points'},
  {value: 'points_realises', label: 'Points réalisés'},
  {value: 'points_programmes', label: 'Points programmés'},
  {value: 'points_max_personnalises', label: 'Points max. personnalisés'},
  {value: 'points_max_referentiel', label: 'Points max. référentiel'},
];

// mapping nom des colonnes => params dans l'url
export const colNameToShortNames: Record<string, string> = {
  score_realise: 'r',
  score_programme: 'p',
  score_realise_plus_programme: 'rp',
  score_pas_fait: 'pf',
  score_non_renseigne: 'nr',
  points_realises: 'pr',
  points_programmes: 'pp',
  points_max_personnalises: 'mp',
  points_max_referentiel: 'mr',
};

export type TColumnSelectorProps = {
  className?: string;
  selectedColumns: string[];
  setSelectedColumns: (cols: string[]) => void;
};

/**
 * Affiche le sélecteur de colonnes
 */
export const ColumnSelector = (props: TColumnSelectorProps) => {
  const {className, selectedColumns, setSelectedColumns} = props;

  return (
    <MultiSelectColumn
      className={className}
      values={selectedColumns}
      items={columns}
      onChange={setSelectedColumns}
    />
  );
};
