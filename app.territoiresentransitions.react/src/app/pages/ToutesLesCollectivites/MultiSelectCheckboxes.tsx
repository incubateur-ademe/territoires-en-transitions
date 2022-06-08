import {TOption} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {v4 as uuid} from 'uuid';

export type TMultiSelectCheckboxesProps = {
  title: string;
  options: TOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

/**
 * Permet de sélectionner plusieurs options d'une liste via des checkboxes
 */
export const MultiSelectCheckboxes = (props: TMultiSelectCheckboxesProps) => {
  const optionsIncludingAll = [{id: 'all', libelle: 'Tous'}, ...props.options];

  const htmlId = uuid();
  const {selected, onChange} = props;
  return (
    <div>
      <div className="font-semibold text-md mb-2">{props.title}</div>
      <div className="small-checkbox  fr-checkbox-group text-sm">
        {optionsIncludingAll.map(option => (
          <div className="my-2" key={option.id}>
            <input
              type="checkbox"
              className="fr-toggle__input"
              disabled={option.id === 'all'}
              id={htmlId + option.id}
              checked={
                selected.length === 0
                  ? option.id === 'all'
                  : selected.includes(option.id as string)
              }
              onChange={e => {
                if (e.currentTarget.checked) {
                  onChange([...selected, option.id as string]);
                } else {
                  onChange(selected.filter(s => s !== option.id));
                }
              }}
            />
            <label htmlFor={htmlId + option.id}>{option.libelle}</label>
          </div>
        ))}
      </div>
    </div>
  );
};
