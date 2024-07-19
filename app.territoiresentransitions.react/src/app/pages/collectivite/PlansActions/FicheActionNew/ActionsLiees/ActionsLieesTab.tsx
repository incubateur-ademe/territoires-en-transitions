import {FicheAction} from '../../FicheAction/data/types';
import EmptyCard from '../EmptyCard';
import ActionPicto from './ActionPicto';

type ActionsLieesTabProps = {
  fiche: FicheAction;
};

const ActionsLieesTab = ({fiche}: ActionsLieesTabProps) => {
  const {actions} = fiche;

  const isEmpty = !actions || actions.length === 0;

  return isEmpty ? (
    <EmptyCard
      picto={className => <ActionPicto className={className} />}
      title="Aucune action des référentiels n'est liée !"
      action={{
        label: 'Lier une action des référentiels',
        icon: 'link',
        onClick: () => {},
      }}
    />
  ) : (
    <div>Actions des référentiels liées</div>
  );
};

export default ActionsLieesTab;
