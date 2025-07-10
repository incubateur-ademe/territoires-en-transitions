'use client';
import { useCurrentCollectivite } from '@/api/collectivites';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectiviteToutesLesFichesClasseesUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { useFichesCountBy } from '@/app/plans/fiches/_data/use-fiches-count-by';
import { Header } from '@/app/plans/plans/components/header';
import { Button } from '@/ui';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { cn } from '@/ui/utils/cn';
import NextLink from 'next/link';
import { FichesList } from './fiches.list';
import {
  FicheActionFiltersProvider,
  useFicheActionFilters,
} from './filters/fiche-action-filters.context';

type ToutesLesFichesActionProps = {
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

const useFichesNonClasseesCount = (): number => {
  const { data } = useFichesCountBy('statut', { noPlan: true });
  return data?.total || 0;
};

const useFichesClasseesCount = (): number => {
  const { data } = useFichesCountBy('statut', { noPlan: false });
  return data?.total || 0;
};

export const ToutesLesFichesAction = ({ type }: ToutesLesFichesActionProps) => {
  return (
    <FicheActionFiltersProvider ficheType={type}>
      <ToutesLesFichesActionContent />
    </FicheActionFiltersProvider>
  );
};

const ToutesLesFichesActionContent = () => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();
  const nonClasseesCount = useFichesNonClasseesCount();
  const classeesCount = useFichesClasseesCount();
  const totalCount = nonClasseesCount + classeesCount;
  const { mutate: createFicheAction } = useCreateFicheAction();
  const title = 'Toutes les fiches';
  const { filterParameters, ficheType } = useFicheActionFilters();
  return (
    <>
      <Header
        title={title}
        actionButtons={
          <VisibleWhen condition={!isReadOnly}>
            <Button size="sm" onClick={() => createFicheAction()}>
              Créer une fiche d'action
            </Button>
          </VisibleWhen>
        }
      />
      <div className="flex gap-2">
        <Link
          href={makeCollectiviteToutesLesFichesUrl({ collectiviteId })}
          isActive={ficheType === 'all'}
        >
          Toutes les fiches {`(${totalCount})`}
        </Link>
        <Link
          href={makeCollectiviteToutesLesFichesClasseesUrl({ collectiviteId })}
          isActive={ficheType === 'classifiees'}
        >
          Fiches des plans {`(${classeesCount})`}
        </Link>
        <Link
          href={makeCollectiviteFichesNonClasseesUrl({ collectiviteId })}
          isActive={ficheType === 'non-classifiees'}
        >
          Fiches non classées {`(${nonClasseesCount})`}
        </Link>
      </div>
      <div className="min-h-[44rem] flex flex-col gap-8">
        <div className="flex justify-between max-sm:flex-col gap-y-4"></div>
        <FichesList
          sortSettings={{
            defaultSort: 'titre',
          }}
          enableGroupedActions
          isReadOnly={isReadOnly}
          displayEditionMenu
          filters={filterParameters}
        />
      </div>
    </>
  );
};
