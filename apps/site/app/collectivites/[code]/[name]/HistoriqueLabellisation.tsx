import { Labellisations } from '@/site/app/collectivites/utils';
import { RedStar } from '@/site/components/labellisation/Star';
import { referentielToLabel } from '@/site/src/utils/labels';

type HistoriqueLabellisationProps = {
  referentiel: 'cae' | 'eci';
  historique: Labellisations[];
};

const HistoriqueLabellisation = ({
  referentiel,
  historique,
}: HistoriqueLabellisationProps) => {
  if (!historique.length) return null;

  const sortedHistorique = historique.sort(
    (a, b) => (b.annee ?? 0) - (a.annee ?? 0)
  );

  return (
    <div className="flex flex-col items-center md:rounded-[10px] bg-white p-8">
      <p className="text-[#004189] text-[13px] text-center font-bold uppercase mb-4">
        {referentielToLabel[referentiel]}
      </p>
      <p className="text-primary-8 text-[14px] text-center font-bold mb-3">
        Évolution du score
      </p>
      <div className="flex flex-col gap-3 w-full max-md:max-w-[226px]">
        {sortedHistorique.map((hist) => (
          <div
            key={hist.id}
            className="border border-primary-4 rounded-[10px] h-[49px] w-full px-4 flex items-center justify-between"
          >
            <div className="text-primary-8 text-[16px] font-bold">
              {hist.annee}
            </div>
            <div className="flex flex-col justify-center items-end">
              {hist.etoiles !== 1 && (
                <div className="text-primary-10 font-bold">
                  {hist.score_realise
                    ? `${Math.round(hist.score_realise)}%`
                    : null}
                </div>
              )}
              <div className="flex gap-[5px]">
                {[1, 2, 3, 4, 5]
                  .filter((e) => e <= hist.etoiles)
                  .map((e) => (
                    <RedStar key={e} className="w-[11px] h-[11px]" />
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoriqueLabellisation;
