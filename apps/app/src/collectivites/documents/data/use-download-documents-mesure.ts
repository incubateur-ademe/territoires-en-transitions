import {
  useDownloadArchive,
  type DownloadArchive,
} from '@/app/utils/use-download-archive';
import { ActionId } from '@tet/domain/referentiels';

const makeDownloadArchiveRoute = ({
  collectiviteId,
  actionId,
}: {
  collectiviteId: number;
  actionId: ActionId;
}): string =>
  `/collectivites/${collectiviteId}/mesures/${actionId}/documents/archive`;

export const useDownloadDocumentsMesure = ({
  collectiviteId,
  actionId,
}: {
  collectiviteId: number;
  actionId: ActionId;
}): DownloadArchive =>
  useDownloadArchive({
    mutationKey: ['download-documents-mesure', collectiviteId, actionId],
    route: makeDownloadArchiveRoute({ collectiviteId, actionId }),
  });
