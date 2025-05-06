'use client';

import { Indicateurs } from '@/api';
import IndicateursListFilters from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-filters';
import {
  IndicateursListParamOption,
  makeCollectiviteIndicateursListUrl,
} from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/collectivites/collectivite-context';
import { ButtonMenu, useEventTracker } from '@/ui';
import IndicateursListe from './indicateurs-list';
import { IndicateursListEmpty } from './indicateurs-list-empty';
import {
  defaultListOptions,
  ListOptions,
  SearchParams,
  useIndicateursListParams,
} from './use-indicateurs-list-params';

/** Page de listing des indicateurs de la collectivité */
const IndicateursListView = ({
  defaultFilters = {},
  defaultOptions = defaultListOptions,
  listId,
}: {
  defaultFilters?: Indicateurs.FetchFiltre;
  defaultOptions?: ListOptions;
  listId: IndicateursListParamOption;
}) => {
  const collectivite = useCurrentCollectivite();

  const tracker = useEventTracker('app/indicateurs/tous', listId);

  const pathName = makeCollectiviteIndicateursListUrl({
    collectiviteId: collectivite.collectiviteId,
    listId,
  });

  const { defaultParams, searchParams, setSearchParams } =
    useIndicateursListParams(pathName, defaultFilters, defaultOptions);

  const handleSetFilters = (searchParams: SearchParams) => {
    setSearchParams(searchParams);
    tracker('filtres', {
      ...collectivite,
      filtreValues: searchParams,
    });
  };

  return (
    <IndicateursListe
      pageName="app/indicateurs/tous"
      isEditable
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      resetFilters={() => setSearchParams(defaultParams)}
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
              handleSetFilters(searchParams);
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
