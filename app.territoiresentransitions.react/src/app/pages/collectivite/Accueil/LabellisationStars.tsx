import {ReferentielParamOption} from 'app/paths';
import {Tooltip} from 'ui/shared/floating-ui/Tooltip';
import {useCycleLabellisation} from '../ParcoursLabellisation/useCycleLabellisation';
import {NIVEAUX} from '../../../../ui/labellisation/getNiveauInfo';
import {GreyStar, RedStar} from 'ui/labellisation/Star';

type LabellisationStarsProps = {
  referentiel: ReferentielParamOption;
};

const LabellisationStars = ({referentiel}: LabellisationStarsProps) => {
  const {parcours} = useCycleLabellisation(referentiel);
  const etoiles = parcours?.labellisation?.etoiles ?? 0;
  const scoreRealise = parcours?.labellisation?.score_realise ?? 0;
  const dateLabel = parcours?.labellisation?.obtenue_le;

  return (
    <Tooltip
      label={() => (
        <>
          <p>
            Score réalisé : <b>{scoreRealise} %</b>
          </p>
          {!!dateLabel && (
            <p>
              Date de la dernière labellisation :{' '}
              {new Date(dateLabel).toLocaleDateString('fr')}
            </p>
          )}
        </>
      )}
    >
      <div className="flex md:justify-start justify-center m-0 md:first:-mx-1 md:pt-5 md:pb-12 pb-8">
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
