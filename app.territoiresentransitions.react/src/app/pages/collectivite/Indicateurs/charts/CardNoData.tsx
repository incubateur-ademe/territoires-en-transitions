import classNames from 'classnames';
import PictoPie from 'ui/pictogrammes/PictoPie';
import {getChartTitle} from './utils';
import {Card} from './Card';
import {TIndicateurChartProps} from './types';

// indique qu'il n'y a pas de suffisamment de données pour afficher le graphe
export const NoData = ({
  definition,
  variant,
  className,
}: TIndicateurChartProps) => (
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
    <PictoPie />
    {variant === 'zoomed' ? (
      <span className="text-grey425 text-sm">
        Aucune valeur renseignée pour l’instant
      </span>
    ) : (
      <button className="fr-btn rounded-lg">Compléter cet indicateur</button>
    )}
  </Card>
);
