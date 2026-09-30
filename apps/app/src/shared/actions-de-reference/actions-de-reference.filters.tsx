import { appLabels } from '@/app/labels/catalog';
import {
  type CategorieAction,
  categorieActionEnumValues,
  LEVIER_NOM_BY_ID,
  type LevierId,
  levierIdEnumValues,
} from '@tet/domain/shared';
import {
  Input,
  type Option,
  type OptionValue,
  Select,
  SelectMultiple,
} from '@tet/ui';
import { type JSX, type ReactNode, useState } from 'react';
import type {
  ActionDeReferenceSortField,
  ActionsDeReferenceFiltersComponent,
} from './actions-de-reference.contract';

type FilterOption<Value extends string> = Readonly<Pick<Option, 'label'>> & {
  readonly value: Value;
};

const levierOptions: readonly FilterOption<LevierId>[] = levierIdEnumValues.map(
  (levierId) => ({
    value: levierId,
    label: LEVIER_NOM_BY_ID[levierId],
  })
);

const categorieOptions: readonly FilterOption<CategorieAction>[] =
  categorieActionEnumValues.map((categorie) => ({
    value: categorie,
    label: appLabels.categorieActionLabel(categorie),
  }));

const sortOptions: readonly FilterOption<ActionDeReferenceSortField>[] = [
  { value: 'titre', label: appLabels.actionsDeReferenceTriTitre },
  { value: 'levier', label: appLabels.actionsDeReferenceTriLevier },
  { value: 'categorie', label: appLabels.actionsDeReferenceTriCategorie },
];

const renderSortOption = (option: Option): JSX.Element => (
  <span className="text-sm text-grey-8">{option.label}</span>
);

const sortOptionRendering = { renderOptionItem: renderSortOption };

const keepChosenValues = <Value extends string>(
  knownValues: readonly Value[],
  chosenValues: readonly OptionValue[] | undefined
): readonly Value[] =>
  knownValues.filter((knownValue) => chosenValues?.includes(knownValue));

const FilterGroup = ({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): JSX.Element => (
  <fieldset className="flex flex-col gap-1 min-w-0 m-0 p-0 border-0">
    <legend className="mb-1 p-0 text-sm text-primary-9">{label}</legend>
    {children}
  </fieldset>
);

type MultipleChoiceFilterProps<Value extends string> = {
  readonly label: string;
  readonly options: readonly FilterOption<Value>[];
  readonly chosenValues: readonly Value[];
  readonly onChoose: (chosenValues: readonly Value[]) => void;
};

const MultipleChoiceFilter = <Value extends string>({
  label,
  options,
  chosenValues,
  onChoose,
}: MultipleChoiceFilterProps<Value>): JSX.Element => {
  const knownValues = options.map((option) => option.value);
  return (
    <FilterGroup label={label}>
      <SelectMultiple
        options={[...options]}
        values={[...chosenValues]}
        onChange={({ values }) =>
          onChoose(keepChosenValues(knownValues, values))
        }
        small
      />
    </FilterGroup>
  );
};

type SyncedSearchText = {
  readonly typedText: string;
  readonly typeText: (text: string) => void;
  readonly searchTypedText: (text: string) => void;
};

const useSyncedSearchText = ({
  searchedText,
  onSearch,
}: {
  readonly searchedText: string;
  readonly onSearch: (text: string) => void;
}): SyncedSearchText => {
  const [typedText, setTypedText] = useState(searchedText);
  const [lastReceivedText, setLastReceivedText] = useState(searchedText);
  const [lastTransmittedText, setLastTransmittedText] = useState(searchedText);

  const hasReceivedNewText = searchedText !== lastReceivedText;
  const isTransmittedTextComingBack = searchedText === lastTransmittedText;
  const hasReceivedOutsideText =
    hasReceivedNewText && !isTransmittedTextComingBack;
  if (hasReceivedNewText) {
    setLastReceivedText(searchedText);
  }
  if (hasReceivedOutsideText) {
    setLastTransmittedText(searchedText);
    setTypedText(searchedText);
  }

  const searchTypedText = (text: string): void => {
    const isTextStillTyped = text === typedText;
    if (!isTextStillTyped) {
      return;
    }
    setLastTransmittedText(text);
    onSearch(text);
  };

  return { typedText, typeText: setTypedText, searchTypedText };
};

const SearchBar = ({
  searchedText,
  onSearch,
}: {
  readonly searchedText: string;
  readonly onSearch: (text: string) => void;
}): JSX.Element => {
  const { typedText, typeText, searchTypedText } = useSyncedSearchText({
    searchedText,
    onSearch,
  });

  return (
    <Input
      type="search"
      aria-label={appLabels.actionsDeReferenceRecherche}
      placeholder={appLabels.actionsDeReferenceRecherche}
      value={typedText}
      onChange={(event) => typeText(event.target.value)}
      onSearch={searchTypedText}
      containerClassname="w-full"
      displaySize="sm"
    />
  );
};

const ActionsDeReferenceFilters: ActionsDeReferenceFiltersComponent = ({
  search,
  onSearchChange,
}) => {
  const changeSort = (chosenValue: OptionValue | undefined): void => {
    const chosenSort = sortOptions.find(
      (sortOption) => sortOption.value === chosenValue
    );
    if (chosenSort === undefined) {
      return;
    }
    onSearchChange({ sortBy: chosenSort.value });
  };

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        searchedText={search.searchedText}
        onSearch={(text) => onSearchChange({ searchedText: text })}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MultipleChoiceFilter
          label={appLabels.actionsDeReferenceLeviersLabel}
          options={levierOptions}
          chosenValues={search.leviers}
          onChoose={(leviers) => onSearchChange({ leviers })}
        />
        <MultipleChoiceFilter
          label={appLabels.actionsDeReferenceCategoriesLabel}
          options={categorieOptions}
          chosenValues={search.categories}
          onChoose={(categories) => onSearchChange({ categories })}
        />
        <FilterGroup label={appLabels.actionsDeReferenceTriLabel}>
          <Select
            options={[...sortOptions]}
            values={search.sortBy}
            onChange={changeSort}
            custom={sortOptionRendering}
            small
          />
        </FilterGroup>
      </div>
    </div>
  );
};

export { ActionsDeReferenceFilters };
