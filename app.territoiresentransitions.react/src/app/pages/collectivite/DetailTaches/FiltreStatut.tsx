import {MultiSelectFilter, ITEM_ALL} from 'ui/shared/MultiSelectFilter';
import {ITEMS} from './SelectStatut';
import './statuts.css';

export type TFiltreStatutProps = {
  className?: string;
  values: string[];
  onChange: (values: string[]) => void;
};

const items = [{value: ITEM_ALL, label: 'Tous les statuts'}, ...ITEMS];

/**
 * Affiche le filtre par statuts
 */
export const FiltreStatut = (props: TFiltreStatutProps) => {
  const {className, values, onChange} = props;

  return (
    <MultiSelectFilter
      className={`filtre-statut ${className || ''}`}
      label="Statut"
      values={values}
      items={items}
      onChange={onChange}
    />
  );
};
