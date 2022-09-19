import {useMemo} from 'react';
import {Link, useParams} from 'react-router-dom';

import {
  ReferentielParamOption,
  referentielParam,
  makeCollectiviteActionUrl,
} from 'app/paths';
import {useReferentielDownToAction} from 'core-logic/hooks/referentiel';
import {useCollectiviteId} from 'core-logic/hooks/params';

const ActionNav = ({actionId}: {actionId: string}) => {
  /**
   * Créer un tableau contenant uniquement les sous-axes et actions
   */
  const {referentielId} = useParams<{
    [referentielParam]?: ReferentielParamOption;
  }>();
  const currentReferentiel = referentielId ?? 'eci';

  const actions = useReferentielDownToAction(currentReferentiel);

  const filteredActions = useMemo(() => {
    return actions.filter(action => action.type === 'action');
  }, [actions]);

  /**
   * Génération des lien "Précédent" et "Suivant"
   */
  const collectiviteId = useCollectiviteId();

  const currentActionIndex = useMemo(() => {
    return filteredActions.findIndex(({id}) => id === actionId);
  }, [filteredActions]);

  const prevActionLink = useMemo(() => {
    if (currentActionIndex <= 0) {
      return;
    } else {
      const prevAction = filteredActions[currentActionIndex - 1];
      const link = makeCollectiviteActionUrl({
        collectiviteId: collectiviteId!,
        referentielId: currentReferentiel,
        actionId: prevAction.id,
      });
      return link;
    }
  }, [currentActionIndex]);

  const nextActionLink = useMemo(() => {
    if (currentActionIndex >= filteredActions.length - 1) {
      return;
    } else {
      const nextAction = filteredActions[currentActionIndex + 1];
      const link = makeCollectiviteActionUrl({
        collectiviteId: collectiviteId!,
        referentielId: currentReferentiel,
        actionId: nextAction.id,
      });
      return link;
    }
  }, [currentActionIndex]);

  return (
    <div className="flex justify-end mt-8">
      {prevActionLink && (
        <Link to={prevActionLink} className="mr-4 !shadow-none">
          <button className="fr-btn fr-btn--secondary fr-fi-arrow-left-line fr-btn--icon-left">
            Action précédente
          </button>
        </Link>
      )}
      {nextActionLink && (
        <Link to={nextActionLink} className="!shadow-none">
          <button className="fr-btn fr-btn fr-fi-arrow-right-line fr-btn--icon-right">
            Action suivante
          </button>
        </Link>
      )}
    </div>
  );
};

export default ActionNav;
