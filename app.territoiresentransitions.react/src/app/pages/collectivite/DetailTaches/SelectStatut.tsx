import {ChangeEvent} from 'react';
import {MenuProps} from '@material-ui/core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import './statuts.css';

export type TSelectStatutProps = {
  className?: string;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
};

export const ITEMS = [
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
 * Affiche le filtre par statuts
 */
export const SelectStatut = (props: TSelectStatutProps) => {
  const {className, disabled, value, onChange} = props;

  const handleChange = (event: ChangeEvent<{value: unknown}>) => {
    const value = event?.target?.value as string;
    if (value) {
      onChange(value);
    }
  };

  return (
    <Select
      className={className}
      value={value}
      variant="outlined"
      disabled={disabled}
      renderValue={() => (
        <span className={`statut-label ${value}`}>
          {ITEMS.find(item => item.value === value)?.label}
        </span>
      )}
      MenuProps={menuOptions}
      onChange={handleChange}
    >
      {ITEMS.map(({value, label}) => (
        <MenuItem key={value} value={value}>
          <span className={`statut-label ${value}`}>{label}</span>
        </MenuItem>
      ))}
    </Select>
  );
};
