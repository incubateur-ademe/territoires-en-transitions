import {ChangeEvent} from 'react';
import Select from '@material-ui/core/Select';
import {MenuProps} from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import './MultiSelectFilter.css';

export type TMultiSelectFilterProps = {
  /** pour surcharger les styles de l'élément principal */
  className?: string;
  /** libellé de la liste déroulante */
  label: string;
  /** valeurs des options sélectionnées */
  values: string[];
  /** liste des options */
  items: {value: string; label: string}[];
  /** appelée quand les options sélectionnée changent (reçoit les nouvelles valeurs) */
  onChange: (values: string[]) => void;
};

export const ITEM_ALL = 'tous';

const getIsAllSelected = (values?: string[]) =>
  !values?.length || values.indexOf(ITEM_ALL) !== -1;

// positionnement de la liste déroulante
export const menuOptions: Partial<MenuProps> = {
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
 * Affiche un filtre avec une liste déroulante permettant la multi-sélection
 */
export const MultiSelectFilter = (props: TMultiSelectFilterProps) => {
  const {className, label, values, items, onChange} = props;
  const isAllSelected = getIsAllSelected(values);

  // le picto est différent si un ou plusieurs filtres sont sélectionnés
  const icon = isAllSelected ? 'fr-fi-filter-line' : 'fr-fi-filter-fill';

  // gère la sélection/déselection d'item dans la liste
  const handleChange = (event: ChangeEvent<{value: unknown}>) => {
    const newValues = (event?.target.value as string[]) || [];
    // évite d'avoir aucun item sélectionné
    if (!newValues.length) {
      if (!isAllSelected) {
        onChange([ITEM_ALL]);
      } else {
        return;
      }
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
      className={`multi-select ${className || ''}`}
      multiple
      value={values}
      variant="outlined"
      IconComponent={() => null}
      renderValue={() => (
        <span className={`${icon} fr-fi--sm`}>&nbsp;{label}</span>
      )}
      MenuProps={{
        ...menuOptions,
        PaperProps: {
          className: `multi-select ${className || ''}`,
        },
      }}
      onChange={handleChange}
    >
      {items.map(({value, label}) => (
        <MenuItem
          key={value}
          value={value}
          className={
            values.indexOf(value) !== -1 ? 'fr-fi-check-line' : 'offset-item'
          }
        >
          <span className={`option ${value}`}>{label}</span>
        </MenuItem>
      ))}
    </Select>
  );
};
