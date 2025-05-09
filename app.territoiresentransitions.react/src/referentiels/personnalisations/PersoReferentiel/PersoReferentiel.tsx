'use client';

import { useCurrentCollectivite } from '@/app/collectivites/collectivite-context';
import PageContainer from '@/ui/components/layout/page-container';
import Thematiques from './Thematiques';
import { usePersoFilters } from './usePersoFilters';
import { useQuestionThematiqueCompletude } from './useQuestionThematiqueCompletude';

const PersoReferentiel = () => {
  const collectivite = useCurrentCollectivite();
  const { collectiviteId, nom } = collectivite || {};

  // filtre initial
  const [filters, setFilters] = usePersoFilters();
  const { referentiels } = filters;

  const thematiques = useQuestionThematiqueCompletude(
    collectiviteId,
    referentiels
  );

  return (
    <PageContainer dataTest="personnalisation" bgColor="white">
      <Thematiques
        collectivite={{ id: collectiviteId, nom }}
        referentiels={referentiels}
        onChange={(newSelection) => setFilters({ referentiels: newSelection })}
        items={thematiques}
      />
    </PageContainer>
  );
};

export default PersoReferentiel;
