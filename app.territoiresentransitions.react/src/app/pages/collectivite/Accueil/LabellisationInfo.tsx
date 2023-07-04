import ScoreDisplay from '../EtatDesLieux/Referentiel/SuiviAction/ScoreDisplay';
import {TLabellisationParcours} from '../ParcoursLabellisation/types';
import LabellisationStars from './LabellisationStars';

type LabellisationInfoProps = {
  parcours: TLabellisationParcours | null;
  score: {
    realises: number;
    programmes: number;
    max_personnalise: number;
  };
};

const LabellisationInfo = ({
  parcours,
  score,
}: LabellisationInfoProps): JSX.Element => {
  return (
    <div className="flex flex-col gap-3 md:items-start items-center md:mt-5 md:mb-12 mb-8">
      <LabellisationStars parcours={parcours} />
      <ScoreDisplay
        score={score.realises / score.max_personnalise}
        percent
        legend="Score réalisé"
        size="sm"
        bold="value"
      />
      <ScoreDisplay
        score={score.programmes / score.max_personnalise}
        percent
        icon="fr-icon-calendar-line"
        legend="Score programmé"
        size="sm"
        bold="value"
      />
    </div>
  );
};

export default LabellisationInfo;
