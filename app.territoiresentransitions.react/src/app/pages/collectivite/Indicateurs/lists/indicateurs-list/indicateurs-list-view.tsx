'use client';

import IndicateursListFilters from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-filters';
import { IndicateursListParamOption } from '@/app/app/paths';
import { ListIndicateursRequestFilters } from '@/domain/indicateurs';
import { ButtonMenu, Event, useEventTracker } from '@/ui';
import IndicateursListe from './indicateurs-list';
import { IndicateursListEmpty } from './indicateurs-list-empty';
import {
  SearchParams,
  useIndicateursListParams,
} from './use-indicateurs-list-params';

/** Page de listing des indicateurs de la collectivité */
const IndicateursListView = ({
  defaultFilters = {},
  listId,
}: {
  defaultFilters?: ListIndicateursRequestFilters;
  listId: IndicateursListParamOption;
}) => {
  const tracker = useEventTracker();

  const { searchParams, setSearchParams } =
    useIndicateursListParams(defaultFilters);

  const handleSetFilters = (searchParams: SearchParams) => {
    setSearchParams(searchParams);
    tracker(Event.updateFiltres, {
      filtreValues: searchParams,
    });
  };

  return (
    <IndicateursListe
      isEditable
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      resetFilters={() => setSearchParams(null)}
      defaultFilters={defaultFilters}
      renderSettings={(openState) => (
        <ButtonMenu
          openState={openState}
          variant="outlined"
          icon="equalizer-line"
          size="sm"
          text="Filtrer"
        >
          <IndicateursListFilters
            searchParams={searchParams}
            setSearchParams={(searchParams) => {
              handleSetFilters({ ...searchParams, currentPage: 1 });
            }}
            listId={listId}
          />
        </ButtonMenu>
      )}
      renderEmpty={(isFiltered, setIsSettingsOpen) => {
        return (
          <IndicateursListEmpty
            listId={listId}
            isFiltered={isFiltered}
            setIsSettingsOpen={setIsSettingsOpen}
          />
        );
      }}
    />
  );
};

export default IndicateursListView;
