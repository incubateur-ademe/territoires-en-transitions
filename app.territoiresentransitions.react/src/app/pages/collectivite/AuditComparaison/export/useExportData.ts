import {useMemo} from 'react';
import {useReferentielCommentaires} from 'core-logic/hooks/useActionCommentaire';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {indexBy} from 'utils/indexBy';
import {useAuditeurs} from '../../Audit/useAudit';
import {useReferentielData} from '../../ReferentielTable/useReferentiel';
import {useComparaisonScoreAudit} from '../useComparaisonScoreAudit';
import {configParReferentiel} from './config';
import {useExportTemplate} from './useExportTemplate';

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
  } = useExportTemplate(referentiel);

  // chargement du référentiel
  const {rows, isLoading: isLoadingReferentiel} =
    useReferentielData(referentiel);
  const actionsByIdentifiant = useMemo(
    () => indexBy(rows, 'identifiant'),
    [rows]
  );

  // chargement des scores
  const {data: scores, isLoading: isLoadingScores} = useComparaisonScoreAudit(
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

  // chargement de la liste des auditeurs
  const {data: auditeurs, isLoading: isLoadingAuditeurs} = useAuditeurs();

  const isLoading =
    isLoadingTemplate ||
    isLoadingReferentiel ||
    isLoadingScores ||
    isLoadingCommentaires ||
    isLoadingAuditeurs;

  const config = referentiel && configParReferentiel[referentiel];

  const isValidData =
    referentiel &&
    config &&
    collectivite &&
    scoresByActionId &&
    actionsByIdentifiant &&
    commentairesByActionId &&
    auditeurs;

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
            auditeurs,
          },
  };
};
