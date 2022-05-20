import {useHistory} from 'react-router-dom';
import {makeCollectiviteActionUrl, ReferentielParamOption} from 'app/paths';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';

export const useOpenAction = () => {
  const history = useHistory();
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId() as ReferentielParamOption;

  return ({action_id}: {action_id: string}): void => {
    const levels = action_id.split('.');
    const limitedLevels = levels
      .slice(0, referentielId === 'cae' ? 3 : 2)
      .join('.');

    if (collectiviteId && referentielId) {
      const pathname = makeCollectiviteActionUrl({
        collectiviteId,
        referentielId,
        actionId: limitedLevels,
      });
      history.push({
        pathname,
        hash:
          levels.length !== limitedLevels.length ? `#${action_id}` : undefined,
      });
    }
  };
};
