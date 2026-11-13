import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  size,
  useFloating,
} from '@floating-ui/react';
import { KeyboardEvent, useId, useMemo, useState } from 'react';
import { uiLabels } from '../../labels/catalog';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge';
import { Icon } from '../Icon';
import { HighlightedText } from './highlighted-text';
import type {
  SearchComboboxGroup,
  SearchComboboxOption,
  SearchComboboxSelection,
} from './search-combobox.types';
import { useSearchDraft } from './use-search-draft';

export type SearchComboboxProps = {
  /** La recherche appliquée. Le champ s'y recale quand elle change d'ailleurs. */
  value: string;
  /**
   * Applique une recherche plein texte : après `debounce` ms de saisie, ou
   * aussitôt sur Entrée. Reçoit `''` quand une suggestion est choisie, la saisie
   * cédant la place au choix.
   */
  onSearch: (value: string) => void;
  /**
   * Les suggestions pour une saisie. Appelée à chaque frappe : elle doit rester
   * synchrone et rapide — chercher dans des données déjà chargées.
   */
  getSuggestions?: (query: string) => SearchComboboxGroup[];
  onSelectOption?: (
    option: SearchComboboxOption,
    group: SearchComboboxGroup
  ) => void;
  /**
   * L'option est-elle déjà choisie ? Elle porte alors une coche, et la choisir
   * de nouveau la retire, par `onDeselectOption`.
   */
  isOptionSelected?: (
    option: SearchComboboxOption,
    group: SearchComboboxGroup
  ) => boolean;
  onDeselectOption?: (
    option: SearchComboboxOption,
    group: SearchComboboxGroup
  ) => void;
  /** Les choix déjà faits, en étiquettes dans le champ. */
  selections?: SearchComboboxSelection[];
  onRemoveSelection?: (id: string) => void;
  /** Nom accessible du champ. */
  label: string;
  placeholder?: string;
  /** Nombre de caractères à partir duquel les suggestions s'ouvrent. */
  minQueryLength?: number;
  debounce?: number;
  /** Pour passer au-dessus d'un en-tête collant. */
  dropdownZindex?: number;
  /** Mise en page de l'ensemble : le champ et, à sa suite, les choix. */
  containerClassName?: string;
  /** Le champ seul, sa largeur notamment. */
  fieldClassName?: string;
  'data-test'?: string;
};

type FlatOption =
  | { kind: 'option'; option: SearchComboboxOption; group: SearchComboboxGroup }
  | { kind: 'freeText' };

/**
 * Un champ de recherche qui suggère en cours de saisie.
 *
 * Suit le motif « combobox » d'ARIA 1.2 : le focus reste dans le champ, les
 * flèches parcourent les suggestions, Entrée choisit, Échap ferme puis vide. La
 * dernière ligne cherche le texte tel quel.
 *
 * Le composant ne sait rien de ce qu'il cherche : les suggestions viennent de
 * `getSuggestions`, ce qu'un choix applique, de `onSelectOption`.
 */
export const SearchCombobox = ({
  value,
  onSearch,
  getSuggestions,
  onSelectOption,
  isOptionSelected,
  onDeselectOption,
  selections = [],
  onRemoveSelection,
  label,
  placeholder,
  minQueryLength = 2,
  debounce = 500,
  dropdownZindex = 50,
  containerClassName,
  fieldClassName,
  'data-test': dataTest,
}: SearchComboboxProps) => {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const { draft, setDraft, commit } = useSearchDraft({
    value,
    onCommit: onSearch,
    debounce,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = draft.trim();
  const canSuggest = !!getSuggestions && query.length >= minQueryLength;
  const groups = useMemo(
    () => (canSuggest && isOpen ? getSuggestions(query) : []),
    [canSuggest, isOpen, getSuggestions, query]
  );
  const flatOptions: FlatOption[] = [
    ...groups.flatMap((group) =>
      group.options.map(
        (option): FlatOption => ({ kind: 'option', option, group })
      )
    ),
    { kind: 'freeText' },
  ];
  const nbSuggestions = flatOptions.length - 1;
  const isExpanded = isOpen && canSuggest;

  const {
    refs: { setReference, setFloating },
    floatingStyles,
  } = useFloating({
    open: isExpanded,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      size({
        padding: 8,
        apply({ rects, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
            maxHeight: `${Math.min(availableHeight, 416)}px`,
          });
        },
      }),
    ],
  });

  const close = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const choose = (choice: FlatOption) => {
    if (choice.kind === 'freeText') {
      commit();
    } else {
      if (isOptionSelected?.(choice.option, choice.group)) {
        onDeselectOption?.(choice.option, choice.group);
      } else {
        onSelectOption?.(choice.option, choice.group);
      }
      commit('');
    }
    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!isExpanded) {
          setIsOpen(true);
          return;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex(
          (current) =>
            (current + step + flatOptions.length) % flatOptions.length
        );
        return;
      }
      case 'Enter':
        event.preventDefault();
        choose(
          isExpanded && activeIndex >= 0
            ? flatOptions[activeIndex]
            : { kind: 'freeText' }
        );
        return;
      case 'Escape':
        if (isExpanded) {
          event.preventDefault();
          close();
        } else if (draft) {
          event.preventDefault();
          commit('');
        }
        return;
      case 'Backspace':
        if (draft === '' && selections.length > 0) {
          onRemoveSelection?.(selections[selections.length - 1].id);
        }
        return;
    }
  };

  // La position de chaque option dans la liste à plat, celle que parcourent les
  // flèches.
  const groupOffsets = groups.map((_, groupIndex) =>
    groups
      .slice(0, groupIndex)
      .reduce((count, group) => count + group.options.length, 0)
  );

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', containerClassName)}
    >
      <div
        ref={setReference}
        className={cn(
          'flex items-stretch rounded-lg border border-solid border-grey-4 bg-grey-1 focus-within:border-primary-5',
          fieldClassName
        )}
      >
        <input
          type="search"
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={isExpanded}
          aria-controls={listboxId}
          aria-activedescendant={
            isExpanded && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          autoComplete="off"
          spellCheck={false}
          value={draft}
          placeholder={placeholder}
          data-test={dataTest}
          className="flex-1 min-w-0 py-2 px-3 bg-transparent text-sm text-grey-8 outline-none placeholder:text-xs placeholder:text-grey-6 search-reset:appearance-none search-reset:w-5 search-reset:h-5 search-reset:bg-close-circle-fill"
          onChange={(event) => {
            setDraft(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={close}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="shrink-0 px-3 border-l border-solid border-grey-4 text-primary hover:bg-primary-1"
          aria-label={uiLabels.rechercher}
          onClick={() => choose({ kind: 'freeText' })}
        >
          <Icon icon="search-line" size="sm" />
        </button>
      </div>

      {/* Les choix s'ajoutent à la suite du champ, qui garde sa taille. */}
      {selections.map((selection) => (
        <span
          key={selection.id}
          className="inline-flex items-center gap-1 max-w-full py-1 pl-2 pr-1 rounded border border-primary-4 bg-primary-2 text-xs font-bold text-primary-9"
        >
          <span className="truncate">{selection.label}</span>
          <button
            type="button"
            className="flex rounded hover:bg-primary-3"
            aria-label={uiLabels.retirerLaSelection({ label: selection.label })}
            onClick={() => onRemoveSelection?.(selection.id)}
          >
            <Icon icon="close-line" size="xs" />
          </button>
        </span>
      ))}

      <div role="status" className="sr-only">
        {isExpanded
          ? uiLabels.suggestionsTrouvees({ count: nbSuggestions })
          : ''}
      </div>

      {isExpanded && (
        <FloatingPortal>
          <ul
            ref={setFloating}
            id={listboxId}
            role="listbox"
            aria-label={uiLabels.suggestionsDeRecherche}
            aria-multiselectable={!!isOptionSelected}
            style={{ ...floatingStyles, zIndex: dropdownZindex }}
            className="m-0 p-0 py-1 list-none overflow-y-auto rounded-lg border border-solid border-grey-3 bg-white shadow-md"
            // Le focus doit rester dans le champ.
            onMouseDown={(event) => event.preventDefault()}
          >
            {groups.map((group, groupIndex) => {
              const labelId = `${id}-group-${group.id}`;
              return (
                <li key={group.id} role="presentation">
                  <div
                    id={labelId}
                    className="flex justify-between gap-2 px-3 pt-2 pb-1 text-xs font-bold uppercase text-grey-7"
                  >
                    <span>{group.label}</span>
                    {group.totalCount !== undefined &&
                      group.totalCount > group.options.length && (
                        <span className="font-normal normal-case">
                          {uiLabels.suggestionsAffichees({
                            count: group.options.length,
                            total: group.totalCount,
                          })}
                        </span>
                      )}
                  </div>
                  <ul
                    role="group"
                    aria-labelledby={labelId}
                    className="m-0 p-0 list-none"
                  >
                    {group.options.map((option, indexInGroup) => {
                      const optionIndex =
                        groupOffsets[groupIndex] + indexInGroup;
                      const isSelected = !!isOptionSelected?.(option, group);
                      return (
                        <li
                          key={option.id}
                          id={optionId(optionIndex)}
                          role="option"
                          aria-selected={isSelected}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 cursor-pointer text-sm',
                            optionIndex === activeIndex && 'bg-primary-1'
                          )}
                          onMouseMove={() => setActiveIndex(optionIndex)}
                          onClick={() =>
                            choose({ kind: 'option', option, group })
                          }
                        >
                          <span className="flex flex-col grow min-w-0">
                            <span className="flex items-center gap-2 min-w-0 text-grey-9">
                              <span className="truncate">
                                <HighlightedText
                                  text={option.label}
                                  ranges={option.highlightRanges}
                                />
                              </span>
                              {option.badge && (
                                <Badge
                                  title={option.badge}
                                  size="xs"
                                  type="outlined"
                                  variant="standard"
                                />
                              )}
                            </span>
                            {option.description && (
                              <span className="truncate text-xs text-grey-7">
                                {option.description}
                              </span>
                            )}
                          </span>
                          {option.isApproximate && (
                            <span
                              className="shrink-0"
                              title={uiLabels.correspondanceApprochanteDetail}
                            >
                              <Badge
                                title={uiLabels.correspondanceApprochante}
                                size="xs"
                                variant="warning"
                                trim={false}
                              />
                            </span>
                          )}
                          {option.meta && (
                            <span className="shrink-0 text-xs text-grey-7 tabular-nums">
                              {option.meta}
                            </span>
                          )}
                          {isSelected && (
                            <Icon
                              icon="check-line"
                              size="sm"
                              className="shrink-0 text-primary-7"
                              title={uiLabels.optionSelectionnee}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
            <li
              id={optionId(nbSuggestions)}
              role="option"
              aria-selected={false}
              className={cn(
                'flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-primary-9',
                groups.length > 0 && 'mt-1 border-t border-solid border-grey-3',
                activeIndex === nbSuggestions && 'bg-primary-1'
              )}
              onMouseMove={() => setActiveIndex(nbSuggestions)}
              onClick={() => choose({ kind: 'freeText' })}
            >
              <Icon icon="search-line" size="sm" />
              <span className="grow truncate">
                {uiLabels.rechercherLeTexte({ texte: query })}
              </span>
            </li>
          </ul>
        </FloatingPortal>
      )}
    </div>
  );
};
