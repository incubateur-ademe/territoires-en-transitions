import classNames from 'classnames';
import {Icon, Notification} from '@tet/ui';
import {FicheAction} from './data/types';
import {useFicheActionImpactId} from './data/useFicheActionImpactId';
import {ModaleActionImpact} from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionImpact/ModaleActionImpact';

type FicheActionImpactProps = {
  fiche: FicheAction;
};

/** Indique sur une fiche action si elle est issue d'une action à impact */
const FicheActionImpact = ({fiche}: FicheActionImpactProps) => {
  const {data: actionImpactId} = useFicheActionImpactId(fiche.id);

  return actionImpactId ? (
    <ModaleActionImpact actionImpactId={actionImpactId}>
      <div
        className={classNames(
          'relative bg-white border border-grey-3 rounded-lg py-2 px-2.5 h-14 text-sm text-primary-10 font-medium italic flex gap-2 items-center max-md:justify-center cursor-pointer hover:bg-primary-2 transition-colors'
        )}
      >
        <Notification
          icon="shopping-basket-line"
          size="xs"
          classname="h-6 w-8 justify-center"
        />
        <span className="mt-1">Fiche action issue du panier d’action</span>
        <Icon className="!absolute right-4 text-primary-10" icon="eye-line" />
      </div>
    </ModaleActionImpact>
  ) : null;
};

export default FicheActionImpact;
