import {useMemo} from 'react';
import {useReferentielCommentaires} from 'core-logic/hooks/useActionCommentaire';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {indexBy} from 'utils/indexBy';
import {useExportTemplate} from 'utils/exportXLSX';
import {useReferentielData} from 'app/pages/collectivite/ReferentielTable/useReferentiel';
import {configParReferentiel} from './config';
import {useCollectiviteScores} from './useCollectiviteScores';

/** Fourni les données nécessaires à l'export des scores pendant l'audit */
export const useExportData = (
  referentiel: string | null,
  collectivite: CurrentCollectivite | null
) => {
  // fonction pour charger et cacher le fichier modèle
  const {
    refetch: loadTemplate,
    data: template,
    isLoading: isLoadingTemplate,
  } = useExportTemplate('export', referentiel);

  // chargement du référentiel
  const {rows, isLoading: isLoadingReferentiel} =
    useReferentielData(referentiel);
  const actionsByIdentifiant = useMemo(
    () => indexBy(rows, 'identifiant'),
    [rows]
  );

  // chargement des scores
  const {data: scores, isLoading: isLoadingScores} = useCollectiviteScores(
    collectivite?.collectivite_id || null,
    referentiel
  );
  const scoresByActionId = useMemo(
    () => indexBy(scores || [], 'action_id'),
    [scores]
  );

  // chargement des commentaires
  const {data: commentaires, isLoading: isLoadingCommentaires} =
    useReferentielCommentaires(
      collectivite?.collectivite_id || null,
      referentiel
    );
  const commentairesByActionId = useMemo(
    () => indexBy(commentaires || [], 'action_id'),
    [commentaires]
  );

  const isLoading =
    isLoadingTemplate ||
    isLoadingReferentiel ||
    isLoadingScores ||
    isLoadingCommentaires;

  const config = referentiel && configParReferentiel[referentiel];

  const isValidData =
    referentiel &&
    config &&
    collectivite &&
    scoresByActionId &&
    actionsByIdentifiant &&
    commentairesByActionId;

  return {
    isLoading,
    loadTemplate,
    template: template || null,
    data:
      isLoading || !isValidData
        ? null
        : {
            config,
            collectivite,
            actionsByIdentifiant,
            scoresByActionId,
            commentairesByActionId,
          },
  };
};
