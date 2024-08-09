import { Fragment } from 'react';
import classNames from 'classnames';

import { Badge } from '@tet/ui/design-system/Badge';
import { Icon } from '@tet/ui/design-system/Icon';

import {
  OptionValue,
  Option as TOption,
  SelectOption,
  isOptionSection,
} from '../utils';
import { OptionMenu } from './OptionMenu';
import { CreateOption } from './SelectBase';
import { ITEM_ALL } from '@tet/ui/design-system/Select/SelectFilter';

type BaseProps = {
  /** Liste des valeurs sélectionnées dans le sélecteur parent */
  values?: OptionValue[];
  /** Appelée au click d'une option (reçoit la valeur de l'option cliquée) */
  onChange: (value: OptionValue) => void;
  /** Permet de customiser l'item (label) d'une option */
  customItem?: (option: TOption) => React.ReactElement;
  /** Permet d'afficher des badges dans les options */
  isBadgeItem?: boolean;
  /** Les fonction permettant la création de nouvelles options */
  createProps?: CreateOption;
};

type OptionsListProps = BaseProps & {
  /** Liste des options */
  options: SelectOption[];
  /** Fait apparaître un état de chargement à la place des options */
  isLoading: boolean;
  /** Texte affiché quand il n'y a aucune option fournie */
  noOptionPlaceholder?: string;
};

/** Liste d'options pouvant être de simples options ou des sections */
const Options = ({
  values,
  options,
  onChange,
  isLoading,
  customItem,
  isBadgeItem,
  createProps,
  noOptionPlaceholder,
}: OptionsListProps) => {
  return (
    <div>
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
                  {option.options.map((option) => (
                    <Option
                      key={option.value}
                      option={option}
                      values={values}
                      onChange={onChange}
                      customItem={customItem}
                      isBadgeItem={isBadgeItem}
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
                isBadgeItem={isBadgeItem}
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

type OptionProps = BaseProps & {
  option: TOption;
};

/** Option pour les sélecteurs */
const Option = ({
  values,
  option,
  onChange,
  customItem,
  isBadgeItem,
  createProps,
}: OptionProps) => {
  const disabled = option.disabled ?? false;
  const isActive = values?.includes(option.value);
  const isUserCreated = createProps?.userCreatedOptions.includes(option.value);
  return (
    <div className="group flex w-full">
      <button
        type="button"
        data-test={option.value}
        className={classNames(
          'flex items-start w-full p-2 pr-6 text-left text-sm',
          { 'hover:!bg-primary-0': !disabled }
        )}
        onClick={(e) => {
          e.stopPropagation();
          onChange(option.value);
        }}
        disabled={disabled}
      >
        <div className="flex w-6 mr-2 shrink-0">
          {isActive && (
            <Icon
              icon="check-line"
              size="sm"
              className="mt-1 m-auto text-primary-7"
            />
          )}
        </div>
        <div className="flex mr-auto my-auto">
          {customItem && option.value !== ITEM_ALL ? (
            customItem(option)
          ) : (createProps || isBadgeItem) && option.value !== ITEM_ALL ? (
            <Badge
              title={option.label}
              state={disabled ? 'grey' : isUserCreated ? 'standard' : 'default'}
              light={disabled ?? undefined}
              size="sm"
              trim={false}
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
      </button>
      {isUserCreated && (createProps?.onDelete || createProps?.onUpdate) && (
        <OptionMenu
          option={option}
          onDelete={createProps?.onDelete}
          onUpdate={createProps?.onUpdate}
        />
      )}
    </div>
  );
};
