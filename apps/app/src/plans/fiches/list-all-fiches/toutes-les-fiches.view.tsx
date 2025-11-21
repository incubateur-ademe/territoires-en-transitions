'use client';
import { useCurrentCollectivite } from '@/api/collectivites';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { Header } from '@/app/plans/plans/components/header';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { Button, Spacer, VisibleWhen } from '@/ui';
import { cn } from '@/ui/utils/cn';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FichesList } from './components/fiches-list';
import {
  FicheActionFiltersProvider,
  FicheActionViewType,
  useFicheActionFilters,
} from './filters/fiche-action-filters-context';
import { useCountFiches } from './hooks/use-count-fiches';

type ToutesLesFichesViewProps = {
  type: FicheActionViewType;
};

const Link = ({
  href,
  children,
  isActive,
}: {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
}) => {
  return (
    <NextLink
      href={href}
      className={cn('bg-none px-3 py-1 text-primary-9 font-bold', {
        'rounded-lg border border-gray-200 bg-white hover:bg-white shadow-sm hover:shadow-md':
          isActive,
      })}
    >
      {children}
    </NextLink>
  );
};

const getLabelAndCount = (label: string, count: number | undefined) => {
  return `${label} ${count ? `(${count})` : ''}`;
};

const viewTitleByType: Record<FicheActionViewType, string> = {
  all: 'Toutes les fiches',
  classifiees: 'Fiches des plans',
  'non-classifiees': 'Fiches hors plan',
  'mes-fiches': 'Mes fiches',
};

const ToutesLesFichesActionContent = () => {
  const { collectiviteId, isReadOnly, permissions } = useCurrentCollectivite();
  const { countFichesNonClassees, countFichesClassees, countTotalFiches } =
    useCountFiches();
  const { mutate: createFicheAction } = useCreateFicheAction();
  const { filters, ficheType } = useFicheActionFilters();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get('sort');
  const sortBySearchParameter = sortParam ? `sort=${sortParam}` : '';

  const ficheActionViews: {
    type: FicheActionViewType;
    label: string;
    isVisibleWithPermissions: boolean;
  }[] = [
    {
      isVisibleWithPermissions: hasPermission(
        permissions,
        'plans.fiches.read_public'
      ),
      type: 'all',
      label: getLabelAndCount(viewTitleByType.all, countTotalFiches),
    },
    {
      isVisibleWithPermissions: hasPermission(
        permissions,
        'plans.fiches.read_public'
      ),
      type: 'classifiees',
      label: getLabelAndCount(viewTitleByType.classifiees, countFichesClassees),
    },
    {
      isVisibleWithPermissions: hasPermission(
        permissions,
        'plans.fiches.read_public'
      ),
      type: 'non-classifiees',
      label: getLabelAndCount(
        viewTitleByType['non-classifiees'],
        countFichesNonClassees
      ),
    },
    {
      isVisibleWithPermissions: hasPermission(permissions, 'plans.fiches.read'),
      type: 'mes-fiches',
      label: getLabelAndCount(viewTitleByType['mes-fiches'], undefined),
    },
  ];

  return (
    <>
      <Header
        title="Toutes les fiches"
        actionButtons={
          <VisibleWhen
            condition={
              !isReadOnly && hasPermission(permissions, 'plans.fiches.create')
            }
          >
            <Button size="sm" onClick={() => createFicheAction()}>
              {"Créer une fiche d'action"}
            </Button>
          </VisibleWhen>
        }
      />
      <Spacer height={0.5} />
      <div className="flex gap-2">
        {ficheActionViews.map((view) => {
          if (!view.isVisibleWithPermissions) {
            return null;
          }

          return (
            <Link
              key={view.type}
              href={makeCollectiviteToutesLesFichesUrl({
                collectiviteId,
                ficheViewType: view.type,
                searchParams: sortBySearchParameter,
              })}
              isActive={ficheType === view.type}
            >
              {view.label}
            </Link>
          );
        })}
      </div>
      <Spacer height={1} />

      <div className="min-h-[44rem] flex flex-col gap-8">
        <FichesList
          defaultSort="titre"
          isReadOnly={isReadOnly}
          permissions={permissions}
          displayEditionMenu
          filters={filters}
        />
      </div>
    </>
  );
};

export const ToutesLesFichesView = ({ type }: ToutesLesFichesViewProps) => {
  return (
    <FicheActionFiltersProvider ficheType={type}>
      <ToutesLesFichesActionContent />
    </FicheActionFiltersProvider>
  );
};
