import { TLabellisationParcours } from '@/app/referentiels/labellisations/types';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { Tooltip } from '@/ui';
import ScoreShow from '../../scores/score.show';
import { GreyStar, RedStar } from './Star';

export const NIVEAUX = [1, 2, 3, 4, 5];

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
  const etoiles = parcours?.labellisation?.etoiles ?? 0;
  const scoreRealise = parcours?.labellisation?.score_realise ?? 0;
  const dateLabel = parcours?.labellisation?.obtenue_le;

  return (
    <div className="flex flex-col gap-3 md:items-start items-center mb-4">
      {/** Étoiles */}
      <Tooltip
        label={
          etoiles === 1 ? (
            <p>
              Reconnaissance obtenue
              {!!dateLabel &&
                ` le ${new Date(dateLabel).toLocaleDateString('fr')}`}
            </p>
          ) : (
            <>
              <p>
                Score réalisé : <b>{toLocaleFixed(scoreRealise ?? 0, 2)} %</b>
              </p>
              {!!dateLabel && (
                <p>
                  Date de la dernière labellisation :{' '}
                  {new Date(dateLabel).toLocaleDateString('fr')}
                </p>
              )}
            </>
          )
        }
      >
        <div className="flex m-0 md:first:-mx-1">
          {NIVEAUX.map((niveau) => {
            const obtenue = etoiles >= niveau;
            const Star = obtenue ? RedStar : GreyStar;
            return (
              <div className="scale-75" key={niveau}>
                <Star key={`n${niveau}`} />
              </div>
            );
          })}
        </div>
      </Tooltip>

      {/** Score */}
      <div className="flex flex-col 2xl:flex-row gap-4">
        <ScoreShow
          score={score.realises / score.max_personnalise}
          percent
          legend="Score réalisé"
          size="sm"
          bold="value"
        />
        <ScoreShow
          score={score.programmes / score.max_personnalise}
          percent
          icon="calendar-line"
          legend="Score programmé"
          size="sm"
          bold="value"
        />
      </div>
    </div>
  );
};

export default LabellisationInfo;
