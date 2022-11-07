import classNames from 'classnames';
import {ReactElement} from 'react';
import {MultiSelectDropdown} from 'ui/shared/SelectDropdown';

export type TMultiSelectFilterProps = {
  /** pour surcharger les styles de l'élément principal */
  className?: string;
  /** libellé de la liste déroulante */
  label: string;
  /** valeurs des options sélectionnées */
  values: string[];
  /** liste des options */
  items: {value: string; label: string}[];
  /** fait le rendu d'un item de la liste (optionnel) */
  renderValue?: (value: string) => ReactElement;
  /** appelée quand les options sélectionnée changent (reçoit les nouvelles valeurs) */
  onChange: (values: string[]) => void;
};

export const ITEM_ALL = 'tous';

const getIsAllSelected = (values?: string[]) =>
  !values?.length || values.indexOf(ITEM_ALL) !== -1;

/**
 * Affiche un filtre avec une liste déroulante permettant la multi-sélection
 */
export const MultiSelectFilter = (props: TMultiSelectFilterProps) => {
  const {label, values, items, onChange, renderValue} = props;
  const isAllSelected = getIsAllSelected(values);
  let labels = new Map<string, string>();
  items.forEach(({label, value}) => labels.set(value, label));

  // le picto est différent si un ou plusieurs filtres sont sélectionnés
  const icon = isAllSelected ? 'fr-fi-filter-line' : 'fr-fi-filter-fill';

  // gère la sélection/déselection d'item dans la liste
  const handleChange = (newValues: string[]) => {
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
    <MultiSelectDropdown
      buttonClassName="flex items-center px-4 py-1 text-left text-sm"
      values={values}
      options={items}
      renderValue={v =>
        renderValue ? (
          renderValue(v)
        ) : (
          <span
            className={classNames('pr-4 py-1', {
              'fr-text-mention--grey': v === ITEM_ALL,
            })}
          >
            {labels.get(v)}
          </span>
        )
      }
      renderSelection={() => (
        <span className={`${icon} fr-fi--sm fr-text-label--blue-france`}>
          &nbsp;{label}
        </span>
      )}
      onSelect={handleChange}
    />
  );
};
