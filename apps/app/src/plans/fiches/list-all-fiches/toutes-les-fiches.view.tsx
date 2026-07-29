'use client';
import { appLabels } from '@/app/labels/catalog';
import { useCreateFicheAction } from '@/app/plans/fiches/data/use-create-fiche-action';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, PageHeader } from '@tet/ui';
import { FichesList } from './components/fiches-list';
import {
  FicheActionFiltersProvider,
  useFicheActionFilters,
} from './filters/fiche-action-filters-context';

const ToutesLesFichesActionContent = () => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const { mutate: createFicheAction } = useCreateFicheAction();
  const { filters } = useFicheActionFilters();

  return (
    <>
      <PageHeader>
        <PageHeader.Title>{appLabels.toutesLesActions}</PageHeader.Title>
        {hasCollectivitePermission('plans.fiches.create') && (
          <PageHeader.Actions>
            <Button size="sm" onClick={() => createFicheAction()}>
              {'Créer une action'}
            </Button>
          </PageHeader.Actions>
        )}
      </PageHeader>

      <div className="min-h-[44rem] flex flex-col gap-8">
        <FichesList defaultSort="titre" displayEditionMenu filters={filters} />
      </div>
    </>
  );
};

export const ToutesLesFichesView = () => {
  return (
    <FicheActionFiltersProvider>
      <ToutesLesFichesActionContent />
    </FicheActionFiltersProvider>
  );
};
