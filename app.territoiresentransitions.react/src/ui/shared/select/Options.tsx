import IconThreeDotHorizontal from '@/app/ui/icons/IconThreeDotHorizontal';
import { forwardRef, Ref } from 'react';
import DropdownFloater from '../floating-ui/DropdownFloater';
import { Checkmark, isOptionSection, TOption, TSelectOption } from './commons';

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
    props: RenderOptionMenuProps
  ) => React.ReactElement | null;
  noOptionPlaceholder?: string;
  dataTest?: string;
};

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
          if (isOptionSection(option)) {
            return (
              <div key={option.title + i}>
                <div className="w-full p-1 pl-10 text-left text-sm italic text-gray-500 bg-gray-100 border-y border-gray-200">
                  {option.title}
                </div>
                {option.options.map((option) => (
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
            );
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
  option: TOption;
  onSelect: (values: T[]) => void;
  renderOption?: (option: TOption) => React.ReactElement;
  renderOptionMenu?: (
    props: RenderOptionMenuProps
  ) => React.ReactElement | null;
};

const Option = <T extends string>({
  values,
  option,
  onSelect,
  renderOption,
  renderOptionMenu,
}: OptionProps<T>) => {
  return (
    <button
      data-test={option.value}
      className="flex items-center w-full p-2 text-left text-sm"
      onClick={() => {
        if (values?.includes(option.value as T)) {
          // retrait d'une valeur
          onSelect(
            values.filter(
              (selectedValue) => selectedValue !== (option.value as T)
            )
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
            offsetValue={{ mainAxis: 8 }}
            render={({ close }) => (
              <div onClick={(e) => e.stopPropagation()}>
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

const OptionOpenFloaterButton = forwardRef(
  (
    { isOpen, ...props }: OptionOpenFloaterButtonProps,
    ref?: Ref<HTMLDivElement>
  ) => (
    <div
      ref={ref}
      className="ml-6 mr-4 p-1 cursor-pointer hover:bg-indigo-100"
      onClick={(evt) => {
        evt.stopPropagation();
      }}
    >
      {/** Donne les props à un élément enfant afin de pouvoir donner le stopPropagation au parent */}
      <div {...props}>
        <IconThreeDotHorizontal className="w-4 h-4 fill-bf500" />
      </div>
    </div>
  )
);

OptionOpenFloaterButton.displayName = 'OptionOpenFloaterButton';
