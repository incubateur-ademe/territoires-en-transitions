import PlansActionsNavigation from './PlansActionsNavigation';
import {PlansActionsRoutes} from './PlansActionsRoutes';

const PlansActions = () => {
  return (
    <div className="fr-container !px-0">
      <div className="flex items-start">
        <PlansActionsNavigation />
        <PlansActionsRoutes />
      </div>
    </div>
  );
};

export default PlansActions;
