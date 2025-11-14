import { DBClient, useSupabase } from '@/api';
import { useCurrentCollectivite } from '@/api/collectivites';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { TFichier } from '@/app/referentiels/preuves/Bibliotheque/types';
import { usePreuves } from '@/app/referentiels/preuves/usePreuves';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { Button } from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import classNames from 'classnames';

export type TDownloadDocsProps = {
  action: ActionDefinitionSummary;
  className?: string;
};

const URL = `/api/zip`;

// durée de validité des liens générées (en secondes)
const LINKS_EXPIRES_IN_SEC = 360;

/**
 * Affiche le bouton de téléchargement des documents preuves
 */
export const DownloadDocs = ({ action, className }: TDownloadDocsProps) => {
  const { refetch, isFetching } = useDownloadDocs(action) || {};
  const queryClient = useQueryClient();

  if (isFetching) {
    return (
      <div className={classNames('flex gap-4 items-center w-fit', className)}>
        <span className="text-sm text-grey-8"> Téléchargement en cours...</span>
        <Button
          onClick={() =>
            queryClient.cancelQueries({ queryKey: ['zip-action'] })
          }
          icon="close-line"
          variant="outlined"
          size="xs"
        >
          Annuler
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
      variant="outlined"
      size="xs"
      className={className}
    >
      Télécharger tous les documents
    </Button>
  );
};

/**
 * Renvoie une instance de `useQuery` permettant de déclencher (en appelant la
 * fonction `refetch`) la génération et le téléchargement d'un zip contenant
 * tous les fichiers associés à une sous-action.
 */
const useDownloadDocs = (action: ActionDefinitionSummary) => {
  const { referentiel, identifiant } = action;
  const supabase = useSupabase();
  const collectivite = useCurrentCollectivite();
  const { nom } = collectivite || {};

  // récupère la liste des fichiers à télécharger
  const preuves = usePreuves({ action, withSubActions: true });

  // indexe les fichiers par leur clé (pour avoir l'unicité) et retransforme en
  // tableau les valeurs restantes
  const fichiers: TFichier[] = Object.values(
    preuves.reduce((filenameByHash, { fichier }) => {
      return fichier
        ? { ...filenameByHash, [fichier.hash]: fichier }
        : filenameByHash;
    }, {} as Record<string, TFichier>)
  );

  // le nom du fichier cible
  const filename = `${referentiel}_${identifiant}_${nom}.zip`;

  const canFetch = collectivite && fichiers?.length;

  // pour déclencher la génération du zip
  const query = useQuery({
    queryKey: ['zip-action', fichiers],

    queryFn: async ({ signal }) => {
      if (collectivite) {
        // génère les URLs de téléchargement
        const signedUrls = await getSignedUrls(supabase, fichiers);
        if (signedUrls?.length) {
          // et appelle le endpoint de génération du zip
          const response = await fetch(URL, {
            signal,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signedUrls }),
          });
          // sauvegarde le fichier si le téléchargement a réussi
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

// crée une url signée temporaire pour chaque fichier
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
