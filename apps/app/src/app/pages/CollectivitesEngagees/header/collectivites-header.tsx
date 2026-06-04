'use client';
import {
  getNumberOfActiveFilters,
  SetFilters,
} from '@/app/app/pages/CollectivitesEngagees/data/filters';
import { trierParOptions } from '@/app/app/pages/CollectivitesEngagees/data/filtreOptions';
import { getRechercheViewUrl, RecherchesViewParam } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { DeleteFiltersButton } from '@/app/ui/lists/DEPRECATED_filter-badges/delete-filters.button';
import { CollectiviteEngagee } from '@tet/api';
import { ButtonGroup, PageHeader, Select } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useRouter, useSearchParams } from 'next/navigation';

const viewToText = (view: RecherchesViewParam, count: number): string => {
  switch (view) {
    case 'collectivites':
    case 'referentiels':
      return appLabels.collectivitesActives({ count });
    case 'plans':
      return appLabels.plan({ count });
  }
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
    const options = [{ value: 'nom', label: appLabels.ordreAlphabetique }];
    return view === 'referentiels' ? trierParOptions : options;
  };

  const handleChangeView = (view: RecherchesViewParam) => {
    const searchParams = new URLSearchParams(search);
    searchParams.set('page', '1');

    router.push(
      `${getRechercheViewUrl({
        collectiviteId,
        view,
      })}?${searchParams.toString()}`
    );
  };

  return (
    <>
      <PageHeader>
        <PageHeader.Title>{appLabels.collectivitesTitre}</PageHeader.Title>
        <PageHeader.Metadata>
          <div className="flex max-md:flex-col gap-3 items-start md:items-center justify-between">
            <div className="flex flex-wrap max-md:flex-col items-center gap-3 max-md:w-full">
              {view === 'referentiels' && (
                <div className="w-full md:w-60 max-w-full">
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
                    custom={{
                      renderOptionItem: (option) => (
                        <span className="text-grey-9 text-sm">
                          {option.label}
                        </span>
                      ),
                    }}
                    small
                  />
                </div>
              )}

              <span className="mb-0 text-grey-6 text-sm">
                {appLabels.correspondAVotreRecherche({
                  count: dataCount ?? '-',
                  label: viewToText(view, dataCount ?? 0),
                })}
              </span>
            </div>

            <div className="max-md:order-first max-md:mx-auto shrink-0 max-md:w-full">
              <ButtonGroup
                size="sm"
                className="max-md:hidden"
                activeButtonId={view as string}
                buttons={[
                  {
                    id: 'collectivites',
                    children: appLabels.collectivitesTitre,
                    icon:
                      view === 'collectivites'
                        ? 'layout-grid-fill'
                        : 'layout-grid-line',
                    onClick: () => handleChangeView('collectivites'),
                  },
                  {
                    id: 'referentiels',
                    'data-test': 'ToggleVueCollectivite',
                    children: appLabels.referentielsTitre,
                    icon: view === 'referentiels' ? 'star-fill' : 'star-line',
                    onClick: () => handleChangeView('referentiels'),
                  },
                  {
                    id: 'plans',
                    'data-test': 'ToggleVuePlan',
                    children: appLabels.plansTitre,
                    icon: view === 'plans' ? 'list-check' : 'list-unordered',
                    onClick: () => handleChangeView('plans'),
                  },
                ]}
              />

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
                  custom={{
                    renderOptionItem: (option) => (
                      <span className="text-grey-9 text-sm">
                        {option.label}
                      </span>
                    ),
                  }}
                  small
                />
              </div>
            </div>
          </div>
        </PageHeader.Metadata>
      </PageHeader>

      <DeleteFiltersButton
        dataTest="desactiver-les-filtres"
        onClick={() =>
          setFilters({
            ...initialFilters,
            trierPar: view === 'referentiels' ? ['score'] : ['nom'],
          })
        }
        disabled={isLoading}
        className={cn('ml-auto my-4', {
          invisible: getNumberOfActiveFilters(filters) === 0,
        })}
      />
    </>
  );
};

export default CollectivitesHeader;
