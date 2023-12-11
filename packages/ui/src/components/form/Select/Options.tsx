import {forwardRef, Fragment, Ref} from 'react';
import classNames from 'classnames';

import DropdownFloater from '../../floating-ui/DropdownFloater';
// import IconThreeDotHorizontal from '../../icons/IconThreeDotHorizontal';

import {isOptionSection} from './utils';

/**
 * Types partagés entre tous les composants selects
 * (Select, MultiSelect, MultiSelectFilter)
 */
export type SelectOption = Option | OptionSection;
export type Option = {value: string; label: string};
export type OptionSection = {
  title: string;
  options: Option[];
};

type RenderOptionMenuProps = {
  option: Option;
  close?: () => void;
};

type Props<T extends string> = {
  values?: T[];
  options: SelectOption[];
  onSelect: (values: T[]) => void;
  renderOption?: (option: Option) => React.ReactElement;
  renderOptionMenu?: (
    props: RenderOptionMenuProps
  ) => React.ReactElement | null;
  noOptionPlaceholder?: string;
  dataTest?: string;
};

/** Liste d'options pouvant être de simples options ou des sections */
const Options = <T extends string>({
  values,
  options,
  onSelect,
  renderOption,
  renderOptionMenu,
  noOptionPlaceholder,
  dataTest,
}: Props<T>) => {
  return (
    <div data-test={`${dataTest}-options`}>
      {options.length > 0 ? (
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
                      onSelect={onSelect}
                      renderOption={renderOption}
                      renderOptionMenu={renderOptionMenu}
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
                onSelect={onSelect}
                renderOption={renderOption}
                renderOptionMenu={renderOptionMenu}
              />
            );
          }
        })
      ) : (
        <div className="p-4 text-sm text-gray-500">
          {noOptionPlaceholder || 'Aucune option disponible'}
        </div>
      )}
    </div>
  );
};

export default Options;

type OptionProps<T extends string> = {
  values?: T[];
  option: Option;
  onSelect: (values: T[]) => void;
  renderOption?: (option: Option) => React.ReactElement;
  renderOptionMenu?: (
    props: RenderOptionMenuProps
  ) => React.ReactElement | null;
};

/** Option pour les sélecteurs */
const Option = <T extends string>({
  values,
  option,
  onSelect,
  renderOption,
  renderOptionMenu,
}: OptionProps<T>) => {
  const isActive = values?.includes(option.value as T);
  return (
    <button
      data-test={option.value}
      className="flex items-start w-full p-2 text-left text-sm hover:!bg-primary-0"
      onClick={() => {
        if (values?.includes(option.value as T)) {
          // retrait d'une valeur
          onSelect(
            values.filter(
              selectedValue => selectedValue !== (option.value as T)
            )
          );
        } else {
          // ajoût d'une valeur
          onSelect([...(values || []), option.value as T]);
        }
      }}
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
      {/** on appelle renderOptionMenu pour savoir si la fonction renvoi quelque chose afin d'afficher les menu ou non.
        Ces conditions sont gérés dans les composants parents */}
      {renderOptionMenu &&
        renderOptionMenu({
          option,
        }) && (
          <DropdownFloater
            placement="top"
            offsetValue={{mainAxis: 8}}
            render={({close}) => (
              <div onClick={e => e.stopPropagation()}>
                {renderOptionMenu({
                  option,
                  close,
                })}
              </div>
            )}
          >
            <OptionOpenFloaterButton />
          </DropdownFloater>
        )}
    </button>
  );
};

type OptionOpenFloaterButtonProps = {
  isOpen?: boolean;
};

/** Bouton pour ouvrir le menu d'une option */
const OptionOpenFloaterButton = forwardRef(
  (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    {isOpen, ...props}: OptionOpenFloaterButtonProps,
    ref?: Ref<HTMLDivElement>
  ) => (
    <div
      ref={ref}
      className="ml-6 mr-4 p-1 cursor-pointer hover:bg-indigo-100"
      onClick={evt => {
        evt.stopPropagation();
      }}
    >
      {/** Donne les props à un élément enfant afin de pouvoir donner le stopPropagation au parent */}
      <div {...props}>
        {/* <IconThreeDotHorizontal className="w-4 h-4 fill-bf500" /> */}
      </div>
    </div>
  )
);
OptionOpenFloaterButton.displayName = 'OptionOpenFloaterButton';
