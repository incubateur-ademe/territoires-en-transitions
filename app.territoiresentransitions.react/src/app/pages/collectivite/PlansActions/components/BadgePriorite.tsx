import classNames from 'classnames';
import {TFicheActionNiveauxPriorite} from 'types/alias';
import Badge from './Badge';

const prioritesToColor: Record<TFicheActionNiveauxPriorite, string> = {
  Bas: 'text-success-1 bg-success-2',
  Moyen: 'text-warning-1 bg-warning-2',
  Élevé: 'text-error-1 bg-error-2',
};

type Props = {
  className?: string;
  priorite: TFicheActionNiveauxPriorite;
  // Rend une version plus petite du composant
  small?: boolean;
};

const BadgePriorite = ({className, priorite, small}: Props) => {
  // return (
  //   <span
  //     className={classNames(
  //       className,
  //       'w-max py-0.5 px-2 font-bold text-sm uppercase whitespace-nowrap rounded-md border',
  //       {'!text-xs': small},
  //       statusToColor[priorite]
  //     )}
  //     title="Priorité"
  //   >
  //     {priorite}
  //   </span>
  // );
  return (
    <Badge
      title="Priorité"
      className={classNames(prioritesToColor[priorite], className)}
      label={priorite}
      small={small}
    />
  );
};

export default BadgePriorite;
