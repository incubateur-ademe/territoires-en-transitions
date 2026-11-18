'use client';

import { useDownloadArchive } from '@/app/utils/use-download-archive';
import { useDownloadSignedFile } from '@/app/utils/use-download-signed-file';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@tet/api';
import type {
  DemarcheExportEntry,
  DemarcheExportsRef,
  DemarcheExportType,
} from './use-list-demarche-exports';

/**
 * Télécharge un classeur du dépôt. Un export figé est servi par une URL
 * signée ; l'export du jour, fabriqué à la demande, arrive en flux du
 * contrôleur.
 *
 * Le serveur recalcule la source à chaque téléchargement, le bouton se fie à
 * la liste en cache : une transition faite ailleurs (autre onglet, autre
 * membre) la périme. On la relit donc après chaque téléchargement, abouti ou
 * non, pour que le libellé et le clic suivant suivent ce que sert le serveur.
 *
 * `onDownloaded` n'est appelé qu'une fois le fichier enregistré : un échec ou
 * une annulation ne compte pas comme un téléchargement.
 */
export const useDownloadDemarcheExport = ({
  dossierRef,
  type,
  source,
  onDownloaded,
}: {
  dossierRef: DemarcheExportsRef;
  type: DemarcheExportType;
  source: DemarcheExportEntry['source'] | undefined;
  onDownloaded?: () => void;
}): { download: () => void; isDownloading: boolean } => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const refreshExportsList = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.demarches.pcaet.exports.list.queryKey(dossierRef),
    });

  const snapshot = useDownloadSignedFile(() =>
    trpcClient.demarches.pcaet.exports.getDownloadUrl.query({
      ...dossierRef,
      type,
    })
  );

  const onDemand = useDownloadArchive({
    mutationKey: ['download-demarche-export', dossierRef, type],
    route: '/demarches/pcaet/exports/on-demand',
    params: { ...dossierRef, type },
    onSaved: onDownloaded,
    onSettled: refreshExportsList,
  });

  // Les deux chemins comptent, quelle que soit la source : la liste peut
  // basculer de l'export du jour à un export figé pendant que le flux tourne,
  // et le bouton ne doit pas se réactiver pour autant.
  const isDownloading = onDemand.status === 'downloading' || snapshot.isPending;

  return {
    download: () => {
      if (isDownloading) {
        return;
      }
      if (source === 'on_demand') {
        if (onDemand.status === 'idle') {
          onDemand.download();
        }
        return;
      }
      snapshot.mutate(undefined, {
        onSuccess: onDownloaded,
        onSettled: refreshExportsList,
      });
    },
    isDownloading,
  };
};
