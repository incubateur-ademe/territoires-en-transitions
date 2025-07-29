'use client';
import { useCurrentCollectivite } from '@/api/collectivites';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import FichesActionListe from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';
import MenuFiltresToutesLesFichesAction from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/MenuFiltresToutesLesFichesAction';
import { nameToparams } from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/filtersToParamsUtils';
import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { ListFichesRequestFilters as Filtres } from '@/domain/plans/fiches';
import { Button, ButtonMenu, Event, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useEffect, useState } from 'react';
import { useFicheActionCount } from '../FicheAction/data/useFicheActionCount';

/** Page de listing de toutes les fiches actions de la collectivité */
export const ToutesLesFichesAction = () => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();
  const [filters, setFilters] = useState<Filtres>({});

  const { count } = useFicheActionCount();

  const [filterParams, setFilterParams] = useSearchParams<Filtres>(
    makeCollectiviteToutesLesFichesUrl({
      collectiviteId,
    }),
    {},
    nameToparams
  );

  useEffect(() => {
    setFilters(convertParamsToFilters(filterParams));
  }, [filterParams]);

  const { mutate: createFicheAction } = useCreateFicheAction();
  const tracker = useEventTracker();

  return (
    <div className="min-h-[44rem] flex flex-col gap-8">
      <div className="flex justify-between max-sm:flex-col gap-y-4">
        <h2 className="mb-0">Toutes les actions</h2>
        {!isReadOnly && !!count && (
          <Button size="sm" onClick={() => createFicheAction()}>
            Créer une fiche d’action
          </Button>
        )}
      </div>
      <FichesActionListe
        filtres={filters}
        resetFilters={() => setFilterParams({})}
        sortSettings={{
          defaultSort: 'titre',
        }}
        settings={(openState: OpenState) => (
          <ButtonMenu
            openState={openState}
            variant="outlined"
            icon="equalizer-line"
            size="sm"
            text="Filtrer"
          >
            <MenuFiltresToutesLesFichesAction
              title="Filtrer les actions"
              filters={filters}
              setFilters={(filters: Filtres) => {
                setFilterParams(filters);
                tracker(Event.updateFiltres, {
                  filtreValues: filters,
                });
              }}
            />
          </ButtonMenu>
        )}
        enableGroupedActions
        isReadOnly={isReadOnly}
        displayEditionMenu
      />
    </div>
  );
};

/** Convertit les paramètres d'URL en filtres */
const convertParamsToFilters = (paramFilters: Filtres) => {
  if (paramFilters.modifiedSince && Array.isArray(paramFilters.modifiedSince)) {
    paramFilters.modifiedSince = paramFilters.modifiedSince[0];
  }
  if (paramFilters.debutPeriode && Array.isArray(paramFilters.debutPeriode)) {
    paramFilters.debutPeriode = paramFilters.debutPeriode[0];
  }
  if (paramFilters.finPeriode && Array.isArray(paramFilters.finPeriode)) {
    paramFilters.finPeriode = paramFilters.finPeriode[0];
  }
  if (paramFilters.typePeriode && Array.isArray(paramFilters.typePeriode)) {
    paramFilters.typePeriode = paramFilters.typePeriode[0];
  }
  if (paramFilters.debutPeriode && Array.isArray(paramFilters.debutPeriode)) {
    paramFilters.debutPeriode = paramFilters.debutPeriode[0];
  }
  if (paramFilters.finPeriode && Array.isArray(paramFilters.finPeriode)) {
    paramFilters.finPeriode = paramFilters.finPeriode[0];
  }
  if (
    paramFilters.hasMesuresLiees &&
    Array.isArray(paramFilters.hasMesuresLiees)
  ) {
    const hasMesuresLieesAsString = paramFilters.hasMesuresLiees[0];
    paramFilters.hasMesuresLiees =
      hasMesuresLieesAsString === undefined
        ? undefined
        : hasMesuresLieesAsString === 'true';
  }
  return paramFilters;
};
