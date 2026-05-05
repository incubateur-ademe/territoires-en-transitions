import classNames from 'classnames';
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Badge, BadgeSize, BadgeType, BadgeVariant } from '../../Badge';
import { Icon } from '../../Icon';
import { ITEM_ALL } from '../SelectFilter';
import {
  OptionValue,
  SelectOption,
  Option as TOption,
  getFlatOptions,
  isOptionSection,
} from '../utils';
import { OptionMenu } from './OptionMenu';
import { CreateOption } from './SelectBase';

type BaseProps = {
  /** Liste des valeurs sélectionnées dans le sélecteur parent */
  values?: OptionValue[];
  /** Appelée au click d'une option (reçoit la valeur de l'option cliquée) */
  onChange: (value: OptionValue) => void;
  /** Permet de customiser l'item (label) d'une option */
  customItem?: (option: TOption) => React.ReactElement;
  /** Permet d'afficher des badges dans les options */
  isBadgeItem?: boolean;
  /** Permet de modifier la taille des badges */
  badgeSize: BadgeSize;
  /** Permet de modifier le state des badges en fonction de la valeur */
  valueToBadgeState?: Record<
    OptionValue,
    { state: BadgeVariant; type?: BadgeType }
  >;
  /** Les fonction permettant la création de nouvelles options */
  createProps?: CreateOption;
  uppercase?: boolean;
};

type OptionsListProps = BaseProps & {
  /** Liste des options */
  options: SelectOption[];
  /** Fait apparaître un état de chargement à la place des options */
  isLoading: boolean;
  /** Texte affiché quand il n'y a aucune option fournie */
  noOptionPlaceholder?: string;
  /** Focus the highlighted option when the list opens */
  autoFocusOnOpen?: boolean;
};

/** Liste d'options pouvant être de simples options ou des sections */
const Options = ({
  values,
  options,
  onChange,
  isLoading,
  customItem,
  isBadgeItem,
  badgeSize,
  valueToBadgeState,
  createProps,
  noOptionPlaceholder,
  uppercase,
  autoFocusOnOpen = false,
}: OptionsListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const flatSelectable = useMemo(
    () => getFlatOptions(options).filter((o) => !o.disabled),
    [options]
  );

  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const highlightedIndexRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useLayoutEffect(() => {
    highlightedIndexRef.current = highlightedIndex;
  }, [highlightedIndex]);

  useLayoutEffect(() => {
    if (flatSelectable.length === 0) {
      return;
    }
    const selected = values?.[0];
    if (selected !== undefined) {
      const idx = flatSelectable.findIndex(
        (o) => o.value?.toString() === selected.toString()
      );
      const next = idx >= 0 ? idx : 0;
      setHighlightedIndex(next);
      highlightedIndexRef.current = next;
    } else {
      setHighlightedIndex(0);
      highlightedIndexRef.current = 0;
    }
  }, [flatSelectable, values]);

  useEffect(() => {
    if (isLoading || flatSelectable.length === 0) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
        return;
      }

      if (!container.contains(t as Node) && t !== document.body) {
        return;
      }

      if (flatSelectable.length === 0) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex((prev) => {
          const next =
            e.key === 'ArrowDown'
              ? Math.min(flatSelectable.length - 1, prev + 1)
              : Math.max(0, prev - 1);
          highlightedIndexRef.current = next;
          return next;
        });
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const idx = highlightedIndexRef.current;
        const opt = flatSelectable[idx];
        if (opt) {
          onChangeRef.current(opt.value);
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown, true);
    return () => container.removeEventListener('keydown', handleKeyDown, true);
  }, [flatSelectable, isLoading]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const el = container.querySelector<HTMLElement>(
      '[data-select-keyboard-highlight="true"]'
    );
    if (!el) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    if (elRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - elRect.top;
    } else if (elRect.bottom > containerRect.bottom) {
      container.scrollTop += elRect.bottom - containerRect.bottom;
    }
  }, [highlightedIndex]);

  useLayoutEffect(() => {
    if (!autoFocusOnOpen || isLoading) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const highlightedOption = container.querySelector<HTMLButtonElement>(
      '[data-select-keyboard-highlight="true"]'
    );

    highlightedOption?.focus({ preventScroll: true });
  }, [autoFocusOnOpen, highlightedIndex, isLoading]);

  return (
    <div ref={containerRef}>
      {isLoading ? (
        <div className="p-4 text-sm text-gray-500">Chargement...</div>
      ) : options.length > 0 ? (
        (() => {
          let flatRun = 0;
          return options.map((option, i) => {
            /** Section */
            if (isOptionSection(option)) {
              return (
                <Fragment key={`${i}-${option.title}`}>
                  <div className="first:hidden h-[1px] mx-6 bg-grey-4" />
                  <div>
                    {/** titre */}
                    <div className="pt-4 pb-2 mx-6 font-bold text-left text-sm uppercase text-primary-7">
                      {option.title}
                    </div>
                    {/** options */}
                    {option.options.map((subOption, idx) => {
                      const flatIdx = flatRun++;
                      return (
                        <Option
                          key={`${i}-${idx}-${subOption.value}`}
                          option={subOption}
                          values={values}
                          onChange={onChange}
                          customItem={customItem}
                          isBadgeItem={isBadgeItem}
                          badgeSize={badgeSize}
                          valueToBadgeState={valueToBadgeState}
                          createProps={createProps}
                          uppercase={uppercase}
                          isKeyboardHighlighted={flatIdx === highlightedIndex}
                        />
                      );
                    })}
                  </div>
                </Fragment>
              );
              /** Option simple */
            } else {
              const flatIdx = flatRun++;
              return (
                <Option
                  key={`${i}-${option.value}`}
                  option={option}
                  values={values}
                  onChange={onChange}
                  customItem={customItem}
                  isBadgeItem={isBadgeItem}
                  badgeSize={badgeSize}
                  valueToBadgeState={valueToBadgeState}
                  createProps={createProps}
                  uppercase={uppercase}
                  isKeyboardHighlighted={flatIdx === highlightedIndex}
                />
              );
            }
          });
        })()
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
  isKeyboardHighlighted?: boolean;
};

/** Option pour les sélecteurs */
const Option = ({
  values,
  option,
  onChange,
  customItem,
  isBadgeItem,
  badgeSize,
  valueToBadgeState,
  createProps,
  uppercase = true,
  isKeyboardHighlighted = false,
}: OptionProps) => {
  const disabled = option.disabled ?? false;
  const isActive = values?.includes(option.value);
  const isUserCreated = createProps?.userCreatedOptions.includes(option.value);
  return (
    <div className="group flex w-full">
      <button
        type="button"
        data-test={option.value}
        data-select-keyboard-highlight={
          isKeyboardHighlighted ? 'true' : undefined
        }
        aria-label={option.label}
        className={classNames(
          'flex items-start w-full p-2 pr-6 text-left text-sm',
          { 'hover:!bg-primary-1': !disabled },
          { '!bg-primary-1': isKeyboardHighlighted && !disabled }
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
              icon={option.icon}
              iconPosition="left"
              iconClassname={option.iconClassname}
              variant={
                disabled
                  ? 'grey'
                  : valueToBadgeState
                  ? valueToBadgeState[option.value].state
                  : 'default'
              }
              type={valueToBadgeState?.[option.value]?.type ?? 'solid'}
              size={badgeSize}
              trim={false}
              uppercase={uppercase}
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
        <OptionMenu option={option} {...createProps} />
      )}
    </div>
  );
};
