import ScoreDisplay from '../referentiels/ScoreDisplay';
import { TLabellisationParcours } from '../../app/pages/collectivite/ParcoursLabellisation/types';
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
    <div className="flex flex-col gap-3 md:items-start items-center mb-4">
      <LabellisationStars parcours={parcours} />
      <div className="flex flex-row gap-4">
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
    </div>
  );
};

export default LabellisationInfo;
