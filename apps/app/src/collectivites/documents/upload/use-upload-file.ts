import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import {
  DocumentHash,
  UploadDecisionKindEnum,
} from '@tet/domain/collectivites';
import { match } from 'ts-pattern';
import { uploadToStorage } from './upload-to-storage';

export type UploadFileArgs = {
  collectiviteId: number;
  file: File;
  hash: DocumentHash;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
  /** Pose la marque de confidentialité sur le fichier créé. */
  confidentiel?: boolean;
};

type UploadDecision =
  RouterOutput['collectivites']['documents']['createUploadToken'];

export type UploadFileResult =
  | Extract<
      UploadDecision,
      { kind: typeof UploadDecisionKindEnum.ALREADY_IN_BIBLIOTHEQUE }
    >
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

  return async ({
    collectiviteId,
    file,
    hash,
    signal,
    onProgress,
    confidentiel,
  }) => {
    const uploadDecision = await createUploadToken({ collectiviteId, hash });

    const createBibliothequeEntry = async (): Promise<UploadFileResult> => {
      const fichier = await createDocument({
        collectiviteId,
        filename: file.name,
        hash,
        confidentiel,
      });
      return { kind: 'uploaded', fichierId: fichier.id };
    };

    return match(uploadDecision)
      .with(
        { kind: UploadDecisionKindEnum.ALREADY_IN_BIBLIOTHEQUE },
        (decision) => decision
      )
      .with(
        { kind: UploadDecisionKindEnum.ALREADY_IN_STORAGE },
        createBibliothequeEntry
      )
      .with(
        { kind: UploadDecisionKindEnum.READY_TO_UPLOAD },
        async ({ token, bucketId, path }) => {
          await uploadToStorage({
            token,
            bucketId,
            path,
            file,
            signal,
            onProgress,
          });
          return createBibliothequeEntry();
        }
      )
      .exhaustive();
  };
};
