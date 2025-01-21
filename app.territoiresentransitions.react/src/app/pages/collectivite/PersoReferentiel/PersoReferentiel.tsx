import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { PageContainer } from '@/app/ui/layout/page-layout';
import Thematiques from './Thematiques';
import { usePersoFilters } from './usePersoFilters';
import { useQuestionThematiqueCompletude } from './useQuestionThematiqueCompletude';

const PersoReferentiel = () => {
  const collectivite = useCurrentCollectivite();
  const { collectiviteId: collectivite_id, nom } = collectivite || {};

  // filtre initial
  const [filters, setFilters] = usePersoFilters();
  const { referentiels } = filters;

  const thematiques = useQuestionThematiqueCompletude(
    collectivite_id || 0,
    referentiels
  );

  if (!collectivite_id) {
    return null;
  }

  return (
    <PageContainer dataTest="personnalisation" className="mt-9 mb-16">
      <Thematiques
        collectivite={{ id: collectivite_id, nom: nom || '' }}
        referentiels={referentiels}
        onChange={(newSelection) => setFilters({ referentiels: newSelection })}
        items={thematiques}
      />
    </PageContainer>
  );
};

export default PersoReferentiel;
