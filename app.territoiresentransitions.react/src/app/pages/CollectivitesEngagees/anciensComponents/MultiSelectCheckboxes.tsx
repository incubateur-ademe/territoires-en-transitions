import {TOption} from 'ui/shared/select/commons';

export type TMultiSelectCheckboxesProps = {
  htmlId: string;
  title: string;
  options: TOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

/**
 * Permet de sélectionner plusieurs options d'une liste via des checkboxes
 */
export const MultiSelectCheckboxes = (props: TMultiSelectCheckboxesProps) => {
  const {htmlId, selected, title, options, onChange} = props;
  const optionsIncludingAll = [{value: 'all', label: 'Tous'}, ...options];

  return (
    <div>
      <div className="font-semibold text-md mb-2">{title}</div>
      <div className="small-checkbox  fr-checkbox-group text-sm">
        {optionsIncludingAll.map(option => (
          <div className="my-2" key={option.value}>
            <input
              type="checkbox"
              className="fr-toggle__input"
              id={htmlId + option.value}
              disabled={option.value === 'all' && selected.length === 0}
              checked={
                selected.length === 0
                  ? option.value === 'all'
                  : selected.includes(option.value as string)
              }
              onChange={e => {
                if (e.currentTarget.checked) {
                  if (option.value === 'all') {
                    onChange([]);
                  } else onChange([...selected, option.value as string]);
                } else {
                  onChange(selected.filter(s => s !== option.value));
                }
              }}
            />
            <label htmlFor={htmlId + option.value}>{option.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};
