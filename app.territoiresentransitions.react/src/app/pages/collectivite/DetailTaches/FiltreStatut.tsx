import {ChangeEvent} from 'react';
import {MenuProps} from '@material-ui/core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import './FiltreStatut.css';

export type TFiltreStatutProps = {
  className?: string;
  values: string[];
  onChange: (values: string[]) => void;
};

const ITEMS = [
  {
    value: 'non_concerne',
    label: 'Non concerné',
  },
  {
    value: 'non_renseigne',
    label: 'Non renseigné',
  },
  {
    value: 'pas_fait',
    label: 'Pas fait',
  },
  {
    value: 'programme',
    label: 'Programmé',
  },
  {
    value: 'detaille',
    label: 'Détaillé',
  },
  {
    value: 'fait',
    label: 'Fait',
  },
];

const ITEM_ALL = 'tous';

const getIsAllSelected = (values?: string[]) =>
  !values?.length || values.indexOf(ITEM_ALL) !== -1;

// positionnement de la liste déroulante
const menuOptions: Partial<MenuProps> = {
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'left',
  },
  transformOrigin: {
    vertical: 'top',
    horizontal: 'left',
  },
  getContentAnchorEl: null,
};

/**
 * Affiche le filtre par statuts
 */
export const FiltreStatut = (props: TFiltreStatutProps) => {
  const {className, values, onChange} = props;
  const isAllSelected = getIsAllSelected(values);

  // le picto est différent si un ou plusieurs filtres sont séléectionnés
  const icon = isAllSelected ? 'fr-fi-filter-line' : 'fr-fi-filter-fill';

  const handleChange = (event: ChangeEvent<{value: unknown}>) => {
    const newValues = (event?.target.value as string[]) || [];
    // évite d'avoir aucun item sélectionné
    if (!newValues.length) {
      return;
    }
    const newValuesIncludesAll = getIsAllSelected(newValues);
    // supprime les autres items de la sélection quand "tous" est sélectionné
    if (newValuesIncludesAll && !isAllSelected) {
      onChange([ITEM_ALL]);
    } else {
      // sinon évite que "tous" reste dans la nouvelle sélection
      onChange(newValues.filter(f => f !== ITEM_ALL));
    }
  };

  return (
    <Select
      className={className}
      multiple
      value={values}
      variant="outlined"
      IconComponent={() => null}
      renderValue={() => (
        <span className={`${icon} fr-fi--sm`}>&nbsp;Statuts</span>
      )}
      MenuProps={menuOptions}
      onChange={handleChange}
    >
      <MenuItem
        key="tous"
        value="tous"
        className={`item ${isAllSelected ? 'fr-fi-check-line' : ''}`}
      >
        Tous les statuts
      </MenuItem>
      {ITEMS.map(({value, label}) => (
        <MenuItem
          key={value}
          value={value}
          className={
            !isAllSelected && values.indexOf(value) !== -1
              ? 'fr-fi-check-line'
              : ''
          }
        >
          <span className={`statut-label ${value}`}>{label}</span>
        </MenuItem>
      ))}
    </Select>
  );
};
