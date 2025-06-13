'use client';

import { useState } from 'react';

import { useCollectiviteId } from '@/api/collectivites';
import { ActionListFilters } from '@/app/referentiels/actions/use-list-actions';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useExportScore } from '@/app/referentiels/useExportScore';
import FilterBadges, { useFiltersToBadges } from '@/app/ui/lists/filter-badges';
import { ActionTypeEnum } from '@/domain/referentiels';
import { Button, ButtonMenu, Checkbox, Select } from '@/ui';
import Filters from './filters';
import List from './list';

export type DisplayOption = 'axe' | 'action';

const ActionList = () => {
  const referentielId = useReferentielId();
  const collectiviteId = useCollectiviteId();

  const { mutate: exportScore, isLoading } = useExportScore(
    referentielId,
    collectiviteId
  );

  const initialFilters: ActionListFilters = {
    actionTypes: [
      ActionTypeEnum.AXE,
      ActionTypeEnum.SOUS_AXE,
      ActionTypeEnum.ACTION,
    ],
    referentielIds: [referentielId],
  };

  const [filters, setFilters] = useState(initialFilters);

  const { data: filterBadges } = useFiltersToBadges({ filters });

  const [showDescriptionOn, setShowDescription] = useState(false);

  const [displayOption, setDisplayOption] = useState<DisplayOption>('axe');

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const onFilterChange = (filters: ActionListFilters) => {
    if (filters) {
      setFilters(filters);
      setDisplayOption('action');
    }
  };

  return (
    <main data-test="ActionsReferentiels" className="flex flex-col">
      <div className="relative flex max-md:flex-col md:items-center gap-x-6 gap-y-4 pb-6 border-b border-grey-4">
        <div className="w-full md:w-56">
          <Select
            options={[
              { value: 'axe', label: 'Par axe' },
              { value: 'action', label: 'Par mesure' },
            ]}
            onChange={(value) => {
              setDisplayOption((value as DisplayOption) ?? 'action');
              setFilters(initialFilters);
            }}
            values={[displayOption]}
            customItem={(v) => (
              <span className="text-grey-8 font-normal">{v.label}</span>
            )}
            small
          />
        </div>

        <div className="flex max-sm:flex-col sm:items-center sm:justify-between w-full gap-x-6 gap-y-4">
          <Checkbox
            label="Afficher la description des mesures"
            variant="switch"
            labelClassname="font-normal text-sm !text-grey-7"
            containerClassname="items-center"
            checked={showDescriptionOn}
            onChange={() => setShowDescription(!showDescriptionOn)}
            disabled={isLoading}
          />

          <div className="flex items-center gap-6 max-sm:w-full sm:ml-auto">
            <ButtonMenu
              openState={{
                isOpen: isFilterOpen,
                setIsOpen: setIsFilterOpen,
              }}
              size="sm"
              variant="outlined"
              icon="equalizer-line"
              text="Filtrer"
            >
              <Filters
                filters={filters}
                setFilters={(filters) => onFilterChange(filters)}
              />
            </ButtonMenu>

            <div className="w-px h-8 bg-grey-4" />

            <Button
              data-test="export-scores"
              icon={'download-fill'}
              disabled={isLoading}
              onClick={() => exportScore()}
              size="sm"
            />
          </div>
        </div>
      </div>

      <FilterBadges
        badges={filterBadges}
        resetFilters={() => onFilterChange(initialFilters)}
        className="mt-6"
      />

      <List
        filters={filters}
        toggleFilters={() => setIsFilterOpen(!isFilterOpen)}
        display={displayOption}
        showDescriptionOn={showDescriptionOn}
      />
    </main>
  );
};

export default ActionList;
