import {ChangeEvent} from 'react';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import {menuOptions} from '../MultiSelectFilter';
import '../MultiSelectFilter/MultiSelectFilter.css';
import './MultiSelectColumn.css';

type TItem = {value: string; label: string};
type TSeparator = {separator: string};
type TItemOrSep = TItem | TSeparator;

export type TMultiSelectColumnProps = {
  /** pour surcharger les styles de l'élément principal */
  className?: string;
  /** valeurs des options sélectionnées */
  values: string[];
  /** liste des options */
  items: TItemOrSep[];
  /** appelée quand les options sélectionnée changent (reçoit les nouvelles valeurs) */
  onChange: (values: string[]) => void;
};

const getHiddenColsCount = ({values, items}: TMultiSelectColumnProps) =>
  items.filter(item => !('separator' in item)).length - (values?.length || 0);

/**
 * Affiche une liste déroulante permettant la multi-sélection
 */
export const MultiSelectColumn = (props: TMultiSelectColumnProps) => {
  const {className, values, items, onChange} = props;
  const hiddenColsCount = getHiddenColsCount(props);

  // le picto est différent si tout est sélectionné ou non
  const icon = hiddenColsCount === 0 ? 'fr-fi-eye-line' : 'fr-fi-eye-off-line';
  const label =
    hiddenColsCount > 1
      ? `${hiddenColsCount} colonnes masquées`
      : `${hiddenColsCount} colonne masquée`;

  // gère la sélection/déselection d'item dans la liste
  const handleChange = (event: ChangeEvent<{value: unknown}>) => {
    onChange((event?.target.value as string[]) || []);
  };

  return (
    <Select
      className={`multi-select ${className || ''}`}
      multiple
      displayEmpty
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
      {items.map((item, index) =>
        'separator' in item ? (
          <MenuItem disabled key={`s${index}`}>
            <span className="option separator">{item.separator}</span>
          </MenuItem>
        ) : (
          <MenuItem
            key={item.value}
            value={item.value}
            className={
              values.indexOf(item.value) !== -1
                ? 'fr-fi-check-line'
                : 'offset-item'
            }
          >
            <span className={`option ${item.value}`}>{item.label}</span>
          </MenuItem>
        )
      )}
    </Select>
  );
};
