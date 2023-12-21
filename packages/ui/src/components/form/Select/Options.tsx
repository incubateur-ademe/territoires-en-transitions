import {Fragment} from 'react';
import classNames from 'classnames';

import {isOptionSection} from './utils';
import {OptionMenu} from './OptionMenu';
import {CreateOption} from './Select';

/**
 * Types partagés entre tous les composants selects
 * (Select, MultiSelect, MultiSelectFilter)
 */
export type OptionValue = number | string;
export type Option = {value: OptionValue; label: string};
export type OptionSection = {
  title: string;
  options: Option[];
};
export type SelectOption = Option | OptionSection;

type Props<T extends OptionValue> = {
  values?: T[];
  options: SelectOption[];
  onChange: (value: T) => void;
  isLoading: boolean;
  createProps?: CreateOption;
  renderOption?: (option: Option) => React.ReactElement;
  noOptionPlaceholder?: string;
  dataTest?: string;
};

/** Liste d'options pouvant être de simples options ou des sections */
const Options = <T extends OptionValue>({
  values,
  options,
  onChange,
  isLoading,
  renderOption,
  createProps,
  noOptionPlaceholder,
  dataTest,
}: Props<T>) => {
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
                      key={`${option.value}`}
                      option={option}
                      values={values}
                      onChange={onChange}
                      renderOption={renderOption}
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
                renderOption={renderOption}
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

type OptionProps<T extends OptionValue> = {
  values?: T[];
  option: Option;
  onChange: (value: T) => void;
  renderOption?: (option: Option) => React.ReactElement;
  createProps?: CreateOption;
};

/** Option pour les sélecteurs */
const Option = <T extends OptionValue>({
  values,
  option,
  onChange,
  renderOption,
  createProps,
}: OptionProps<T>) => {
  const isActive = values?.includes(option.value as T);
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
      <div className="flex mr-auto">
        {renderOption ? (
          renderOption(option)
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
