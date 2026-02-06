'use client';
import {
  getNumberOfActiveFilters,
  SetFilters,
} from '@/app/app/pages/CollectivitesEngagees/data/filters';
import { trierParOptions } from '@/app/app/pages/CollectivitesEngagees/data/filtreOptions';
import { getRechercheViewUrl, RecherchesViewParam } from '@/app/app/paths';
import { DeleteFiltersButton } from '@/app/ui/lists/filter-badges/delete-filters.button';
import { CollectiviteEngagee } from '@tet/api';
import { ButtonGroup, Select } from '@tet/ui';
import classNames from 'classnames';
import { useRouter, useSearchParams } from 'next/navigation';

const viewToText: Record<
  RecherchesViewParam,
  {
    singular: string;
    plural: string;
  }
> = {
  collectivites: {
    singular: 'collectivité active',
    plural: 'collectivités actives',
  },
  referentiels: {
    singular: 'collectivité active',
    plural: 'collectivités actives',
  },
  plans: {
    singular: 'plan',
    plural: 'plans',
  },
};

type CollectivitesHeaderProps = {
  view: RecherchesViewParam;
  initialFilters: CollectiviteEngagee.Filters;
  filters: CollectiviteEngagee.Filters;
  dataCount?: number;
  isLoading: boolean;
  setFilters: SetFilters;
  collectiviteId?: number;
};

export const CollectivitesHeader = ({
  view,
  initialFilters,
  filters,
  dataCount,
  isLoading,
  setFilters,
  collectiviteId,
}: CollectivitesHeaderProps) => {
  const router = useRouter();
  const search = useSearchParams();
  const getTrierParOptions = () => {
    const options = [{ value: 'nom', label: 'Ordre alphabétique' }];
    return view === 'referentiels' ? trierParOptions : options;
  };

  const handleChangeView = (view: RecherchesViewParam) => {
    setFilters({ ...filters, page: 1 });
    router.push(
      `${getRechercheViewUrl({
        collectiviteId,
        view,
      })}?${search.toString()}`
    );
  };

  return (
    <div className="flex flex-col">
      <h1 className="mb-4">Collectivités</h1>
      <div className="flex max-md:flex-col gap-3 items-start md:items-center justify-between py-3 border-y border-primary-3">
        <div className="flex flex-wrap max-md:flex-col items-center gap-3 max-md:w-full">
          {view === 'referentiels' && (
            <div className="w-full md:w-60 max-w-full">
              {/* Ordre d'affichage */}
              <Select
                options={getTrierParOptions()}
                onChange={(value) => {
                  if (value) {
                    setFilters({
                      ...filters,
                      trierPar: [value as string],
                    });
                  }
                }}
                values={filters.trierPar?.[0]}
                customItem={(v) => (
                  <span className="text-grey-9">{v.label}</span>
                )}
                small
              />
            </div>
          )}

          {/* Nombre de résultats filtrés */}
          <span className="mb-0 text-grey-6 text-sm">
            {`${dataCount ?? '-'} ${
              dataCount === 1
                ? `${viewToText[view].singular}`
                : `${viewToText[view].plural}`
            } ${
              dataCount === 1 ? 'correspond' : 'correspondent'
            } à votre recherche`}
          </span>
        </div>

        <div className="max-md:order-first max-md:mx-auto shrink-0 max-md:w-full">
          {/* Sélection de la vue */}
          <ButtonGroup
            size="sm"
            className="max-md:hidden"
            activeButtonId={view as string}
            buttons={[
              {
                id: 'collectivites',
                children: 'Collectivités',
                icon:
                  view === 'collectivites'
                    ? 'layout-grid-fill'
                    : 'layout-grid-line',
                onClick: () => handleChangeView('collectivites'),
              },
              {
                id: 'referentiels',
                'data-test': 'ToggleVueCollectivite',
                children: 'Référentiels',
                icon: view === 'referentiels' ? 'star-fill' : 'star-line',
                onClick: () => handleChangeView('referentiels'),
              },
              {
                id: 'plans',
                'data-test': 'ToggleVuePlan',
                children: 'Plans',
                icon: view === 'plans' ? 'list-check' : 'list-unordered',
                onClick: () => handleChangeView('plans'),
              },
            ]}
          />

          {/* Sélection de la vue - petit écran */}
          <div className="w-full md:hidden">
            <Select
              options={[
                { label: 'Collectivités', value: 'collectivites' },
                { label: 'Référentiels', value: 'referentiels' },
                { label: 'Plans', value: 'plans' },
              ]}
              onChange={(value) =>
                value && handleChangeView(value as RecherchesViewParam)
              }
              values={view}
              customItem={(v) => <span className="text-grey-9">{v.label}</span>}
              small
            />
          </div>
        </div>
      </div>

      {/* Suppression des filtres */}
      <DeleteFiltersButton
        dataTest="desactiver-les-filtres"
        onClick={() =>
          setFilters({
            ...initialFilters,
            trierPar: view === 'referentiels' ? ['score'] : ['nom'],
          })
        }
        disabled={isLoading}
        className={classNames('ml-auto my-4', {
          invisible: getNumberOfActiveFilters(filters) === 0,
        })}
      />
    </div>
  );
};

export default CollectivitesHeader;
