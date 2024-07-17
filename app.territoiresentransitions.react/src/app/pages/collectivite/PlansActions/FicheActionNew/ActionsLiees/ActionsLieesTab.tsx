import {TActionInsert} from 'types/alias';
import EmptyCard from '../EmptyCard';
import ActionPicto from './ActionPicto';

type ActionsLieesTabProps = {
  actions: TActionInsert[] | null;
};

const ActionsLieesTab = ({actions}: ActionsLieesTabProps) => {
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
