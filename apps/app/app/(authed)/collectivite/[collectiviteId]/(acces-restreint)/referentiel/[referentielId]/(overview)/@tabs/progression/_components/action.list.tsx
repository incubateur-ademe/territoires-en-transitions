'use client';

import { useState } from 'react';

import { appLabels } from '@/app/labels/catalog';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { ActionFilterBadges } from '@/app/referentiels/actions/action-filter-badges';
import { ActionTypeEnum, ListActionsInput } from '@tet/domain/referentiels';
import { ButtonMenu, Checkbox, Select } from '@tet/ui';
import Filters from './filters';
import List from './list';

export type DisplayOption = 'axe' | 'action';

const ActionList = () => {
  const referentielId = useReferentielId();

  const initialFilters: ListActionsInput = {
    actionTypes: [
      ActionTypeEnum.AXE,
      ActionTypeEnum.SOUS_AXE,
      ActionTypeEnum.ACTION,
    ],
    referentielIds: [referentielId],
  };

  const [filters, setFilters] = useState(initialFilters);

  const [showDescriptionOn, setShowDescription] = useState(false);

  const [displayOption, setDisplayOption] = useState<DisplayOption>('axe');

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const onFilterChange = (filters: ListActionsInput) => {
    if (filters) {
      setFilters(filters);
      setDisplayOption('action');
    }
  };

  return (
    <main data-test="ActionsReferentiels" className="flex flex-col mt-4">
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
            custom={{
              renderOptionItem: (option) => (
                <span className="text-grey-8 font-normal">{option.label}</span>
              ),
            }}
            small
          />
        </div>

        <div className="flex max-sm:flex-col sm:items-center sm:justify-between w-full gap-x-6 gap-y-4">
          <Checkbox
            label="Afficher la description des mesures"
            variant="switch"
            size="sm"
            containerClassname="items-center"
            checked={showDescriptionOn}
            onChange={() => setShowDescription(!showDescriptionOn)}
          />

          <div className="flex items-center gap-6 max-sm:w-full sm:ml-auto">
            <ButtonMenu
              size="sm"
              variant="outlined"
              icon="equalizer-line"
              menu={{
                className: 'max-w-none p-0',
                openState: {
                  isOpen: isFilterOpen,
                  setIsOpen: setIsFilterOpen,
                },
                startContent: (
                  <Filters
                    filters={filters}
                    setFilters={(filters) => onFilterChange(filters)}
                  />
                ),
              }}
            >
              {appLabels.filtrer}
            </ButtonMenu>
          </div>
        </div>
      </div>

      <ActionFilterBadges
        filters={filters}
        onFiltersChange={onFilterChange}
        onClearAllFilters={() => onFilterChange(initialFilters)}
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
