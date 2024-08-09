import { Badge } from '@tet/ui/design-system/Badge';
import { ButtonMenu } from '@tet/ui/design-system/Button';
import { Field } from '@tet/ui/design-system/Field';
import {
  OptionValue,
  Select,
  SelectMultiple,
  SelectMultipleOnChangeArgs,
  SelectOption,
  getFlatOptions,
} from '@tet/ui/design-system/Select';
import classNames from 'classnames';
import { useEffect, useState } from 'react';

type FilterType = {
  /** Titre affiché dans <Field /> */
  title: string;
  /** Tag optionnel, affiché dans les badges */
  tag?: string;
  /** Liste des options du select */
  options: SelectOption[];
  /** Valeurs par défaut du select */
  values: OptionValue | OptionValue[] | undefined;
  /** Active la multi sélection dans les filtres */
  multiple?: boolean;
  /** Détecte le changement de valeur du select */
  onChange: (args?: SelectMultipleOnChangeArgs | OptionValue) => void;
};

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
  /** ClassName pour le container du NotificationButton */
  notificationBtnClassName?: string;
};

export const BadgesFilters = ({
  filters,
  className,
  btnMenuClassName,
  notificationBtnClassName,
}: FiltersMenuProps) => {
  const [badgesList, setBadgesList] = useState<BadgeType[] | null>(null);

  /** Gère la fermeture d'un badge et la mise à jour du filtre associé */
  const handleCloseBadge = (badge: BadgeType) => {
    if (Array.isArray(badge.filter.values)) {
      const selectedValue = badge.value;

      const newValuesArray = badge.filter.values?.filter(
        (v) => v !== badge.value
      );

      const values =
        newValuesArray && newValuesArray.length > 0
          ? newValuesArray
          : undefined;

      badge.filter.onChange({ selectedValue, values });
    } else {
      badge.filter.onChange();
    }
  };

  /** Supprime tous les filtres sélectionnés */
  const handleClearFilters = () => {
    badgesList?.forEach((badge) => {
      badge.filter.multiple
        ? badge.filter.onChange({
            selectedValue: badge.value,
            values: undefined,
          })
        : badge.filter.onChange();
    });
  };

  /** Actualise la liste de badge lors de la mise à jour des valeurs des filtres */
  useEffect(() => {
    const newList: BadgeType[] = [];

    filters.forEach((filter) => {
      if (filter.values !== undefined) {
        const options = getFlatOptions(filter.options);

        if (Array.isArray(filter.values)) {
          filter.values.forEach((value) => {
            const option = options.find((opt) => opt.value === value);
            if (!option) return;

            newList.push({
              filter,
              value: option.value,
              label: option.label,
            });
          });
        } else {
          const option = options.find((opt) => opt.value === filter.values);
          if (!option) return;

          newList.push({
            filter,
            value: option.value,
            label: option.label,
          });
        }
      }
    });

    newList.length > 0 ? setBadgesList(newList) : setBadgesList(null);
  }, [JSON.stringify(filters.map((f) => f.values))]);

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
              onClose={() => undefined}
            />
          </div>
        )}
      </div>

      {/* Menu + Filtres Select */}
      <ButtonMenu
        icon="equalizer-fill"
        notificationValue={badgesList?.length}
        className={btnMenuClassName}
        notificationBtnClassName={notificationBtnClassName}
      >
        <div className="flex flex-col gap-4 w-72">
          {filters.map((filter) => (
            <Field key={filter.title} title={filter.title}>
              {filter.multiple ? (
                <SelectMultiple
                  options={filter.options}
                  values={Array.isArray(filter.values) ? filter.values : []}
                  onChange={filter.onChange}
                  small
                />
              ) : (
                <Select
                  options={filter.options}
                  values={filter.values}
                  onChange={(args) => {
                    filter.onChange(args);
                  }}
                  small
                />
              )}
            </Field>
          ))}
        </div>
      </ButtonMenu>
    </div>
  );
};
