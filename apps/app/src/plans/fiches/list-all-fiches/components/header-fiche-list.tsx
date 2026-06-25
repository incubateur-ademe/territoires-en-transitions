import { appLabels } from '@/app/labels/catalog';
import { FiltersButtonMenu } from '@/app/plans/fiches/list-all-fiches/filters/filters.button-menu';
import {
  ButtonGroup,
  Checkbox,
  Event,
  Input,
  Option,
  Select,
  VisibleWhen,
} from '@tet/ui';
import type { EventName } from '@tet/ui/components/tracking/posthog-events';
import classNames from 'classnames';
import { SortByOptions } from '../../utils';
import { FicheListItem } from '../data/use-list-fiches';
import { FicheActionViewOptions } from '../hooks/use-select-fiche-view';
import { FilterBadges } from './filter-badges';

type HeaderFicheListProps = {
  sort: SortByOptions;
  sortOptions: Option[];
  handleSortChange: (value: string) => void;
  isGroupedActionsEnabled: boolean;
  isGroupedActionsModeActive: boolean;
  toggleGroupedActionsMode: (checked: boolean) => void;
  isLoading: boolean;
  search: string | undefined;
  handleSearchChange: (value: string) => void;
  handleSearchSubmit: (value: string) => void;
  resetPagination: () => void;
  view: FicheActionViewOptions;
  handleChangeView: (view: FicheActionViewOptions) => void;
  trackEvent: (event: EventName, properties?: Record<string, unknown>) => void;
  isReadOnly?: boolean;
  isSelectAllMode: boolean;
  handleSelectAll: (checked: boolean) => void;
  selectedFicheIds: number[] | 'all';
  countTotal: number;
  fiches?: FicheListItem[];
};

export const HeaderFicheList = ({
  sort,
  sortOptions,
  handleSortChange,
  isGroupedActionsEnabled,
  isGroupedActionsModeActive,
  toggleGroupedActionsMode,
  isLoading,
  search,
  handleSearchChange,
  handleSearchSubmit,
  resetPagination,
  view,
  handleChangeView,
  trackEvent,
  isReadOnly,
  isSelectAllMode,
  handleSelectAll,
  selectedFicheIds,
  countTotal,
  fiches,
}: HeaderFicheListProps) => {
  return (
    <>
      <div className="relative bg-inherit">
        <div className="relative z-[1] bg-inherit flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-x-8 gap-y-4 items-center">
            <Select
              options={sortOptions}
              onChange={(selectedOption) =>
                handleSortChange(`${selectedOption}`)
              }
              values={sort.field}
              custom={{
                renderOptionItem: (option) => (
                  <span className="text-grey-8 text-sm">{option.label}</span>
                ),
              }}
              disabled={sortOptions.length === 1}
              small
            />

            <VisibleWhen condition={isGroupedActionsEnabled}>
              <Checkbox
                label={appLabels.actionsGroupees}
                variant="switch"
                size="sm"
                labelClassname="whitespace-nowrap"
                checked={isGroupedActionsModeActive}
                onChange={(evt) => {
                  toggleGroupedActionsMode(evt.currentTarget.checked);
                }}
                disabled={isLoading}
              />
            </VisibleWhen>
          </div>

          <div className="flex gap-x-8 gap-y-4">
            <Input
              type="search"
              className="w-full"
              onChange={(e) => handleSearchChange(e.target.value)}
              onSearch={(v) => {
                handleSearchSubmit(v);
                resetPagination();
              }}
              value={search ?? ''}
              containerClassname="w-full xl:w-80"
              placeholder={appLabels.rechercherNomDescription}
              displaySize="sm"
              autoFocus
            />

            <ButtonGroup
              activeButtonId={view}
              size="sm"
              buttons={[
                {
                  id: 'grid',
                  icon: 'grid-line',
                  children: appLabels.vueGrille,
                  'data-test': 'ToggleVueGrille',
                  onClick: () => {
                    handleChangeView('grid');
                    trackEvent(Event.fiches.listChangeView.grid);
                  },
                },
                {
                  id: 'table',
                  icon: 'menu-line',
                  children: appLabels.vueTableau,
                  'data-test': 'ToggleVueTableau',
                  onClick: () => {
                    handleChangeView('table');
                    trackEvent(Event.fiches.listChangeView.table);
                  },
                },
                {
                  id: 'scheduler',
                  icon: 'calendar-line',
                  children: appLabels.vueCalendrier,
                  'data-test': 'ToggleVueCalendrier',
                  onClick: () => {
                    handleChangeView('scheduler');
                    trackEvent(Event.fiches.listChangeView.calendar);
                  },
                },
              ].filter((button) => !(isReadOnly && button.id === 'scheduler'))}
            />

            <FiltersButtonMenu />
          </div>
        </div>

        <VisibleWhen
          condition={isGroupedActionsModeActive && isGroupedActionsEnabled}
        >
          <div
            className={classNames(
              'relative flex justify-between py-5 border-b border-primary-3 transition-all duration-500',
              {
                '-translate-y-full -mb-16': !isGroupedActionsModeActive,
                'translate-y-0 mb-0': isGroupedActionsModeActive,
              }
            )}
          >
            <div className="flex items-center gap-4">
              <Checkbox
                label={appLabels.selectionnerToutesLesActions}
                checked={isSelectAllMode}
                onChange={(evt) => handleSelectAll(evt.currentTarget.checked)}
                disabled={isLoading || !fiches?.length}
              />
            </div>
            <div className="text-grey-7 font-medium">
              <span className="text-primary-9">
                {appLabels.actionSelectionneeCountLabel({
                  count: isSelectAllMode
                    ? countTotal
                    : selectedFicheIds.length || 0,
                })}
              </span>{' '}
              {appLabels.actionCountTotal({ count: countTotal })}
            </div>
          </div>
        </VisibleWhen>
      </div>

      <FilterBadges />
    </>
  );
};
