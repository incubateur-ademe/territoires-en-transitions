'use client';

import { useEffect } from 'react';
import { clearDossierInstructionCookie } from './dossier-instruction-cookie';

/**
 * Efface le dossier mémorisé d'une collectivité quand le serveur l'a trouvé
 * périmé : un layout ne peut pas écrire de cookie, et le garder ferait résoudre
 * le contexte deux fois à chaque page.
 */
export const ClearDossierInstructionCookie = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  useEffect(() => {
    clearDossierInstructionCookie(collectiviteId);
  }, [collectiviteId]);

  return null;
};
