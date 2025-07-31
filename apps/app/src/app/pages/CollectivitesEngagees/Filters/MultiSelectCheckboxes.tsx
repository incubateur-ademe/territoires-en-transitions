import { Checkbox, Option } from '@/ui';

export type TMultiSelectCheckboxesProps = {
  htmlId: string;
  title: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

/**
 * Permet de sélectionner plusieurs options d'une liste via des checkboxes
 */
export const MultiSelectCheckboxes = (props: TMultiSelectCheckboxesProps) => {
  const { selected, title, options, onChange } = props;
  const optionsIncludingAll = [{ value: 'all', label: 'Tous' }, ...options];

  return (
    <div>
      <div className="font-bold py-4 mb-6 border-b border-b-primary-3">
        {title}
      </div>
      <div className="flex flex-col gap-4">
        {optionsIncludingAll.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            disabled={option.value === 'all' && selected.length === 0}
            checked={
              selected.length === 0
                ? option.value === 'all'
                : selected.includes(option.value as string)
            }
            onChange={(e) => {
              if (e.currentTarget.checked) {
                if (option.value === 'all') {
                  onChange([]);
                } else onChange([...selected, option.value as string]);
              } else {
                onChange(selected.filter((s) => s !== option.value));
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};
