import classNames from 'classnames';
import {forwardRef, Ref} from 'react';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {
  buttonDisplayedClassname,
  buttonDisplayedIconClassname,
  buttonDisplayedPlaceholderClassname,
  optionButtonClassname,
  optionCheckMarkClassname,
} from 'ui/shared/select/commons';

const getIsAllSelected = (values: string[]) =>
  !values.length || values.indexOf(ITEM_ALL) !== -1;

type MultiSelectFilterButtonProps = {
  isOpen?: boolean;
  values: string[];
  options: {value: string; label: string}[];
  placeholderText?: string;
  inlineValues?: boolean;
};

/* Création d'un composant séparé pour passer la ref du boutton au floater */
const MultiSelectFilterButton = forwardRef(
  (props: MultiSelectFilterButtonProps, ref: Ref<HTMLButtonElement>) => {
    const {isOpen, values, options, placeholderText, inlineValues} = props;
    const isAllSelected = getIsAllSelected(values);

    return (
      <button
        ref={ref}
        aria-label="ouvrir le menu"
        className={buttonDisplayedClassname}
        {...props}
      >
        {values.length !== 0 && !isAllSelected ? (
          <span
            className={classNames('mr-auto flex flex-col', {
              'flex-row line-clamp-1': inlineValues,
            })}
          >
            {values.map((value, index) => (
              <span key={value}>
                {options.find(o => o.value === value)?.label}
                {inlineValues && values.length !== index + 1 && ', '}
              </span>
            ))}
          </span>
        ) : (
          <span className={buttonDisplayedPlaceholderClassname}>
            {placeholderText ?? ''}
          </span>
        )}
        <span
          className={`${buttonDisplayedIconClassname} ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
    );
  }
);

export const ITEM_ALL = 'tous';

export const MultiSelectFilter = <T extends string>({
  values,
  options,
  onChange,
  inlineValues,
  placeholderText,
}: {
  /** valeurs des options sélectionnées */
  values: T[];
  /** Liste des options */
  options: {value: T; label: string}[];
  /** appelée quand les options sélectionnée changent (reçoit les nouvelles valeurs) */
  onChange: (value: T[]) => void;
  /** Texte pour le label par defaut pour le composant   */
  placeholderText?: string;
  /** Affiche les valeurs sur une simple ligne */
  inlineValues?: boolean;
}) => {
  const isAllSelected = getIsAllSelected(values);

  // gère la sélection/déselection d'item dans la liste
  const handleChange = (value: string) => {
    // si la valeur existe déjà
    if (values.indexOf(value as T) > -1) {
      // on supprime la valeur
      const newValues = values.filter(v => v !== value);
      // évite d'avoir aucun item sélectionné
      if (newValues.length === 0) {
        if (!isAllSelected) {
          onChange([ITEM_ALL as T]);
        }
      } else {
        onChange(newValues);
      }
    } else {
      // sinon on ajoute la valeur
      const newValues = values;
      newValues.push(value as T);
      const newValuesIncludesAll = getIsAllSelected(newValues);
      // supprime les autres items de la sélection quand "tous" est sélectionné
      if (newValuesIncludesAll && !isAllSelected) {
        onChange([ITEM_ALL as T]);
      } else {
        // sinon évite que "tous" reste dans la nouvelle sélection
        onChange(newValues.filter(f => f !== ITEM_ALL));
      }
    }
  };

  return (
    <DropdownFloater
      render={() =>
        options.map(({value, label}) => {
          return (
            <button
              key={value}
              aria-label={label}
              className={optionButtonClassname}
              onClick={() => handleChange(value)}
            >
              <div className="w-6 mr-2">
                {values.includes(value) && (
                  <span className={optionCheckMarkClassname} />
                )}
              </div>
              <span className="leading-6">{label}</span>
            </button>
          );
        })
      }
    >
      <MultiSelectFilterButton
        values={values}
        options={options}
        inlineValues={inlineValues}
        placeholderText={placeholderText}
      />
    </DropdownFloater>
  );
};
