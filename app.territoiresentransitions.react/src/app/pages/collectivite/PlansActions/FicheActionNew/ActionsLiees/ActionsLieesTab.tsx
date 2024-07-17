import {TActionInsert} from 'types/alias';

type ActionsLieesTabProps = {
  actions: TActionInsert[] | null;
};

const ActionsLieesTab = ({actions}: ActionsLieesTabProps) => {
  const isEmpty = !actions || actions.length === 0;

  return isEmpty ? (
    <div>Aucune action des référentiels n'est liée !</div>
  ) : (
    <div>Actions des référentiels liées</div>
  );
};

export default ActionsLieesTab;
