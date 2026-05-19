import { forwardRef, Fragment, Ref, useState } from 'react';
import { uiLabels } from '../../../labels/catalog';
import { cn } from '../../../utils/cn';
import { Badge } from '../../Badge';
import { Icon } from '../../Icon';
import { Tooltip } from '../../Tooltip';
import { getFlatOptions, OptionValue } from '../utils';
import { SelectProps } from './SelectBase';

type SelectBaseButtonProps = SelectProps & {
  /** Donné par le DropdownFloater */
  isOpen?: boolean;
  /** Valeur de la saisie */
  inputValue: string;
};

/* Création d'un composant séparé pour passer la ref du boutton au floater */
export const SelectBaseButton = forwardRef(
  (
    {
      dataTest,
      isOpen,
      options,
      values,
      disableBadgeDisplayedLimit,
      onChange,
      inputValue,
      isSearcheable,
      onSearch,
      createProps,
      multiple,
      buttonClassName,
      customItem,
      placeholder,
      disabled,
      small,
      optionsAreCaseSensitive,
      inlineEdit,
      ...props
    }: Omit<SelectBaseButtonProps, 'values'> & { values?: OptionValue[] },
    ref?: Ref<HTMLButtonElement>
  ) => {
    const [isInputFocused, setIsInputFocused] = useState(false);

    const flatOptions = getFlatOptions(options);

    const displayValue = (value: OptionValue, disableClose?: boolean) => {
      const option = flatOptions.find(
        (o) => o.value?.toString() === value.toString()
      );
      if (!option) {
        return null;
      }

      return customItem ? (
        <Fragment key={value.toString()}>{customItem(option)}</Fragment>
      ) : (
        <Badge
          uppercase={optionsAreCaseSensitive === false}
          variant={option?.disabled ? 'grey' : 'default'}
          type="outlined"
          icon={option.icon}
          iconPosition="left"
          iconClassname={option.iconClassname}
          key={value.toString()}
          title={option.label}
          onClose={
            !disableClose && !disabled && !option?.disabled
              ? () => onChange(value)
              : undefined
          }
        />
      );
    };

    const displayValues = (values: OptionValue[]) => {
      if (disableBadgeDisplayedLimit) {
        return <>{values.map((value) => displayValue(value))}</>;
      }

      const badgesToDisplay = values.slice(0, 1).map((value) => {
        return displayValue(value);
      });
      return (
        <>
          {badgesToDisplay}
          {values.length > 1 && (
            <Tooltip
              label={
                <div className="max-w-sm">
                  <div className="flex flex-wrap gap-2">
                    {values.map((value, index) =>
                      index >= 1 ? displayValue(value, true) : null
                    )}
                  </div>
                </div>
              }
            >
              <div>
                <Badge
                  uppercase={optionsAreCaseSensitive === false}
                  title={`+${values.length - 1}`}
                  variant="info"
                />
              </div>
            </Tooltip>
          )}
        </>
      );
    };

    return (
      <button
        ref={ref}
        data-test={dataTest}
        aria-expanded={isOpen}
        aria-label="ouvrir le menu"
        className={cn(
          'text-left rounded-lg border border-solid border-grey-4 disabled:border-grey-3 bg-grey-1 hover:!bg-primary-0 disabled:hover:!bg-grey-1 overflow-hidden w-full',
          { 'rounded-b-none': isOpen },
          { 'border-0 border-b': inlineEdit },
          buttonClassName
        )}
        disabled={disabled}
        type="button"
        {...props}
        onKeyDown={(evt) => {
          /** Seul moyen trouvé pour ne pas prendre en compte la key "Space"
           * qui trigger le click du bouton et toggle le dropdown quand
           * l'utilisateur saisi un espace dans l'input.
           * Sinon il faudrait donner {...props} à l'input et non au bouton.
           * Mais quid des select sans input ainsi que toute la partie du bouton autour de l'input */
          if (isInputFocused && evt.code === 'Space') {
            evt.preventDefault();
            onSearch?.(inputValue + ' ');
          }
        }}
      >
        <div
          className={cn('flex px-4', {
            'min-h-[2.5rem] py-1': small,
            'min-h-[3rem] py-2': !small,
          })}
        >
          <div className="flex grow flex-wrap gap-2 mr-4">
            {values && Array.isArray(values) && values.length > 0 ? (
              /** Listes des valeurs sélectionnées */
              <div
                className={cn('flex items-center gap-2 grow', {
                  'flex-wrap': disableBadgeDisplayedLimit,
                })}
              >
                {displayValues(values)}
              </div>
            ) : (
              /** Si pas de valeur et que la recherche n'est pas activée, on affiche un placeholder */
              !isSearcheable && (
                <span
                  className={cn(
                    'my-auto text-left text-grey-6 line-clamp-1 text-xs',
                    { '!text-grey-5': disabled }
                  )}
                >
                  {placeholder ??
                    (multiple
                      ? 'Sélectionner une ou plusieurs options'
                      : 'Sélectionner une option')}
                </span>
              )
            )}
            {isSearcheable &&
              // on affiche l'input si le sélecteur est désactivé et ne possède pas de valeur
              // afin d'afficher le placeholder de l'input sinon uniquement les valeurs
              !(
                disabled &&
                values &&
                Array.isArray(values) &&
                values.length > 0
              ) && (
                <input
                  data-test={`${dataTest}-input`}
                  type="text"
                  className={cn(
                    'w-full text-sm bg-inherit outline-0 placeholder:text-grey-6 placeholder:text-xs outline-offset-4',
                    { 'py-1': values }
                  )}
                  value={inputValue}
                  onChange={(e) => {
                    onSearch?.(e.target.value);
                  }}
                  onClick={(evt) => {
                    evt.preventDefault();
                    if (isOpen) {
                      evt.stopPropagation();
                    }
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={placeholder ?? uiLabels.rechercherParMotsCles}
                  disabled={disabled}
                />
              )}
          </div>
          {/** Icône flèche d'ouverture */}
          <Icon
            icon="arrow-down-s-line"
            size="sm"
            className={cn(
              'mt-2 ml-auto text-primary-9',
              { 'rotate-180': isOpen },
              { '!text-grey-5': disabled }
            )}
          />
        </div>
      </button>
    );
  }
);
SelectBaseButton.displayName = 'SelectBaseButton';
