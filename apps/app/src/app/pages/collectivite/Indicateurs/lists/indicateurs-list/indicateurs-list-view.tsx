'use client';

import {
  IndicateursListParamOption,
  makeCollectiviteIndicateursVueUrl,
} from '@/app/app/paths';
import { ListDefinitionsInputFilters } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { IndicateurVue } from '@/app/indicateurs/vues/data/use-indicateur-vues';
import {
  areIndicateurVueFiltersEqual,
  normalizeIndicateurVueFilters,
} from '@/app/indicateurs/vues/indicateur-vue-filters.rules';
import { IndicateurVueStatus } from '@/app/indicateurs/vues/indicateur-vue-status';
import { useIndicateurVueTabActionsContext } from '@/app/indicateurs/vues/indicateur-vue-tab-actions.context';
import { IndicateurVueActions } from '@/app/indicateurs/vues/indicateur-vue.actions';
import { RenameIndicateurVueModal } from '@/app/indicateurs/vues/rename-indicateur-vue.modal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Event, useEventTracker } from '@tet/ui';
import { omit } from 'es-toolkit';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import IndicateursListe from './indicateurs-list';
import { IndicateursListEmpty } from './indicateurs-list-empty';
import { IndicateursListFiltersMenu } from './indicateurs-list-filters.menu';
import {
  listIndicateursParamsSerializer,
  SearchParams,
  useIndicateursListParams,
} from './use-indicateurs-list-params';

const emptyFilters: ListDefinitionsInputFilters = {};

/** Page de listing des indicateurs de la collectivité */
const IndicateursListView = ({
  defaultFilters = emptyFilters,
  listId,
  vue,
}: {
  defaultFilters?: ListDefinitionsInputFilters;
  listId: IndicateursListParamOption;
  vue?: IndicateurVue;
}) => {
  const tracker = useEventTracker();
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite();
  const { setCurrentVueTabActions } = useIndicateurVueTabActionsContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [renameVue, setRenameVue] = useState<IndicateurVue | null>(null);
  const { searchParams, setSearchParams, restoreDefaultFilters } =
    useIndicateursListParams(vue?.filtres ?? defaultFilters);
  const filters = normalizeIndicateurVueFilters(
    omit(searchParams, ['sortBy', 'displayGraphs', 'currentPage'])
  );
  const hasUnsavedVueChanges =
    vue?.filtres != null && !areIndicateurVueFiltersEqual(filters, vue.filtres);
  const resetFilters = () =>
    setSearchParams({
      sortBy: searchParams.sortBy,
      displayGraphs: searchParams.displayGraphs,
      currentPage: 1,
      ...defaultFilters,
    });

  const handleSetFilters = (params: SearchParams) => {
    const nextParams = { ...params, currentPage: 1 };
    setSearchParams(nextParams);
    tracker(Event.updateFiltres, { filtreValues: nextParams });
  };

  const handleOpenVue = (saved: IndicateurVue) => {
    setIsSettingsOpen(false);
    router.push(
      listIndicateursParamsSerializer(
        makeCollectiviteIndicateursVueUrl({ collectiviteId, vueId: saved.id }),
        {
          filter: null,
          sortBy: searchParams.sortBy,
          displayGraphs: searchParams.displayGraphs,
          currentPage: 1,
        }
      )
    );
  };

  useEffect(() => {
    if (!vue) {
      setCurrentVueTabActions(null);
      return;
    }

    setCurrentVueTabActions({
      vue,
      openFilters: () => setIsSettingsOpen(true),
      restoreFilters: () => {
        restoreDefaultFilters();
        setIsSettingsOpen(false);
      },
    });

    return () => setCurrentVueTabActions(null);
  }, [restoreDefaultFilters, setCurrentVueTabActions, vue]);

  return (
    <>
      <IndicateursListe
        isEditable
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        resetFilters={resetFilters}
        defaultFilters={defaultFilters}
        status={
          vue ? (
            <IndicateurVueStatus hasUnsavedChanges={hasUnsavedVueChanges} />
          ) : undefined
        }
        actions={
          <IndicateurVueActions
            filters={filters}
            defaultFilters={defaultFilters}
            vue={vue}
            onOpenVue={handleOpenVue}
            onSaveVueFilters={(saved) => {
              setIsSettingsOpen(false);
              setRenameVue(saved);
            }}
          />
        }
        settingsOpenState={{
          isOpen: isSettingsOpen,
          setIsOpen: setIsSettingsOpen,
        }}
        renderSettings={(openState) => (
          <IndicateursListFiltersMenu
            searchParams={searchParams}
            setSearchParams={handleSetFilters}
            openState={openState}
            hasUnsavedChanges={hasUnsavedVueChanges}
          />
        )}
        renderEmpty={(isFiltered, setIsSettingsOpen) => (
          <IndicateursListEmpty
            listId={listId}
            isFiltered={isFiltered}
            setIsSettingsOpen={setIsSettingsOpen}
          />
        )}
      />
      {renameVue && (
        <RenameIndicateurVueModal
          vue={renameVue}
          onClose={() => setRenameVue(null)}
        />
      )}
    </>
  );
};

export default IndicateursListView;
