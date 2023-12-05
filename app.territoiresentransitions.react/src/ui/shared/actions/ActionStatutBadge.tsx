import classNames from 'classnames';
import {avancementToLabel} from 'app/labels';
import {TActionAvancementExt} from 'types/alias';

type Props = {
  className?: string;
  statut: TActionAvancementExt;
  // Indique si le statut est barré
  barre?: boolean;
  // Rend une version plus petite du composant
  small?: boolean;
};

const statusToClassNames = {
  non_renseigne: 'text-grey-6 bg-white border border-grey-5',
  pas_fait: 'text-error-1 bg-error-2',
  programme: 'text-info-1 bg-info-2',
  detaille: 'text-primary bg-primary-2',
  fait: 'text-success-1 bg-success-2',
  non_concerne: 'text-grey-6 bg-grey-3',
};

const ActionStatutBadge = ({className, statut, barre, small}: Props) => {
  return (
    <span
      data-test="ActionStatutBadge"
      className={classNames(
        className,
        // styles communs
        'w-max py-0.5 px-2 font-bold text-sm uppercase whitespace-nowrap rounded-md',
        // couleurs (et bordures) en fonction du statut
        statusToClassNames[statut],
        // variantes
        {
          'line-through': barre,
          '!text-xs !px-1': small,
        }
      )}
    >
      {avancementToLabel[statut]}
    </span>
  );
};

export default ActionStatutBadge;
