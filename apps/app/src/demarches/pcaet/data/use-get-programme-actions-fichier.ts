'use client';

import { PROGRAMME_ACTIONS_DOCUMENT_ID } from '@/app/demarches/pcaet/constants';
import type { DemarcheDocumentFichier } from '@tet/domain/demarches';
import { useDemarchePcaetDocumentsSnapshot } from './use-documents';

/**
 * Fichier du programme d'actions déposé à l'étape Documents, s'il y en a un.
 * La version aval, reprise après les avis, prime sur celle transmise.
 */
export const useGetProgrammeActionsFichier = (
  demarcheId: number
): DemarcheDocumentFichier | undefined => {
  const { snapshot } = useDemarchePcaetDocumentsSnapshot(demarcheId);
  const versions = (snapshot?.documents ?? []).filter(
    (document) =>
      document.documentId === PROGRAMME_ACTIONS_DOCUMENT_ID && document.fichier
  );
  return (
    (versions.find((document) => document.etape === 'aval') ?? versions[0])
      ?.fichier ?? undefined
  );
};
