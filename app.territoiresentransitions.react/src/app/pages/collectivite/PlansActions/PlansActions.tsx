import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import PlansActionsNavigation from './PlansActionsNavigation';
import {PlansActionsRoutes} from './PlansActionsRoutes';

const PlansActions = () => {
  const collectivite = useCurrentCollectivite();

  return (
    <div className="fr-container !px-0">
      <div className="flex items-start">
        {collectivite && (
          <>
            <PlansActionsNavigation collectivite={collectivite} />
            <PlansActionsRoutes
              collectivite_id={collectivite.collectivite_id}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PlansActions;
