import AvantagesPlateforme from './AvantagesPlateforme';
import EquipePlateforme from './EquipePlateforme';
import FonctionnalitesPlateforme from './FonctionnalitesPlateforme';
import HeaderPlateforme from './HeaderPlateforme';
import QuestionsPlateforme from './QuestionsPlateforme';
import TemoignagesPlateforme from './TemoignagesPlateforme';

const OutilNumerique = () => {
  return (
    <div className="grow">
      <HeaderPlateforme />

      <AvantagesPlateforme />

      <FonctionnalitesPlateforme />

      <TemoignagesPlateforme />

      <EquipePlateforme />

      <QuestionsPlateforme />
    </div>
  );
};

export default OutilNumerique;
