import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { TFichier } from '@/app/referentiels/preuves/Bibliotheque/types';
import { usePreuves } from '@/app/referentiels/preuves/usePreuves';
import { appLabels } from '@/app/labels/catalog';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DBClient, useSupabase } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import classNames from 'classnames';

export type TDownloadDocsProps = {
  action: ActionDefinitionSummary;
  className?: string;
};

const URL = `/api/zip`;

const LINKS_EXPIRES_IN_SEC = 360;

export const DownloadDocs = ({ action, className }: TDownloadDocsProps) => {
  const { refetch, isFetching } = useDownloadDocs(action) || {};
  const queryClient = useQueryClient();

  if (isFetching) {
    return (
      <div className={classNames('flex gap-4 items-center w-fit', className)}>
        <span className="text-sm text-grey-8">
          {appLabels.telechargementEnCours}
        </span>
        <Button
          onClick={() =>
            queryClient.cancelQueries({ queryKey: ['zip-action'] })
          }
          icon="close-line"
          variant="outlined"
          size="xs"
        >
          {appLabels.annuler}
        </Button>
      </div>
    );
  }

  return (
    <Button
      dataTest="DownloadDocs"
      icon="download-line"
      disabled={isFetching || !refetch}
      onClick={refetch ? () => refetch() : undefined}
      size="xs"
      className={className}
    >
      {appLabels.telechargerTousDocuments}
    </Button>
  );
};

const useDownloadDocs = (action: ActionDefinitionSummary) => {
  const { referentiel, identifiant } = action;
  const supabase = useSupabase();
  const collectivite = useCurrentCollectivite();
  const { nom } = collectivite || {};

  const preuves = usePreuves({ action, withSubActions: true });

  const fichiers: TFichier[] = Object.values(
    preuves.reduce((filenameByHash, { fichier }) => {
      return fichier
        ? { ...filenameByHash, [fichier.hash]: fichier }
        : filenameByHash;
    }, {} as Record<string, TFichier>)
  );

  const filename = `${referentiel}_${identifiant}_${nom}.zip`;

  const canFetch = collectivite && fichiers?.length;

  const query = useQuery({
    queryKey: ['zip-action', fichiers],

    queryFn: async ({ signal }) => {
      if (collectivite) {
        const signedUrls = await getSignedUrls(supabase, fichiers);
        if (signedUrls?.length) {
          const response = await fetch(URL, {
            signal,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signedUrls }),
          });
          if (response.status === 200) {
            const blob = await response.blob();
            await saveBlob(blob, filename);
          }
        }
      }
    },

    enabled: false,
    staleTime: 0,
  });

  return canFetch ? query : null;
};

const getSignedUrls = async (supabase: DBClient, fichiers: TFichier[]) => {
  const signedUrls = await Promise.all(
    fichiers.map(({ bucket_id, hash }) =>
      supabase.storage
        .from(bucket_id)
        .createSignedUrl(hash, LINKS_EXPIRES_IN_SEC)
    )
  );
  return signedUrls
    .map(({ data }, index) => {
      return {
        filename: fichiers[index].filename,
        url: data?.signedUrl || null,
      };
    })
    .filter((fichier) => Boolean(fichier.url));
};
