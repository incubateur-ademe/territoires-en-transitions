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
import Link from 'next/link';
import { useFicheActionCount } from '../FicheAction/data/useFicheActionCount';
import FichesListe from './fiches.list';
import {
  FicheActionFiltersProvider,
  useFicheActionFilters,
} from './filters/fiche-action-filters.context';

type ToutesLesFichesActionProps = {
  /** Type de fiches à afficher */
  type?: 'classifiees' | 'non-classifiees';
};

/** Page de listing de toutes les fiches actions de la collectivité */
export const ToutesLesFichesAction = ({
  type = 'classifiees',
}: ToutesLesFichesActionProps = {}) => {
  return (
    <FicheActionFiltersProvider showFichesWithPlan={type === 'classifiees'}>
      <ToutesLesFichesActionContent />
    </FicheActionFiltersProvider>
  );
};

const ToutesLesFichesActionContent = () => {
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
      <div>
        <Link href={makeCollectiviteFichesNonClasseesUrl({ collectiviteId })}>
          Fiches non classées
        </Link>
        <Link href={makeCollectiviteToutesLesFichesUrl({ collectiviteId })}>
          Fiches classées
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
