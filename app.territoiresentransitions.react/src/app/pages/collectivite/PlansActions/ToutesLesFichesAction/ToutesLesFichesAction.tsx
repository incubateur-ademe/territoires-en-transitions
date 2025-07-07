'use client';
import { useCurrentCollectivite } from '@/api/collectivites';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { Header } from '@/app/plans/plans/components/header';
import { Button } from '@/ui';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { cn } from '@/ui/utils/cn';
import NextLink from 'next/link';
import { useFicheActionCount } from '../FicheAction/data/useFicheActionCount';
import FichesListe from './fiches.list';
import {
  FicheActionFiltersProvider,
  useFicheActionFilters,
} from './filters/fiche-action-filters.context';

type ToutesLesFichesActionProps = {
  type?: 'classifiees' | 'non-classifiees';
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
export const ToutesLesFichesAction = ({
  type = 'classifiees',
}: ToutesLesFichesActionProps = {}) => {
  return (
    <FicheActionFiltersProvider showFichesWithPlan={type === 'classifiees'}>
      <ToutesLesFichesActionContent type={type} />
    </FicheActionFiltersProvider>
  );
};

const ToutesLesFichesActionContent = ({
  type,
}: {
  type: 'classifiees' | 'non-classifiees';
}) => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();
  const { count } = useFicheActionCount();

  const { mutate: createFicheAction } = useCreateFicheAction();
  const title = 'Toutes les fiches';
  const { filters } = useFicheActionFilters();
  return (
    <>
      <Header
        title={title}
        actionButtons={
          <VisibleWhen condition={!isReadOnly && !!count}>
            <Button size="sm" onClick={() => createFicheAction()}>
              Créer une fiche d'action
            </Button>
          </VisibleWhen>
        }
      />
      <div className="flex gap-2">
        <Link
          href={makeCollectiviteToutesLesFichesUrl({ collectiviteId })}
          isActive={type === 'classifiees'}
        >
          Fiches des plans
        </Link>
        <Link
          href={makeCollectiviteFichesNonClasseesUrl({ collectiviteId })}
          isActive={type === 'non-classifiees'}
        >
          Fiches non classées
        </Link>
      </div>
      <div className="min-h-[44rem] flex flex-col gap-8">
        <div className="flex justify-between max-sm:flex-col gap-y-4"></div>
        <FichesListe
          sortSettings={{
            defaultSort: 'titre',
          }}
          enableGroupedActions
          isReadOnly={isReadOnly}
          displayEditionMenu
          filters={filters}
        />
      </div>
    </>
  );
};
