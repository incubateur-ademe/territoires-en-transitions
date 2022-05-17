import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import './FiltreStatut.css';
import {ChangeEvent, ReactNode} from 'react';

export type TFiltreStatutProps = {
  className?: string;
  values: string[];
  onChange: (
    event: ChangeEvent<{
      name?: string | undefined;
      value: unknown;
    }>,
    child: ReactNode
  ) => void;
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

/**
 * Affiche le filtre par statuts
 */
export const FiltreStatut = (props: TFiltreStatutProps) => {
  const {className, values, onChange} = props;
  const allIsSelected = !values?.length || values.indexOf('tous') !== -1;
  const icon = allIsSelected ? 'fr-fi-filter-line' : 'fr-fi-filter-fill';

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
      MenuProps={{
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'left',
        },
        getContentAnchorEl: null,
      }}
      onChange={onChange}
    >
      <MenuItem
        key="tous"
        value="tous"
        className={`item ${allIsSelected ? 'fr-fi-check-line' : ''}`}
      >
        Tous les statuts
      </MenuItem>
      {ITEMS.map(({value, label}) => (
        <MenuItem
          key={value}
          value={value}
          className={
            !allIsSelected && values.indexOf(value) !== -1
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
