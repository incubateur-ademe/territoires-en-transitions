import classNames from 'classnames';
import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

type Props = {
  className?: string;
  status: ActionAvancement;
  // Indique si le status est barré
  barre?: boolean;
};

const ActionStatusBadge = ({className, status, barre}: Props) => {
  return (
    <span
      className={classNames(
        className,
        'w-max py-0.5 px-2 font-bold text-sm uppercase whitespace-nowrap rounded-md',
        {['line-through']: barre},
        {['text-yellow-800 bg-yellow-100']: status === 'non_renseigne'},
        {['text-red-600 bg-pink-100']: status === 'pas_fait'},
        {['text-blue-600 bg-blue-100']: status === 'programme'},
        {['text-gray-600 bg-pink-100']: status === 'detaille'},
        {['text-green-700 bg-green-200']: status === 'fait'}
      )}
    >
      {status === 'non_renseigne' && 'Non renseigné'}
      {status === 'pas_fait' && 'Pas fait'}
      {status === 'programme' && 'Programmé'}
      {status === 'detaille' && 'Détaillé'}
      {status === 'fait' && 'Fait'}
    </span>
  );
};

export default ActionStatusBadge;
