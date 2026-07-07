import { BadgeFilters, FilterCategory, cn } from '@tet/ui';

type Props = {
  filterCategories: FilterCategory[];
  className?: string;
  maxDisplayedCategoriesCount?: number;
};

export const ReadonlyFilterBadges = ({
  filterCategories,
  className,
  maxDisplayedCategoriesCount,
}: Props) => {
  if (filterCategories.length === 0) {
    return null;
  }

  return (
    <div className={cn(className)}>
      <BadgeFilters
        filterCategories={filterCategories.map((category) => ({
          ...category,
          readonly: true,
        }))}
        onDeleteFilterValue={() => undefined}
        maxDisplayedCategoriesCount={maxDisplayedCategoriesCount}
      />
    </div>
  );
};
