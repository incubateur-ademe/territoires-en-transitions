import { Z_INDEX_ABOVE_STICKY_HEADER } from '@/app/ui/layout/HeaderSticky';
import { ButtonMenu, Checkbox } from '@tet/ui';
import {
  ReferentielTableColumnOption,
  useReferentielTableColumnVisibility,
} from './use-referentiel-table-column-visibility';

export function ReferentielTableFiltersForm({
  columnVisibility: { visibleColumnIds, setVisibleColumnIds, columnOptions },
}: {
  columnVisibility: ReturnType<typeof useReferentielTableColumnVisibility>;
}) {
  const toggleColumn = (id: string) => {
    const next = visibleColumnIds.includes(id)
      ? visibleColumnIds.filter((columnId) => columnId !== id)
      : [...visibleColumnIds, id];
    setVisibleColumnIds(next);
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <ButtonMenu
        size="sm"
        variant="outlined"
        icon="eye-line"
        withArrow
        menu={{
          className: `min-w-64 max-h-[70vh] z-${Z_INDEX_ABOVE_STICKY_HEADER}`,
          startContent: (
            <div className="flex flex-col gap-3 p-2">
              {columnOptions.map((option: ReferentielTableColumnOption) => (
                <Checkbox
                  key={option.id}
                  label={option.label}
                  checked={visibleColumnIds.includes(option.id)}
                  onChange={() => toggleColumn(option.id)}
                />
              ))}
            </div>
          ),
        }}
      >
        Colonnes
      </ButtonMenu>
    </div>
  );
}
