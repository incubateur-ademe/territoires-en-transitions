import {useQueries, useQuery, useQueryClient} from 'react-query';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {supabaseClient} from 'core-logic/api/supabase';
import {usePreuves} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {TFichier} from 'ui/shared/preuves/Bibliotheque/types';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';

export type TDownloadDocsProps = {
  action: ActionDefinitionSummary;
};

const URL = `/zip`;

// durée de validité des liens générées (en secondes)
const LINKS_EXPIRES_IN_SEC = 360;

const BTN = 'fr-btn fr-btn--secondary fr-btn--icon-left fr-btn--sm';

/**
 * Affiche le bouton de téléchargement des documents preuves
 */
export const DownloadDocs = (props: TDownloadDocsProps) => {
  const {action} = props;
  const {refetch, isFetching} = useDownloadDocs(action) || {};
  const queryClient = useQueryClient();

  if (isFetching) {
    return (
      <p>
        Téléchargement en cours...
        <button
          className={`${BTN} fr-ml-4w fr-fi-close-line`}
          onClick={() => queryClient.cancelQueries('zip-action')}
        >
          Annuler
        </button>
      </p>
    );
  }

  return refetch ? (
    <button
      data-test="DownloadDocs"
      className={`${BTN} fr-fi-download-line`}
      disabled={isFetching}
      onClick={() => refetch()}
    >
      Télécharger toutes les preuves
    </button>
  ) : null;
};

/**
 * Renvoie une instance de `useQuery` permettant de déclencher (en appelant la
 * fonction `refetch`) la génération et le téléchargement d'un zip et contenant
 * tous les fichiers associés à une sous-action.
 */
const useDownloadDocs = (action: ActionDefinitionSummary) => {
  const {referentiel, identifiant} = action;
  const collectivite = useCurrentCollectivite();
  const {nom} = collectivite || {};

  // récupère la liste des fichiers à télécharger
  const preuves = usePreuves({action, withSubActions: true});

  // indexe les fichiers par leur clé (pour avoir l'unicité) et retransforme en
  // tableau les valeurs restantes
  const fichiers = Object.values(
    preuves.reduce((filenameByHash, {fichier}) => {
      return fichier
        ? {...filenameByHash, [fichier.hash]: fichier}
        : filenameByHash;
    }, {} as Record<string, TFichier>)
  );

  // génère les URLs de téléchargement
  const signedUrls = useSignedUrls(fichiers);
  // et le nom du fichier cible
  const filename = `${referentiel}_${identifiant}_${nom}.zip`;

  const canFetch = collectivite && signedUrls?.length;

  // appelle le endpoint de génération du zip
  const query = useQuery(
    'zip-action',
    async ({signal}) => {
      if (canFetch) {
        const response = await fetch(URL, {
          signal,
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({signedUrls}),
        });
        // sauvegarde si le téléchargement a réussi
        if (response.status === 200) {
          const blob = await response.blob();
          await saveBlob(blob, filename);
        }
      }
    },
    {enabled: false}
  );

  return canFetch ? query : null;
};

// crée une url signée temporaire pour chaque fichier
// on n'utilise pas `createSignedUrls` (au pluriel) car cela semble ne pas
// fonctionner correctement en environnement local (mais fonctionne sur sandbox)
const useSignedUrls = (fichiers: TFichier[]) => {
  return useQueries(
    fichiers.map(({bucket_id, hash}) => {
      return {
        queryKey: ['signed-urls', bucket_id, hash],
        queryFn: () =>
          supabaseClient.storage
            .from(bucket_id)
            .createSignedUrl(hash, LINKS_EXPIRES_IN_SEC),
        staleTime: LINKS_EXPIRES_IN_SEC * 1000,
      };
    })
  )
    .map((reply, index) => {
      const {data} = reply;
      return {filename: fichiers[index].filename, url: data?.signedURL || null};
    })
    .filter(fichier => Boolean(fichier.url));
};
