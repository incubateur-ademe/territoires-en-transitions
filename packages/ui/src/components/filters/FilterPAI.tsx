import {Field} from '@design-system/Field';
import {BadgeType, BadgesMenu} from '@design-system/Menu';
import {
  Option,
  OptionValue,
  SelectMultiple,
  SelectMultipleOnChangeArgs,
} from '@design-system/Select';
import {useEffect, useState} from 'react';

const getSelectedOption = (filter: SelectFilterType, value: OptionValue) => {
  return filter.options.find(opt => opt.value === value);
};

const getNewValues = (filter: SelectFilterType, value: OptionValue) => {
  return filter.values.filter(v => v !== value);
};

type SelectFilterType = {
  titre: string;
  options: Option[];
  values: OptionValue[] | undefined;
  onChange: (args: SelectMultipleOnChangeArgs) => void;
};

type FilterPAIProps = {
  thematiques: SelectFilterType;
  budgets: SelectFilterType;
  temps: SelectFilterType;
};

/**
 * Filtre dédié au panier d'actions à impact
 */

export const FilterPAI = ({thematiques, budgets, temps}: FilterPAIProps) => {
  const [badgesList, setBadgesList] = useState<
    (BadgeType & {value: OptionValue})[] | null
  >(null);

  /** Actualise la liste de badge lors de la mise à jour des valeurs des filtres */
  useEffect(() => {
    const newList: (BadgeType & {value: OptionValue})[] = [];

    !!thematiques.values &&
      thematiques.values.forEach(value => {
        const option = getSelectedOption(thematiques, value);
        const newValues = getNewValues(thematiques, value);
        newList.push({
          value,
          label: option.label,
          onClose: () =>
            thematiques.onChange({
              selectedValue: value,
              values: newValues.length ? newValues : undefined,
            }),
        });
      });

    !!budgets.values &&
      budgets.values.forEach(value => {
        const option = getSelectedOption(budgets, value);
        const newValues = getNewValues(budgets, value);
        newList.push({
          value,
          label: `Budget : ${option.label}`,
          onClose: () =>
            budgets.onChange({
              selectedValue: value,
              values: newValues.length ? newValues : undefined,
            }),
        });
      });

    !!temps.values &&
      temps.values.forEach(value => {
        const option = getSelectedOption(temps, value);
        const newValues = getNewValues(temps, value);
        newList.push({
          value,
          label: `Durée : ${option.label}`,
          onClose: () =>
            temps.onChange({
              selectedValue: value,
              values: newValues.length ? newValues : undefined,
            }),
        });
      });

    setBadgesList(newList);
  }, [thematiques.values, budgets.values, temps.values]);

  const handleClearFilters = () => {
    thematiques.onChange({selectedValue: undefined, values: undefined});
    budgets.onChange({selectedValue: undefined, values: undefined});
    temps.onChange({selectedValue: undefined, values: undefined});
  };

  return (
    <BadgesMenu
      badgesList={badgesList}
      onClearBadges={handleClearFilters}
      menuContent={
        <div className="flex flex-col gap-4 w-72">
          <Field title={thematiques.titre}>
            <SelectMultiple
              options={thematiques.options}
              values={thematiques.values}
              onChange={thematiques.onChange}
              small
            />
          </Field>
          <Field title={budgets.titre}>
            <SelectMultiple
              options={budgets.options}
              values={budgets.values}
              onChange={budgets.onChange}
              small
            />
          </Field>
          <Field title={temps.titre}>
            <SelectMultiple
              options={temps.options}
              values={temps.values}
              onChange={temps.onChange}
              small
            />
          </Field>
        </div>
      }
    />
  );
};
