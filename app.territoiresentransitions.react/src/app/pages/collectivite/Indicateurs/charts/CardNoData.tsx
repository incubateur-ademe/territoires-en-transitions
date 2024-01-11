import classNames from 'classnames';
import PictoIndicateurVide from 'ui/pictogrammes/PictoIndicateurVide';
import {getChartTitle} from './utils';
import {Card} from './Card';
import {TIndicateurChartBaseProps} from './types';
import DSTetTooltip from 'ui/shared/floating-ui/DSTetTooltip';
import Notif from 'ui/shared/designSystem/Notif';
import IconLockFill from 'ui/shared/designSystem/icons/IconLockFill';

// indique qu'il n'y a pas de suffisamment de données pour afficher le graphe
export const CardNoData = ({
  definition,
  variant,
  className,
  isReadonly,
  aCompleter,
  confidentiel,
}: Omit<TIndicateurChartBaseProps, 'valeurs'> & {
  isReadonly: boolean;
  aCompleter?: {count?: number; total?: number};
  confidentiel?: boolean;
}) => {
  const isZoomed = variant === 'zoomed';
  const {count, total} = aCompleter || {};
  const restant = count && total && total - count;

  return (
    <Card
      className={classNames(
        'flex flex-col items-center justify-between px-10 py-6 relative',
        {'rounded-none': isZoomed},
        className
      )}
      dataTest={`chart-${definition.id}`}
    >
      {confidentiel && isReadonly && (
        <DSTetTooltip
          label={() => <p>Les données de cet indicateur sont en mode privé</p>}
        >
          <div className="absolute -top-5 left-5">
            <Notif icon={<IconLockFill />} />
          </div>
        </DSTetTooltip>
      )}
      <span className="font-bold text-[#161616]">
        {getChartTitle(definition, isZoomed)}
      </span>
      <PictoIndicateurVide className={classNames({'fr-my-4w': isReadonly})} />
      {isZoomed ? (
        <span className="text-grey425 text-sm">
          Aucune valeur renseignée pour l’instant
        </span>
      ) : (
        !isReadonly && (
          <button className="fr-btn rounded-lg">
            {restant
              ? `Compléter ${restant} indicateur${
                  restant > 1 ? 's' : ''
                } sur ${total}`
              : 'Compléter cet indicateur'}
          </button>
        )
      )}
    </Card>
  );
};
