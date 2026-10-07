import { appLabels } from '@/app/labels/catalog';
import { ButtonMenu, Tooltip } from '@tet/ui';
import type { OpenState } from '@tet/ui/utils/types';
import { IndicateursListFilters } from './indicateurs-list-filters';
import type { SearchParams } from './use-indicateurs-list-params';

type Props = {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  openState: OpenState;
  hasUnsavedChanges: boolean;
};

export function IndicateursListFiltersMenu({
  searchParams,
  setSearchParams,
  openState,
  hasUnsavedChanges,
}: Props) {
  const button = (
    <ButtonMenu
      size="sm"
      variant="outlined"
      icon="equalizer-line"
      title={
        hasUnsavedChanges ? appLabels.indicateurVueUnsavedTooltip : undefined
      }
      notification={
        hasUnsavedChanges
          ? {
              variant: 'warning',
              size: 'xs',
              icon: 'information-line',
              classname: 'border-0 shadow-none',
            }
          : undefined
      }
      data-test="indicateurs.vues.filters"
      menu={{
        openState,
        disableFlip: true,
        className: 'max-w-none p-0',
        startContent: (
          <IndicateursListFilters
            searchParams={searchParams}
            setSearchParams={setSearchParams}
          />
        ),
      }}
    >
      {appLabels.filtrer}
    </ButtonMenu>
  );

  return hasUnsavedChanges ? (
    <Tooltip label={appLabels.indicateurVueUnsavedTooltip}>
      <span className="inline-flex">{button}</span>
    </Tooltip>
  ) : (
    button
  );
}
