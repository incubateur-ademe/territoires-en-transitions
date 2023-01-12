import classNames from 'classnames';
import {TFicheActionStatuts} from '../data/types/alias';

type Props = {
  className?: string;
  statut: TFicheActionStatuts;
  // Rend une version plus petite du composant
  small?: boolean;
};

const FicheActionBadgeStatut = ({className, statut, small}: Props) => {
  return (
    <span
      data-test="FicheActionBadgeStatut"
      className={classNames(
        className,
        'w-max py-0.5 px-2 font-bold text-sm uppercase whitespace-nowrap rounded-md',
        {'!text-xs !px-1': small},
        {'text-blue-600 bg-blue-100': statut === 'À venir'},
        {'text-indigo-800 bg-indigo-100': statut === 'En cours'},
        {'text-green-700 bg-green-200': statut === 'Réalisé'},
        {'text-amber-700 bg-orange-100': statut === 'En pause'},
        {'text-rose-700 bg-rose-100': statut === 'Abandonné'}
      )}
    >
      {statut}
    </span>
  );
};

export default FicheActionBadgeStatut;
