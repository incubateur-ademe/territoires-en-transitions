import { Badge } from '../Badge';
import { Icon } from '../Icon';
import { VisibleWhen } from '../VisibleWhen';

export type FilterCategory<TKey extends string = string> = {
  /** Unique identifier for the filter category */
  key: TKey | TKey[];
  /** Display label for the filter category */
  title: string;
  /** Array of selected filter values */
  selectedFilters: string[];
  /**
   * Whether to show the category when no filters are selected
   * useful for true/false filters where only the category is displayed
   */
  onlyShowCategory?: boolean;

  /**
   * Can't be removed
   */
  readonly?: boolean;
};

export type FilterBadgesProps<TKey extends string = string> = {
  /** Array of filter categories with their selected values */
  filterCategories: FilterCategory<TKey>[];
  /** Called when a specific filter value is removed */
  onDeleteFilterValue: (args: {
    categoryKey: TKey | TKey[];
    valueToDelete: string;
  }) => void;
  /** Called when an entire filter category is removed */
  onDeleteFilterCategory?: (categoryKey: TKey | TKey[]) => void;
  /** Called when all filters should be cleared */
  onClearAllFilters?: () => void;
};

const Filter = ({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: (() => void) | undefined;
}) => {
  return (
    <Badge
      className="rounded-md border border-primary-3 text-primary-7 gap-1 font-bold  px-3 bg-white"
      onClose={onDelete}
      title={children}
      size="sm"
      uppercase={false}
      state="standard"
    />
  );
};

const FilterByCategory = ({
  title,
  selectedFilters,
  readonly,
  onDeleteFilter,
  onDeleteCategory,
  onlyShowCategory = false,
}: {
  title: string;
  selectedFilters: string[];
  readonly?: boolean;
  onDeleteFilter: (value: string) => void;
  onDeleteCategory: (() => void) | null;
  onlyShowCategory: boolean | undefined;
}) => {
  const showRemoveCategoryButton =
    !!onDeleteCategory &&
    (onlyShowCategory || selectedFilters.length > 1) &&
    !readonly;
  return (
    <div className="inline-flex items-center rounded-md border border-grey-4 w-auto bg-white overflow-hidden">
      <span className="px-2 py-1.5 text-grey-8 font-bold text-xs bg-grey-2 border-r border-grey-4">
        {title}
      </span>
      <VisibleWhen condition={!onlyShowCategory || showRemoveCategoryButton}>
        <div className="flex items-center flex-wrap px-2 gap-1">
          <VisibleWhen condition={onlyShowCategory === false}>
            <>
              {selectedFilters
                .sort((a, b) => a.localeCompare(b))
                .map((filter) => (
                  <Filter
                    key={filter}
                    onDelete={
                      !readonly ? () => onDeleteFilter(filter) : undefined
                    }
                  >
                    {filter}
                  </Filter>
                ))}
            </>
          </VisibleWhen>

          <VisibleWhen condition={showRemoveCategoryButton}>
            <button
              onClick={() => onDeleteCategory?.()}
              className="flex items-center p-1 border border-grey-4 rounded-md"
            >
              <Icon
                icon="delete-bin-6-line"
                className="text-grey-7"
                size="xs"
              />
            </button>
          </VisibleWhen>
        </div>
      </VisibleWhen>
    </div>
  );
};

const ClearAllFiltersButton = ({
  onClick,
  children = 'Supprimer tous les filtres',
}: {
  onClick: () => void;
  disabled?: boolean;
  children?: string;
}) => {
  return (
    <button onClick={onClick}>
      <Badge
        className="px-2 py-1 bg-none"
        state="default"
        size="sm"
        icon="delete-bin-6-line"
        iconPosition="right"
        title={children}
        trim={false}
        uppercase={false}
      />
    </button>
  );
};

/**
 * A component that displays filter badges organized by categories.
 * Each category shows its title and the selected filter values as removable badges.
 */
export const BadgeFilters = <TKey extends string = string>({
  filterCategories,
  onDeleteFilterValue,
  onDeleteFilterCategory,
  onClearAllFilters,
}: FilterBadgesProps<TKey>) => {
  const removableCategories = filterCategories.filter(
    (category) =>
      !category.readonly &&
      (category.onlyShowCategory || category.selectedFilters.length > 0)
  );

  const hasMoreThanOneRemovableCategory = removableCategories.length > 1;

  const hasOnlyOneRemovableCategory =
    removableCategories.length === 1 &&
    (removableCategories[0].selectedFilters.length > 1 ||
      removableCategories[0].onlyShowCategory);

  const shouldShowClearAllFilters =
    !!onClearAllFilters &&
    hasMoreThanOneRemovableCategory &&
    !hasOnlyOneRemovableCategory &&
    filterCategories.filter((category) => !category.readonly).length > 0;

  const sortedCategoriesByReadonlyFirst = [...filterCategories].sort((a, b) => {
    if (a.readonly === b.readonly) return 0;
    return a.readonly ? -1 : 1;
  });

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {sortedCategoriesByReadonlyFirst.map((category) => {
        return (
          <FilterByCategory
            key={
              Array.isArray(category.key)
                ? category.key.join(',')
                : category.key
            }
            readonly={category.readonly}
            title={category.title}
            selectedFilters={category.selectedFilters}
            onDeleteFilter={(valueToDelete) => {
              onDeleteFilterValue({
                categoryKey: category.key,
                valueToDelete,
              });
            }}
            onDeleteCategory={
              onDeleteFilterCategory
                ? () => onDeleteFilterCategory(category.key)
                : null
            }
            onlyShowCategory={category.onlyShowCategory}
          />
        );
      })}
      <VisibleWhen condition={shouldShowClearAllFilters}>
        <ClearAllFiltersButton onClick={() => onClearAllFilters?.()}>
          Supprimer tous les filtres
        </ClearAllFiltersButton>
      </VisibleWhen>
    </div>
  );
};
