import {Fragment} from 'react';
import classNames from 'classnames';

import {isOptionSection} from './utils';
import {OptionMenu} from './OptionMenu';
import {CreateOption} from './Select';
import {Badge} from '../../badge/Badge';

/**
 * Types partagés entre tous les composants selects
 * (Select, MultiSelect, MultiSelectFilter)
 */

/** Type du champ valeur d'une option */
export type OptionValue = number | string;
/** Type de base d'une option générique */
export type Option = {value: OptionValue; label: string};
/** Type d'une liste d'options dans un sélecteur */
export type OptionSection = {
  title: string;
  options: Option[];
};
/** Type d'une option dans un sélecteur, peut être une simple option ou une liste d'options */
export type SelectOption = Option | OptionSection;

type BaseProps<T extends OptionValue> = {
  /** Liste des valeurs sélectionnées dans le sélecteur parent */
  values?: T[];
  /** Appelée au click d'une option (reçoit la valeur de l'option cliquée) */
  onChange: (value: T) => void;
  /** Permet de customiser l'item (label) d'une option */
  customItem?: (option: Option) => React.ReactElement;
  /** Les fonction permettant la création de nouvelles options */
  createProps?: CreateOption;
};

type OptionsListProps<T extends OptionValue> = BaseProps<T> & {
  /** Id pour les tests e2e */
  dataTest?: string;
  /** Liste des options */
  options: SelectOption[];
  /** Fait apparaître un état de chargement à la place des options */
  isLoading: boolean;
  /** Texte affiché quand il n'y a aucune option fournie */
  noOptionPlaceholder?: string;
};

/** Liste d'options pouvant être de simples options ou des sections */
const Options = <T extends OptionValue>({
  values,
  options,
  onChange,
  isLoading,
  customItem,
  createProps,
  noOptionPlaceholder,
  dataTest,
}: OptionsListProps<T>) => {
  return (
    <div data-test={`${dataTest}-options`}>
      {isLoading ? (
        <div className="p-4 text-sm text-gray-500">Chargement...</div>
      ) : options.length > 0 ? (
        options.map((option, i) => {
          /** Section */
          if (isOptionSection(option)) {
            return (
              <Fragment key={option.title + i}>
                <div className="first:hidden h-[1px] mx-6 bg-grey-4" />
                <div>
                  {/** titre */}
                  <div className="pt-4 pb-2 mx-6 font-bold text-left text-sm uppercase text-primary-7">
                    {option.title}
                  </div>
                  {/** options */}
                  {option.options.map(option => (
                    <Option
                      key={option.value}
                      option={option}
                      values={values}
                      onChange={onChange}
                      customItem={customItem}
                      createProps={createProps}
                    />
                  ))}
                </div>
              </Fragment>
            );
            /** Option simple */
          } else {
            return (
              <Option
                key={option.value}
                option={option}
                values={values}
                onChange={onChange}
                customItem={customItem}
                createProps={createProps}
              />
            );
          }
        })
      ) : (
        <div className="py-4 px-6 text-sm text-gray-500">
          {noOptionPlaceholder || 'Aucune option disponible'}
        </div>
      )}
    </div>
  );
};

export default Options;

type OptionProps<T extends OptionValue> = BaseProps<T> & {
  option: Option;
};

/** Option pour les sélecteurs */
const Option = <T extends OptionValue>({
  values,
  option,
  onChange,
  customItem,
  createProps,
}: OptionProps<T>) => {
  const isActive = values?.includes(option.value as T);
  const isUserCreated = createProps?.userCreatedOptions.includes(option.value);
  return (
    <button
      data-test={option.value}
      className="flex items-start w-full p-2 pr-6 text-left text-sm hover:!bg-primary-0"
      onClick={() => onChange(option.value as T)}
    >
      <div className="flex w-6 mr-2 shrink-0">
        {isActive && (
          <span className="fr-icon-check-line flex mt-1 mx-auto text-primary-7 before:m-auto before:!h-4 before:!w-4" />
        )}
      </div>
      <div className="flex mr-auto my-auto">
        {customItem ? (
          customItem(option)
        ) : createProps ? (
          <Badge
            title={option.label}
            state={isUserCreated ? 'standard' : 'default'}
            size="sm"
          />
        ) : (
          <span
            className={classNames('leading-6 text-grey-8', {
              'text-primary-7': isActive,
            })}
          >
            {option.label}
          </span>
        )}
      </div>
      {createProps &&
        createProps.userCreatedOptions.some(o => o === option.value) && (
          <OptionMenu option={option} createProps={createProps} />
        )}
    </button>
  );
};
