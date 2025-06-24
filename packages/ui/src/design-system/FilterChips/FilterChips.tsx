import { Icon } from '@/ui/design-system/Icon';
import classNames from 'classnames';

export type FilterCategory<TKey extends string = string> = {
  /** Unique identifier for the filter category */
  key: TKey;
  /** Display label for the filter category */
  title: string;
  /** Array of selected filter values */
  selectedFilters: string[];
};

export type FilterChipsProps<TKey extends string = string> = {
  /** Array of filter categories with their selected values */
  filterCategories: FilterCategory<TKey>[];
  /** Called when a specific filter value is removed */
  onDeleteFilterValue: (categoryKey: TKey, valueToDelete: string) => void;
  /** Called when an entire filter category is removed */
  onDeleteFilterCategory: (categoryKey: TKey) => void;
  /** Called when all filters should be cleared */
  onClearAllFilters: () => void;
};

const FilterChip = ({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) => {
  return (
    <div className="flex items-center rounded-md border border-primary-3 text-primary-7 gap-1 font-bold  px-3">
      <span className="text-nowrap text-sm">{children}</span>
      <button onClick={onDelete}>
        <Icon icon="close-circle-fill" size="sm" />
      </button>
    </div>
  );
};

const FilterByCategory = ({
  title,
  selectedFilters,
  onDeleteFilter,
  onDeleteCategory,
  disabled = false,
}: {
  title: string;
  selectedFilters: string[];
  onDeleteFilter: (value: string) => void;
  onDeleteCategory: () => void;
  disabled?: boolean;
}) => {
  return (
    <div className="inline-flex items-center rounded-md border border-primary-3 w-auto">
      <div className="h-full flex items-center bg-primary-1 p-2 px-3 border-r-1 border-r-primary-3">
        <span className="align-middle text-primary-7 font-bold text-sm">
          {title}
        </span>
      </div>
      <div className="flex items-center flex-wrap gap-1 p-1">
        {selectedFilters
          .sort((a, b) => a.localeCompare(b))
          .map((filter) => (
            <FilterChip key={filter} onDelete={() => onDeleteFilter(filter)}>
              {filter}
            </FilterChip>
          ))}
      </div>
      <button
        onClick={onDeleteCategory}
        disabled={disabled}
        className={classNames('pr-1 flex items-center', {
          'opacity-50 cursor-not-allowed': disabled,
          'cursor-pointer': !disabled,
        })}
      >
        <Icon icon="close-circle-fill" className="text-primary-7" />
      </button>
    </div>
  );
};

const ClearAllFiltersButton = ({
  onClick,
  disabled = false,
  children = 'Supprimer tous les filtres',
}: {
  onClick: () => void;
  disabled?: boolean;
  children?: string;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        'h-full flex items-center justify-center gap-1 rounded-md border-grey-8 border-solid border px-2 py-1',
        'hover:bg-grey-1 transition-colors',
        {
          'opacity-50 cursor-not-allowed': disabled,
          'cursor-pointer': !disabled,
        }
      )}
    >
      <span className="text-grey-8 font-bold text-xs">{children}</span>
      <Icon icon="delete-bin-6-line" className="text-grey-8" size="sm" />
    </button>
  );
};

/**
 * A component that displays filter chips organized by categories.
 * Each category shows its title and the selected filter values as removable chips.
 */
export const FilterChips = <TKey extends string = string>({
  filterCategories,
  onDeleteFilterValue,
  onDeleteFilterCategory,
  onClearAllFilters,
}: FilterChipsProps<TKey>) => {
  const hasFilters = filterCategories.some(
    (category) => category.selectedFilters.length > 0
  );

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {filterCategories
        .filter((category) => category.selectedFilters.length > 0)
        .map((category) => (
          <FilterByCategory
            key={category.key}
            title={category.title}
            selectedFilters={category.selectedFilters}
            onDeleteFilter={(valueToDelete) => {
              onDeleteFilterValue(category.key, valueToDelete);
            }}
            onDeleteCategory={() => onDeleteFilterCategory(category.key)}
          />
        ))}
      <ClearAllFiltersButton onClick={onClearAllFilters}>
        Supprimer tous les filtres
      </ClearAllFiltersButton>
    </div>
  );
};
