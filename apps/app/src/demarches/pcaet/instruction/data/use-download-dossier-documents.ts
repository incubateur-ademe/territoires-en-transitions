import {
  useDownloadArchive,
  type DownloadArchive,
} from '@/app/utils/use-download-archive';
import type { DossierInstructionRef } from '../dossier-instruction-ref';

export const useDownloadDossierDocuments = (
  dossierRef: DossierInstructionRef
): DownloadArchive =>
  useDownloadArchive({
    mutationKey: ['download-dossier-documents', dossierRef],
    route: '/demarches/pcaet/dossiers/documents/archive',
    params: dossierRef,
  });
