import classNames from 'classnames';
import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

type Props = {
  className?: string;
  statut: ActionAvancement;
  // Indique si le statut est barré
  barre?: boolean;
  // Rend une version plus petite du composant
  small?: boolean;
};

const ActionStatutBadge = ({className, statut, barre, small}: Props) => {
  return (
    <span
      className={classNames(
        className,
        'w-max py-0.5 px-2 font-bold text-sm uppercase whitespace-nowrap rounded-md',
        {['line-through']: barre},
        {['!text-xs !px-1']: small},
        {['text-yellow-800 bg-yellow-100']: statut === 'non_renseigne'},
        {['text-red-600 bg-pink-100']: statut === 'pas_fait'},
        {['text-blue-600 bg-blue-100']: statut === 'programme'},
        {['text-gray-600 bg-pink-100']: statut === 'detaille'},
        {['text-green-700 bg-green-200']: statut === 'fait'}
      )}
    >
      {statut === 'non_renseigne' && 'Non renseigné'}
      {statut === 'pas_fait' && 'Pas fait'}
      {statut === 'programme' && 'Programmé'}
      {statut === 'detaille' && 'Détaillé'}
      {statut === 'fait' && 'Fait'}
    </span>
  );
};

export default ActionStatutBadge;
