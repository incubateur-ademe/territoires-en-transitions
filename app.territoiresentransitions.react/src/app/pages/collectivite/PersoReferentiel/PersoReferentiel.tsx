import Thematiques from './Thematiques';
import {useQuestionThematiqueCompletude} from './useQuestionThematiqueCompletude';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {usePersoFilters} from './usePersoFilters';

const PersoReferentiel = () => {
  const collectivite = useCurrentCollectivite();
  const {collectivite_id, nom} = collectivite || {};

  // filtre initial
  const [filters, setFilters] = usePersoFilters();
  const {referentiels} = filters;

  const thematiques = useQuestionThematiqueCompletude(
    collectivite_id || 0,
    referentiels
  );

  if (!collectivite_id) {
    return null;
  }

  return (
    <main data-test="personnalisation" className="fr-container mt-9 mb-16">
      <Thematiques
        collectivite={{id: collectivite_id, nom: nom || ''}}
        referentiels={referentiels}
        onChange={newSelection => setFilters({referentiels: newSelection})}
        items={thematiques}
      />
    </main>
  );
};

export default PersoReferentiel;
