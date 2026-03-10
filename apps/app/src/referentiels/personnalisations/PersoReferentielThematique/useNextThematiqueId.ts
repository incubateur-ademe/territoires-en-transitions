import { ReferentielId } from '@tet/domain/referentiels';

import { usePersonnalisationThematiques } from '../PersoReferentiel/usePersonnalisationThematiques';

export const useNextThematiqueId = (
  collectiviteId: number,
  referentiels: ReferentielId[],
  thematiqueId?: string
): string | null => {
  const data = usePersonnalisationThematiques(collectiviteId, referentiels);

  // données non valides ou pas encore chargée
  if (!data || !thematiqueId) {
    return null;
  }

  // cherche l'index de la thématique courante
  const currentThematiqueIndex = data.findIndex(
    ({ id }) => id === thematiqueId
  );
  if (currentThematiqueIndex === -1) {
    return null;
  }

  // et renvoi l'id de la thématique suivante dans la liste si elle existe
  const nextThematiqueIndex = currentThematiqueIndex + 1;
  if (nextThematiqueIndex >= data.length) {
    return null;
  }
  return data[nextThematiqueIndex].id;
};
