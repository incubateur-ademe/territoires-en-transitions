import {NIVEAUX} from './getNiveauInfo';
import {GreyStar, RedStar} from './Star';
import {TLabellisationParcours} from '../../app/pages/collectivite/ParcoursLabellisation/types';
import {toLocaleFixed} from 'utils/toFixed';
import {Tooltip} from '@tet/ui';

type LabellisationStarsProps = {
  parcours: TLabellisationParcours | null;
};

const LabellisationStars = ({parcours}: LabellisationStarsProps) => {
  const etoiles = parcours?.labellisation?.etoiles ?? 0;
  const scoreRealise = parcours?.labellisation?.score_realise ?? 0;
  const dateLabel = parcours?.labellisation?.obtenue_le;

  return (
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
        {NIVEAUX.map(niveau => {
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
  );
};

export default LabellisationStars;
