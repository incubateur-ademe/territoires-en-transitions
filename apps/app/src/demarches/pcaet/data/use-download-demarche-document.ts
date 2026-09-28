import { useDownloadSignedFile } from '@/app/collectivites/documents/data/use-download-signed-file';
import { type UseMutationResult } from '@tanstack/react-query';
import { RouterInput, useTRPCClient } from '@tet/api';

export type DossierDocumentRef =
  RouterInput['demarches']['pcaet']['getDossierDocumentUrl'];
export type AvisRapportRef =
  RouterInput['demarches']['pcaet']['getAvisFileUrl'];

export const useDownloadDossierDocument = (): UseMutationResult<
  void,
  Error,
  DossierDocumentRef
> => {
  const trpcClient = useTRPCClient();

  return useDownloadSignedFile((input: DossierDocumentRef) =>
    trpcClient.demarches.pcaet.getDossierDocumentUrl.query(input)
  );
};

export const useDownloadAvisRapport = (): UseMutationResult<
  void,
  Error,
  AvisRapportRef
> => {
  const trpcClient = useTRPCClient();

  return useDownloadSignedFile((input: AvisRapportRef) =>
    trpcClient.demarches.pcaet.getAvisFileUrl.query(input)
  );
};
