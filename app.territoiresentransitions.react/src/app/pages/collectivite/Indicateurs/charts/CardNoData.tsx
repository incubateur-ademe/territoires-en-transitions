import classNames from 'classnames';
import PictoPie from 'ui/pictogrammes/PictoPie';
import {getChartTitle} from './utils';
import {Card} from './Card';
import {TIndicateurChartProps} from './types';

// indique qu'il n'y a pas de suffisamment de données pour afficher le graphe
export const CardNoData = ({
  definition,
  variant,
  className,
  isReadonly,
}: TIndicateurChartProps & {isReadonly: boolean}) => (
  <Card
    className={classNames(
      'flex flex-col items-center justify-between px-10 py-6',
      {'rounded-none': variant === 'zoomed'},
      className
    )}
  >
    <span className="font-bold text-[#161616]">
      {getChartTitle(definition)}
    </span>
    <PictoPie className={classNames({'fr-my-4w': isReadonly})} />
    {variant === 'zoomed' ? (
      <span className="text-grey425 text-sm">
        Aucune valeur renseignée pour l’instant
      </span>
    ) : (
      !isReadonly && (
        <button className="fr-btn rounded-lg">Compléter cet indicateur</button>
      )
    )}
  </Card>
);
