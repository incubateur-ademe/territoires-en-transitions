import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { DocumentHash } from '@tet/domain/collectivites';
import { uploadToStorage } from './upload-to-storage';

type UploadFileArgs = {
  collectiviteId: number;
  file: File;
  hash: DocumentHash;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
};

type UploadDecision =
  RouterOutput['collectivites']['documents']['createUploadToken'];

export type UploadFileResult =
  | Extract<UploadDecision, { kind: 'alreadyInBibliotheque' }>
  | { kind: 'uploaded'; fichierId: number };

export type UploadFile = (args: UploadFileArgs) => Promise<UploadFileResult>;

export const useUploadFile = (): UploadFile => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync: createUploadToken } = useMutation(
    trpc.collectivites.documents.createUploadToken.mutationOptions()
  );

  const { mutateAsync: createDocument } = useMutation(
    trpc.collectivites.documents.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            trpc.collectivites.documents.listBibliothequeDocuments.pathKey(),
        });
      },
    })
  );

  return async ({ collectiviteId, file, hash, signal, onProgress }) => {
    const uploadDecision = await createUploadToken({ collectiviteId, hash });
    if (uploadDecision.kind === 'alreadyInBibliotheque') {
      return uploadDecision;
    }

    await uploadToStorage({
      token: uploadDecision.token,
      bucketId: uploadDecision.bucketId,
      path: uploadDecision.path,
      file,
      signal,
      onProgress,
    });

    const fichier = await createDocument({
      collectiviteId,
      filename: file.name,
      hash,
    });
    return { kind: 'uploaded', fichierId: fichier.id };
  };
};
