import {useEffect} from 'react';
import {useMutation} from 'react-query';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';
import {useParcoursLabellisation} from '../ParcoursLabellisation/useParcoursLabellisation';
import {fetchComparaisonScoreAudit} from './useComparaisonScoreAudit';

export const useDownloadComparaisonScoreAuditAsCSV = (
  collectivite: CurrentCollectivite | null,
  referentiel: string | null
) => {
  const {nom, collectivite_id} = collectivite || {collectivite_id: null};

  const {parcours} = useParcoursLabellisation(referentiel);

  // encapsule la fonction de téléchargement dans une mutation pour pouvoir la
  // déclencher lorsque c'est nécessaire
  const {
    mutate: download,
    data: csvData,
    isLoading,
    isSuccess,
  } = useMutation(
    ['comparaison_scores_audit_csv', collectivite_id, referentiel],
    () => fetchComparaisonScoreAudit(collectivite_id, referentiel, true),
    {
      meta: {
        success: 'Fichier téléchargé',
        error: "Erreur lors de l'export",
      },
    }
  );

  // le nom du fichier cible
  const etoile = parseInt(parcours?.etoiles || '1');
  const filename = `${referentiel}_${etoile}_etoile${
    etoile > 1 ? 's' : ''
  }_${nom}.csv`;

  // sauvegarde le fichier après un téléchargement réussi
  useEffect(() => {
    if (csvData && isSuccess) {
      saveBlob(
        new Blob([csvData as unknown as string], {type: 'text/csv'}),
        filename
      );
    }
  }, [csvData, isSuccess]);

  // renvoi une fonction permettant de déclencher le téléchargement
  return {
    download,
    disabled: isLoading || !parcours || !collectivite,
  };
};
