import {TSelectOption} from 'app/pages/ToutesLesCollectivites/types';
import {useEffect, useState} from 'react';

export type TMultiSelectCheckboxesProps<T extends string> = {
  title: string;
  options: TSelectOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
};

/**
 * Permet de sélectionner plusieurs options d'une liste via des checkboxes
 */
export const MultiSelectCheckboxes = <T extends string>(
  props: TMultiSelectCheckboxesProps<T>
) => {
  const optionsIncludingAll = [{id: 'all', libelle: 'Tous'}, ...props.options];
  const [selected, setSelected] = useState<T[]>(props.selected);
  useEffect(() => props.onChange(selected), [selected.length]);
  return (
    <div>
      <div className="font-semibold text-sm mb-2">{props.title}</div>
      <div className="small-checkbox  fr-checkbox-group text-sm">
        {optionsIncludingAll.map(option => (
          <div className="my-2" key={option.id}>
            <input
              type="checkbox"
              className="fr-toggle__input"
              disabled={option.id === 'all'}
              id={option.id}
              checked={
                selected.length === 0
                  ? option.id === 'all'
                  : selected.includes(option.id as T)
              }
              onChange={e => {
                if (e.currentTarget.checked) {
                  setSelected([...selected, option.id as T]);
                } else {
                  setSelected(selected.filter(s => s !== option.id));
                }
              }}
            />
            <label htmlFor={option.id}>{option.libelle}</label>
          </div>
        ))}
      </div>
    </div>
  );
};
