// Composant copié depuis l'app

import {
  Checkmark,
  isOptionSection,
  optionButtonClassname,
  TOption,
  TSelectOption,
} from './commons';
// import IconThreeDotHorizontal from 'ui/icons/IconThreeDotHorizontal';
import DropdownFloater from '../floating-ui/DropdownFloater';
import {forwardRef, MutableRefObject, Ref} from 'react';
import classNames from 'classnames';

type RenderOptionMenuProps = {
  option: TOption;
  close?: () => void;
};

type Props<T extends string> = {
  values?: T[];
  options: TSelectOption[];
  onSelect: (values: T[]) => void;
  renderOption?: (option: TOption) => React.ReactElement;
  renderOptionMenu?: (
    props: RenderOptionMenuProps,
  ) => React.ReactElement | null;
  noOptionPlaceholder?: string;
  isLoading?: boolean;
  dataTest?: string;
  listRef?: MutableRefObject<(HTMLElement | null)[]>;
  activeIndex?: number | null;
};

const Options = <T extends string>({
  values,
  options,
  onSelect,
  renderOption,
  renderOptionMenu,
  noOptionPlaceholder,
  isLoading = false,
  dataTest,
  listRef,
  activeIndex,
}: Props<T>) => {
  return (
    <div data-test={`${dataTest}-options`}>
      {isLoading ? (
        <div className="p-4 text-sm text-gray-500">Chargement...</div>
      ) : options.length > 0 ? (
        options.map((option, i) => {
          if (isOptionSection(option)) {
            return (
              <div key={option.title + i}>
                <div className="w-full p-1 pl-10 text-left text-sm italic text-gray-500 bg-gray-100 border-y border-gray-200">
                  {option.title}
                </div>
                {option.options.map((option, i) => (
                  <Option
                    key={`${option.value}`}
                    index={i}
                    option={option}
                    values={values}
                    onSelect={onSelect}
                    renderOption={renderOption}
                    renderOptionMenu={renderOptionMenu}
                    listRef={listRef}
                    activeIndex={activeIndex}
                  />
                ))}
              </div>
            );
          } else {
            return (
              <Option
                key={option.value}
                index={i}
                option={option}
                values={values}
                onSelect={onSelect}
                renderOption={renderOption}
                renderOptionMenu={renderOptionMenu}
                listRef={listRef}
                activeIndex={activeIndex}
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
  index: number;
  values?: T[];
  option: TOption;
  onSelect: (values: T[]) => void;
  renderOption?: (option: TOption) => React.ReactElement;
  renderOptionMenu?: (
    props: RenderOptionMenuProps,
  ) => React.ReactElement | null;
  listRef?: MutableRefObject<(HTMLElement | null)[]>;
  activeIndex?: number | null;
};

const Option = <T extends string>({
  index,
  values,
  option,
  onSelect,
  renderOption,
  renderOptionMenu,
  listRef,
  activeIndex,
}: OptionProps<T>) => {
  return (
    <button
      data-test={option.value}
      ref={node => {
        if (listRef) {
          listRef.current[index] = node;
        }
      }}
      role="option"
      tabIndex={0}
      aria-selected={
        values?.includes(option.value as T) && index === activeIndex
      }
      className={classNames(
        '!outline-0 focus:bg-[#f6f6f6]',
        optionButtonClassname,
      )}
      onClick={() => {
        if (values?.includes(option.value as T)) {
          // retrait d'une valeur
          onSelect(
            values.filter(
              selectedValue => selectedValue !== (option.value as T),
            ),
          );
        } else {
          // ajoût d'une valeur
          onSelect([...(values || []), option.value as T]);
        }
      }}
    >
      <Checkmark isSelected={values?.includes(option.value as T) || false} />
      <div className="mr-auto">
        {renderOption ? (
          renderOption(option)
        ) : (
          <span className="leading-6">{option.label}</span>
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

// eslint-disable-next-line react/display-name
const OptionOpenFloaterButton = forwardRef(
  (
    {isOpen, ...props}: OptionOpenFloaterButtonProps,
    ref?: Ref<HTMLDivElement>,
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
        ...
      </div>
    </div>
  ),
);
