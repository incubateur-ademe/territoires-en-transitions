import classNames from 'classnames';
import PictoIndicateurVide from 'ui/pictogrammes/PictoIndicateurVide';
import {getChartTitle} from './utils';
import {Card} from './Card';
import {TIndicateurChartProps} from './types';

// indique qu'il n'y a pas de suffisamment de données pour afficher le graphe
export const CardNoData = ({
  definition,
  variant,
  className,
  isReadonly,
  aCompleter,
}: TIndicateurChartProps & {
  isReadonly: boolean;
  aCompleter?: {count?: number; total?: number};
}) => {
  const isZoomed = variant === 'zoomed';
  const {count, total} = aCompleter || {};
  const restant = count && total && total - count;

  return (
    <Card
      className={classNames(
        'flex flex-col items-center justify-between px-10 py-6',
        {'rounded-none': isZoomed},
        className
      )}
      dataTest={`chart-${definition.id}`}
    >
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
