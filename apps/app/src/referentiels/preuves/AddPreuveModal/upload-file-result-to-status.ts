import { UploadFileResult } from '@/app/collectivites/documents/upload/use-upload-file';
import { DocumentHash } from '@tet/domain/collectivites';
import { match } from 'ts-pattern';
import {
  UploadStatusCode,
  UploadStatusCompleted,
  UploadStatusDuplicated,
  ValidUploadStatus,
} from './types';

export const uploadFileResultToStatus = (
  uploadResult: UploadFileResult,
  hash: DocumentHash
): ValidUploadStatus =>
  match(uploadResult)
    .with(
      { kind: 'alreadyInBibliotheque' },
      ({ fichierId, filename }): UploadStatusDuplicated => ({
        code: UploadStatusCode.duplicated,
        fichierId,
        filename,
        hash,
      })
    )
    .with(
      { kind: 'uploaded' },
      ({ fichierId }): UploadStatusCompleted => ({
        code: UploadStatusCode.completed,
        fichierId,
        hash,
      })
    )
    .exhaustive();
