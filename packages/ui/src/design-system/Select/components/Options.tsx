import { uiLabels } from '@tet/ui/labels/catalog';
import classNames from 'classnames';
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Badge } from '../../Badge';
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
  /** Fonction de rendu personnalisée pour les options */
  renderOptionItem?: (option: TOption) => React.ReactElement;
  /** Les fonction permettant la création de nouvelles options */
  createProps?: CreateOption;
  uppercase?: boolean;
};

type OptionsListProps = BaseProps & {
  /** Liste des options */
  options: SelectOption[];
  /** Fait apparaître un état de chargement à la place des options */
  isLoading: boolean;
  /** Focus the highlighted option when the list opens */
  autoFocusOnOpen?: boolean;
};

/** Liste d'options pouvant être de simples options ou des sections */
const Options = ({
  values,
  options,
  onChange,
  isLoading,
  renderOptionItem,
  createProps,
  uppercase,
  autoFocusOnOpen = false,
}: OptionsListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const flatSelectable = useMemo(
    () => getFlatOptions(options).filter((o) => !o.disabled),
    [options]
  );

  /**
   * Rang de chaque option dans `flatSelectable`. Le rendu numérotait les
   * options à la volée, en comptant aussi les désactivées : dès qu'une option
   * l'était, la ligne mise en évidence n'était plus celle que la touche Entrée
   * validait.
   */
  const selectableIndexByValue = useMemo(
    () =>
      new Map(
        flatSelectable.map((option, index) => [String(option.value), index])
      ),
    [flatSelectable]
  );

  /** Rang de l'option déjà sélectionnée : point de départ à l'ouverture. */
  const selectedIndex = useMemo(() => {
    const selected = values?.[0];
    if (selected === undefined) {
      return 0;
    }
    const idx = flatSelectable.findIndex(
      (o) => o.value?.toString() === selected.toString()
    );
    return idx >= 0 ? idx : 0;
  }, [flatSelectable, values]);

  /**
   * Déplacement manuel (flèches ou focus), rattaché à l'état des options qui
   * l'a produit : quand la sélection ou la liste change, il redevient caduc et
   * la mise en évidence repart de l'option sélectionnée — sans effet ni
   * cascade de rendus.
   */
  const generation = [
    flatSelectable.map((option) => String(option.value)).join('\x1f'),
    values?.map(String).join('\x1f') ?? '',
  ].join('\x1e');
  const [manual, setManual] = useState<{
    generation: string;
    index: number;
  } | null>(null);
  const highlightedIndex =
    manual?.generation === generation ? manual.index : selectedIndex;

  const highlightedIndexRef = useRef(selectedIndex);
  const generationRef = useRef(generation);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    generationRef.current = generation;
    onChangeRef.current = onChange;
  }, [generation, onChange]);

  useLayoutEffect(() => {
    highlightedIndexRef.current = highlightedIndex;
  }, [highlightedIndex]);

  /**
   * Tabuler déplace le focus du navigateur, les flèches déplaçaient une mise en
   * évidence interne : deux curseurs concurrents, et Entrée validait le second.
   * Le focus fait désormais autorité sur les deux.
   */
  const setHighlight = useCallback(
    (index: number) => {
      if (index < 0) {
        return;
      }
      highlightedIndexRef.current = index;
      setManual({ generation, index });
    },
    [generation]
  );

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
        const prev = highlightedIndexRef.current;
        setHighlight(
          e.key === 'ArrowDown'
            ? Math.min(flatSelectable.length - 1, prev + 1)
            : Math.max(0, prev - 1)
        );
        return;
      }

      if (e.key === 'Enter') {
        const opt = flatSelectable[highlightedIndexRef.current];
        // Sans option sous le curseur, laisser le navigateur activer ce qui a
        // le focus : intercepter Entrée pour ne rien faire refermait la liste
        // sans rien choisir.
        if (!opt) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        onChangeRef.current(opt.value);
      }
    };

    container.addEventListener('keydown', handleKeyDown, true);
    return () => container.removeEventListener('keydown', handleKeyDown, true);
  }, [flatSelectable, isLoading, setHighlight]);

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
                      const flatIdx =
                        selectableIndexByValue.get(String(subOption.value)) ??
                        -1;
                      return (
                        <Option
                          key={`${i}-${idx}-${subOption.value}`}
                          option={subOption}
                          values={values}
                          onChange={onChange}
                          renderOptionItem={renderOptionItem}
                          createProps={createProps}
                          uppercase={uppercase}
                          isKeyboardHighlighted={
                            flatIdx >= 0 && flatIdx === highlightedIndex
                          }
                          onFocusOption={() => setHighlight(flatIdx)}
                        />
                      );
                    })}
                  </div>
                </Fragment>
              );
              /** Option simple */
            } else {
              const flatIdx =
                selectableIndexByValue.get(String(option.value)) ?? -1;
              return (
                <Option
                  key={`${i}-${option.value}`}
                  option={option}
                  values={values}
                  onChange={onChange}
                  renderOptionItem={renderOptionItem}
                  createProps={createProps}
                  uppercase={uppercase}
                  isKeyboardHighlighted={
                    flatIdx >= 0 && flatIdx === highlightedIndex
                  }
                  onFocusOption={() => setHighlight(flatIdx)}
                />
              );
            }
          });
        })()
      ) : (
        <div className="py-4 px-6 text-sm text-gray-500">
          {uiLabels.aucuneOptionDisponible}
        </div>
      )}
    </div>
  );
};

export default Options;

type OptionProps = BaseProps & {
  option: TOption;
  isKeyboardHighlighted?: boolean;
  /** Aligne la mise en évidence clavier sur l'option qui prend le focus. */
  onFocusOption?: () => void;
};

/** Option pour les sélecteurs */
const Option = ({
  values,
  option,
  onChange,
  renderOptionItem,
  createProps,
  uppercase = true,
  isKeyboardHighlighted = false,
  onFocusOption,
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
        onFocus={onFocusOption}
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
          {renderOptionItem && option.value !== ITEM_ALL ? (
            renderOptionItem(option)
          ) : createProps && option.value !== ITEM_ALL ? (
            <Badge
              title={option.label}
              icon={option.icon}
              iconPosition="left"
              iconClassname={option.iconClassname}
              variant={disabled ? 'grey' : 'default'}
              type="solid"
              size="sm"
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
