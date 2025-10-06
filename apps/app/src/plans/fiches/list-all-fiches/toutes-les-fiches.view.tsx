'use client';
import { useCurrentCollectivite } from '@/api/collectivites';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectiviteToutesLesFichesClasseesUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { Header } from '@/app/plans/plans/components/header';
import { Button, Spacer, VisibleWhen } from '@/ui';
import { cn } from '@/ui/utils/cn';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FichesList } from './components/fiches-list';
import {
  FicheActionFiltersProvider,
  useFicheActionFilters,
} from './filters/fiche-action-filters-context';

type ToutesLesFichesViewProps = {
  type: 'classifiees' | 'non-classifiees' | 'all';
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

const useFichesNonClasseesCount = (): number | undefined => {
  const { collectiviteId } = useCurrentCollectivite();
  const { count } = useListFiches(collectiviteId, {
    filters: { noPlan: true },
    queryOptions: { limit: 1, page: 1 },
  });
  return count;
};

const useFichesClasseesCount = (): number | undefined => {
  const { collectiviteId } = useCurrentCollectivite();
  const { count } = useListFiches(collectiviteId, {
    filters: { noPlan: false },
    queryOptions: { limit: 1, page: 1 },
  });
  return count;
};

const getLabelAndCount = (label: string, count: number | undefined) => {
  return `${label} ${count ? `(${count})` : ''}`;
};

const ToutesLesFichesActionContent = () => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();
  const fichesNonClasseesCount = useFichesNonClasseesCount();
  const fichesClasseesCount = useFichesClasseesCount();
  const totalCount =
    fichesNonClasseesCount || fichesClasseesCount
      ? (fichesNonClasseesCount || 0) + (fichesClasseesCount || 0)
      : undefined;
  const { mutate: createFicheAction } = useCreateFicheAction();
  const { filters, ficheType } = useFicheActionFilters();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get('sort');
  const sortBySearchParameter = sortParam ? `sort=${sortParam}` : '';
  return (
    <>
      <Header
        title="Toutes les fiches"
        actionButtons={
          <VisibleWhen condition={!isReadOnly}>
            <Button size="sm" onClick={() => createFicheAction()}>
              {"Créer une fiche d'action"}
            </Button>
          </VisibleWhen>
        }
      />
      <Spacer height={0.5} />
      <div className="flex gap-2">
        <Link
          href={makeCollectiviteToutesLesFichesUrl({
            collectiviteId,
            searchParams: sortBySearchParameter,
          })}
          isActive={ficheType === 'all'}
        >
          {getLabelAndCount('Toutes les fiches', totalCount)}
        </Link>
        <Link
          href={makeCollectiviteToutesLesFichesClasseesUrl({
            collectiviteId,
            searchParams: sortBySearchParameter,
          })}
          isActive={ficheType === 'classifiees'}
        >
          {getLabelAndCount('Fiches des plans', fichesClasseesCount)}
        </Link>
        <Link
          href={makeCollectiviteFichesNonClasseesUrl({
            collectiviteId,
            searchParams: sortBySearchParameter,
          })}
          isActive={ficheType === 'non-classifiees'}
        >
          {getLabelAndCount('Fiches hors plan', fichesNonClasseesCount)}
        </Link>
      </div>
      <Spacer height={1} />

      <div className="min-h-[44rem] flex flex-col gap-8">
        <FichesList
          defaultSort="titre"
          isReadOnly={isReadOnly}
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
