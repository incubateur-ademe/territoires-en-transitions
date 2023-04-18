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
  non_renseigne: 'text-grey625 bg-white border border-grey925',
  pas_fait: 'text-error425 bg-[#FFE9E9]',
  programme: 'text-tDefaultInfo bg-[#E8EDFF]',
  detaille: 'text-bf500 bg-bf925',
  fait: 'text-[#18753C] bg-[#B8FEC9]',
  non_concerne: 'text-grey425 bg-[#EEEEEE]',
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
