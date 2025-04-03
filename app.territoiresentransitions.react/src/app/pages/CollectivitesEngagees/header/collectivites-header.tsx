import { CollectiviteEngagee } from '@/api';
import {
  getNumberOfActiveFilters,
  SetFilters,
} from '@/app/app/pages/CollectivitesEngagees/data/filters';
import { trierParOptions } from '@/app/app/pages/CollectivitesEngagees/data/filtreOptions';
import {
  recherchesCollectivitesUrl,
  recherchesPlansUrl,
  RecherchesViewParam,
} from '@/app/app/paths';
import { DeleteFiltersButton } from '@/app/ui/lists/filter-badges/delete-filters.button';
import { ButtonGroup, Select } from '@/ui';
import classNames from 'classnames';
import { useRouter, useSearchParams } from 'next/navigation';

const viewToText: Record<RecherchesViewParam, string> = {
  collectivites: 'collectivité',
  plans: 'plan',
};

type CollectivitesHeaderProps = {
  view: RecherchesViewParam;
  initialFilters: CollectiviteEngagee.Filters;
  filters: CollectiviteEngagee.Filters;
  dataCount?: number;
  isLoading: boolean;
  setFilters: SetFilters;
};

const CollectivitesHeader = ({
  view,
  initialFilters,
  filters,
  dataCount,
  isLoading,
  setFilters,
}: CollectivitesHeaderProps) => {
  const router = useRouter();
  const search = useSearchParams();

  const getTrierParOptions = () => {
    const options = [{ value: 'nom', label: 'Ordre alphabétique' }];
    return view === 'collectivites' ? trierParOptions : options;
  };

  return (
    <div className="flex flex-col">
      <h1 className="mb-4">Collectivités</h1>
      <div className="flex max-lg:flex-col gap-3 items-center justify-between py-3 border-y border-primary-3">
        <div className="flex max-md:flex-col items-center gap-3 max-md:w-full">
          <div className="w-full md:w-60">
            {/* Ordre d'affichage */}
            <Select
              options={getTrierParOptions()}
              onChange={(value) => {
                value &&
                  setFilters({
                    ...filters,
                    trierPar: [value as string],
                  });
              }}
              values={filters.trierPar?.[0]}
              customItem={(v) => <span className="text-grey-9">{v.label}</span>}
              disabled={view === 'plans'}
              small
            />
          </div>

          {/* Nombre de résultats filtrés */}
          <span className="mb-0 text-grey-6 text-sm">
            {`${dataCount ?? 0} ${
              dataCount === 1 ? `${viewToText[view]}` : `${viewToText[view]}s`
            } ${
              dataCount === 1 ? 'correspond' : 'correspondent'
            } à votre recherche`}
          </span>
        </div>

        <div className="max-lg:order-first">
          {/* Sélection de la vue */}
          <ButtonGroup
            size="sm"
            activeButtonId={view as string}
            buttons={[
              {
                id: 'collectivites',
                'data-test': 'ToggleVueCollectivite',
                children: 'Collectivités',
                icon: 'layout-grid-line',
                onClick: () => {
                  setFilters({ ...filters, page: 1 });
                  router.push(
                    `${recherchesCollectivitesUrl}?${search.toString()}`
                  );
                },
              },
              {
                id: 'plans',
                'data-test': 'ToggleVuePlan',
                children: "Plans d'action",
                icon: 'list-unordered',
                onClick: () => {
                  setFilters({ ...filters, page: 1 });
                  router.push(`${recherchesPlansUrl}?${search.toString()}`);
                },
              },
            ]}
          />
        </div>
      </div>

      {/* Suppression des filtres */}
      <DeleteFiltersButton
        dataTest="desactiver-les-filtres"
        onClick={() => setFilters(initialFilters)}
        disabled={isLoading}
        className={classNames('ml-auto my-4', {
          invisible: getNumberOfActiveFilters(filters) === 0,
        })}
      />
    </div>
  );
};

export default CollectivitesHeader;
