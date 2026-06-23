'use client';

import { Alert, Button } from '@tet/ui';
import { useSearchParams } from 'next/navigation';
import { JSX } from 'react';

/** Query param qui active le contexte « service instructeur » sur le dossier. */
export const DREAL_INSTRUCTEUR_PARAM = 'instructeur';

/**
 * Bandeau de contexte affiché en tête du dossier PCAET existant lorsqu'il est
 * consulté par un service instructeur (DREAL), via `?instructeur=1`.
 * Hors de ce contexte → ne rend rien.
 */
export const DrealContextBanner = (): JSX.Element | null => {
  const searchParams = useSearchParams();
  if (searchParams.get(DREAL_INSTRUCTEUR_PARAM) !== '1') {
    return null;
  }

  return (
    <Alert
      state="info"
      title="Vous consultez ce PCAET en tant que service instructeur (DREAL)"
      description="Accès en lecture seule. Vous pouvez télécharger les documents et déposer un avis réglementaire."
      footer={
        <Button size="sm" icon="quill-pen-line">
          Déposer un avis
        </Button>
      }
    />
  );
};
