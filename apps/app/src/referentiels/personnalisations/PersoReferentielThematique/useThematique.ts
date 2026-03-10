import { useCollectiviteId } from '@tet/api/collectivites';
import { usePersonnalisationThematiques } from '../PersoReferentiel/usePersonnalisationThematiques';

// charge les informations d'une thématique
export const useThematique = (thematiqueId: string) => {
  const collectiviteId = useCollectiviteId();
  const thematiques = usePersonnalisationThematiques(collectiviteId);
  return thematiques?.find((t) => t.id === thematiqueId) || null;
};
