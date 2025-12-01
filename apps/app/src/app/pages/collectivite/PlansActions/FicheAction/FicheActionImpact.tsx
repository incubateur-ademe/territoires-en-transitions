import { Icon, Notification } from '@tet/ui';
import classNames from 'classnames';
import { useFicheActionImpactId } from './data/useFicheActionImpactId';
import { ModaleActionImpact } from './FicheActionImpact/ModaleActionImpact';

type FicheActionImpactProps = {
  ficheId: number;
};

/** Indique sur une fiche action si elle est issue d'une action à impact */
const FicheActionImpact = ({ ficheId }: FicheActionImpactProps) => {
  const { data: actionImpactId } = useFicheActionImpactId(ficheId);

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
        <span className="mt-1">Fiche issue du service “Actions à Impact”</span>
        <Icon
          className="!absolute right-6 text-primary-10"
          icon="eye-line"
          size="sm"
        />
      </div>
    </ModaleActionImpact>
  ) : null;
};

export default FicheActionImpact;
