import classNames from 'classnames';
import {TFicheActionNiveauxPriorite} from 'types/alias';

const statusToColor: Record<TFicheActionNiveauxPriorite, string> = {
  Bas: 'text-gray-800 border-gray-800',
  Moyen: 'text-gray-800 border-gray-800',
  Élevé: 'text-gray-800 border-gray-800',
};

type Props = {
  className?: string;
  priorite: TFicheActionNiveauxPriorite;
  // Rend une version plus petite du composant
  small?: boolean;
};

const FicheActionBadgePriorite = ({className, priorite, small}: Props) => {
  return (
    <span
      className={classNames(
        className,
        'w-max py-0.5 px-2 font-bold text-sm uppercase whitespace-nowrap rounded-md border',
        {'!text-xs': small},
        statusToColor[priorite]
      )}
      title="Statut"
    >
      {priorite}
    </span>
  );
};

export default FicheActionBadgePriorite;
