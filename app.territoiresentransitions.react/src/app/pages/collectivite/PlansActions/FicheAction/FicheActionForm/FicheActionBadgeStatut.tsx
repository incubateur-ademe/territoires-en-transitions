import classNames from 'classnames';
import {TFicheActionStatuts} from 'types/alias';

const statusToColor: Record<TFicheActionStatuts, string> = {
  'À venir': 'text-blue-600 bg-blue-100',
  'En cours': 'text-indigo-800 bg-indigo-100',
  Réalisé: 'text-green-700 bg-green-200',
  'En pause': 'text-amber-700 bg-orange-100',
  Abandonné: 'text-rose-700 bg-rose-100',
};

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
        {'!text-xs': small},
        statusToColor[statut]
      )}
    >
      {statut}
    </span>
  );
};

export default FicheActionBadgeStatut;
