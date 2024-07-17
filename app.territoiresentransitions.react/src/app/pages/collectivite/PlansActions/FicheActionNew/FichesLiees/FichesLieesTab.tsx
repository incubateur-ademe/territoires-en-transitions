import {FicheResume} from '../../FicheAction/data/types';
import EmptyCard from '../EmptyCard';
import FichePicto from './FichePicto';

type FichesLieesTabProps = {
  fiches: FicheResume[] | null;
};

const FichesLieesTab = ({fiches}: FichesLieesTabProps) => {
  const isEmpty = !fiches || fiches.length === 0;

  return isEmpty ? (
    <EmptyCard
      picto={className => <FichePicto className={className} />}
      title="Aucune fiche action de vos plans d'actions n'est liée !"
      action={{
        label: 'Lier une fiche action',
        icon: 'link',
        onClick: () => {},
      }}
    />
  ) : (
    <div>Fiches des plans liées</div>
  );
};

export default FichesLieesTab;
