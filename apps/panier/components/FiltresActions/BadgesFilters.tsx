import classNames from 'classnames';
import { useEffect, useState } from 'react';

import {
  Badge,
  ButtonMenu,
  Checkbox,
  Field,
  InfoTooltip,
  OptionValue,
  SelectMultiple,
  SelectMultipleOnChangeArgs,
  SelectOption,
  getFlatOptions,
} from '@/ui';

type FilterSelect = {
  type?: never;
  /** Titre affiché dans <Field /> */
  title: string;
  /** Tag optionnel, affiché dans les badges */
  tag?: string;
  /** Liste des options du select */
  options: SelectOption[];
  /** Valeurs par défaut du select */
  values?: OptionValue[];
  /** Active la multi sélection dans les filtres */
  multiple?: boolean;
  /** Détecte le changement de valeur du select */
  onChange: (args: SelectMultipleOnChangeArgs) => void;
};

type FilterCheckbox = {
  type: 'checkbox';
  /** Titre affiché dans <Field /> */
  title: string;
  /** Tag optionnel, affiché dans les badges */
  tag?: string;
  /** Valeur de la checkbox */
  value?: boolean;
  /** Contenu de l'infobulle */
  tooltip?: string;
  /** Détecte le changement de valeur de la checkbox */
  onChange: (value: boolean) => void;
};

type FilterType = FilterSelect | FilterCheckbox;

type BadgeType = {
  filter: FilterType;
  value: OptionValue;
  label: string;
};

type FiltersMenuProps = {
  filters: FilterType[];
  className?: string;
  /** Pour styler le bouton */
  btnMenuClassName?: string;
};

export const BadgesFilters = ({
  filters,
  className,
  btnMenuClassName,
}: FiltersMenuProps) => {
  const [badgesList, setBadgesList] = useState<BadgeType[] | null>(null);

  /** Gère la fermeture d'un badge et la mise à jour du filtre associé */
  const handleCloseBadge = (badge: BadgeType) => {
    const selectedValue = badge.value;

    if (badge.filter.type === 'checkbox') {
      badge.filter.onChange(badge.filter.value ?? false);
    } else {
      const values: OptionValue[] | undefined = badge.filter.values?.filter(
        (v) => v !== badge.value
      );

      badge.filter.onChange({ selectedValue, values });
    }
  };

  /** Supprime tous les filtres sélectionnés */
  const handleClearFilters = () => {
    badgesList?.forEach((badge) => {
      if (badge.filter.type === 'checkbox') {
        badge.filter.onChange(false);
      } else {
        badge.filter.onChange({
          selectedValue: badge.value,
          values: undefined,
        });
      }
    });
  };

  /** Actualise la liste de badge lors de la mise à jour des valeurs des filtres */
  useEffect(() => {
    const newList: BadgeType[] = [];

    filters.forEach((filter) => {
      if (filter.type === 'checkbox') {
        if (filter.value)
          newList.push({ filter, value: 'true', label: filter.title });
      } else {
        if (filter.values !== undefined) {
          const options = getFlatOptions(filter.options);

          filter.values.forEach((value) => {
            const option = options.find((opt) => opt.value === value);

            option &&
              newList.push({
                filter,
                value: option.value,
                label: option.label,
              });
          });
        }
      }
    });

    newList.length > 0 ? setBadgesList(newList) : setBadgesList(null);
  }, [filters]);

  return (
    <div
      className={classNames('flex justify-between items-start', className)}
      title="Filtrer"
    >
      <div className="flex gap-2 flex-wrap">
        {/* Liste des badges correspondant aux filtres sélectionnés */}
        {!!badgesList &&
          badgesList.map((badge) => (
            <Badge
              key={`${badge.label}-${badge.value}`}
              title={`${badge.filter.tag ? `${badge.filter.tag} : ` : ''}${
                badge.label
              }`}
              size="sm"
              state="standard"
              uppercase={false}
              light
              onClose={() => handleCloseBadge(badge)}
            />
          ))}

        {/* Badge pour effacer tous les filtres sélectionnés */}
        {!!badgesList && badgesList.length > 0 && (
          <div onClick={handleClearFilters} className="cursor-pointer">
            <Badge
              title="Supprimer tous les filtres"
              icon="delete-bin-6-line"
              iconPosition="left"
              size="sm"
              state="grey"
              uppercase={false}
              light
            />
          </div>
        )}
      </div>

      {/* Menu + Filtres Select */}
      <ButtonMenu
        size="xs"
        icon="equalizer-fill"
        className={btnMenuClassName}
        notification={
          badgesList && badgesList.length > 0
            ? {
                number: badgesList.length,
              }
            : undefined
        }
      >
        <div className="flex flex-col gap-4 w-72 p-4">
          {filters.map((filter) =>
            filter.type === 'checkbox' ? (
              <div className="flex flex-row items-end" key={filter.title}>
                <Checkbox
                  label={filter.title}
                  checked={filter.value}
                  onChange={(evt) => filter.onChange(evt.currentTarget.checked)}
                />
                {!!filter.tooltip && (
                  <InfoTooltip
                    iconClassName="text-primary-8"
                    label={filter.tooltip}
                    size="md"
                  />
                )}
              </div>
            ) : (
              <Field key={filter.title} title={filter.title}>
                <SelectMultiple
                  options={filter.options}
                  values={filter.values}
                  onChange={filter.onChange}
                  small
                />
              </Field>
            )
          )}
        </div>
      </ButtonMenu>
    </div>
  );
};
