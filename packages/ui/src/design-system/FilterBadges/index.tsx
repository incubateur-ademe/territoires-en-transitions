import { Badge } from '@/ui/design-system/Badge';
import { Icon } from '@/ui/design-system/Icon';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';

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
  onDelete: () => void;
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
  onDeleteFilter,
  onDeleteCategory,
}: {
  title: string;
  selectedFilters: string[];
  onDeleteFilter: (value: string) => void;
  onDeleteCategory: (() => void) | null;
}) => {
  const showRemoveCategoryButton = !!onDeleteCategory;
  return (
    <div className="inline-flex items-center bg-primary-1 rounded-md border border-primary-3 w-auto py-2 px-3 gap-1">
      <div className="h-full flex items-center border-r-1 border-r-primary-3">
        <span className="align-middle text-primary-7 font-bold text-sm">
          {title}
        </span>
      </div>
      <div className="flex items-center flex-wrap gap-1 bg-grey-2">
        {selectedFilters
          .sort((a, b) => a.localeCompare(b))
          .map((filter) => (
            <Filter key={filter} onDelete={() => onDeleteFilter(filter)}>
              {filter}
            </Filter>
          ))}
      </div>
      <VisibleWhen condition={showRemoveCategoryButton}>
        <button
          onClick={onDeleteCategory!}
          className="flex items-center cursor-pointer"
        >
          <Icon icon="close-circle-fill" className="text-primary-7" />
        </button>
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
export const FilterBadges = <TKey extends string = string>({
  filterCategories,
  onDeleteFilterValue,
  onDeleteFilterCategory,
  onClearAllFilters,
}: FilterBadgesProps<TKey>) => {
  const shouldShowClearAllFilters =
    !!onClearAllFilters && filterCategories.length > 0;
  return (
    <div className="flex gap-2 items-center flex-wrap">
      {filterCategories.map((category) => {
        const isVisible =
          category.onlyShowCategory === true ||
          category.selectedFilters.length > 0;

        if (!isVisible) {
          return null;
        }
        return (
          <FilterByCategory
            key={
              Array.isArray(category.key)
                ? category.key.join(',')
                : category.key
            }
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
          />
        );
      })}
      <VisibleWhen condition={shouldShowClearAllFilters}>
        <ClearAllFiltersButton onClick={onClearAllFilters!}>
          Supprimer tous les filtres
        </ClearAllFiltersButton>
      </VisibleWhen>
    </div>
  );
};
