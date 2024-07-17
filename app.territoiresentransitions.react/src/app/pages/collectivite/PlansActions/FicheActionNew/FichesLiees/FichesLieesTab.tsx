import {FicheResume} from '../../FicheAction/data/types';

type FichesLieesTabProps = {
  fiches: FicheResume[] | null;
};

const FichesLieesTab = ({fiches}: FichesLieesTabProps) => {
  const isEmpty = !fiches || fiches.length === 0;

  return isEmpty ? (
    <div>Aucune fiche action de vos plans d'actions n'est liée !</div>
  ) : (
    <div>Fiches des plans liées</div>
  );
};

export default FichesLieesTab;
