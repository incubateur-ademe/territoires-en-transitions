import { EtoilesLabel } from '@/site/app/types';
import { referentielToLabel } from '@/site/src/utils/labels';
import { GreyStar, RedStar } from './Star';

type LabelReferentielProps = {
  referentiel: 'cae' | 'eci';
  etoiles: EtoilesLabel;
};

const LabelReferentiel = ({ referentiel, etoiles }: LabelReferentielProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-[17px]">
        {[1, 2, 3, 4, 5].map((i) =>
          etoiles >= i ? <RedStar key={i} /> : <GreyStar key={i} />
        )}
      </div>

      <p className="text-[#004189] text-[13px] text-center font-bold uppercase mb-0">
        {referentielToLabel[referentiel]}
      </p>
    </div>
  );
};

export default LabelReferentiel;
