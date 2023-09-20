import {CalendarIcon} from '@components/icones/CalendarIcon';
import {CheckIcon} from '@components/icones/CheckIcon';
import {GreenStar, GreyStar} from '@components/labellisation/Star';
import {toLocaleFixed} from 'app/utils';

const NIVEAUX = [1, 2, 3, 4, 5];

type LabellisationCarteProps = {
  titre: string;
  etoiles: number | null;
  score: number | null;
  dateLabel: string | null;
};

const LabellisationCarte = ({
  titre,
  etoiles,
  score,
  dateLabel,
}: LabellisationCarteProps) => {
  return (
    <div
      className="h-full bg-white rounded-lg p-12 pt-8 flex flex-col relative"
      style={{
        boxShadow: '0px 2px 16px 0px #0063CB0A, 0px 4px 6px 0px #0063CB0F',
      }}
    >
      {/* En-tête */}
      <picture>
        <img
          src="/territoire-engage.jpg"
          alt="Logo Territoire Engage"
          className="h-[90px] -ml-2"
        />
      </picture>

      <div className="text-lg font-bold pb-1">{titre}</div>

      <span className="text-xs">Résultat de la labellisation</span>

      {/* Niveau de labellisation et détails */}
      <div className="flex flex-col gap-3 items-start justify-between mt-6">
        {/* Etoiles */}
        <div className="flex m-0 md:first:-mx-1">
          {NIVEAUX.map(niveau => {
            const obtenue = (etoiles ?? 0) >= niveau;
            const Star = obtenue ? GreenStar : GreyStar;
            return (
              <div className="scale-75" key={niveau}>
                <Star key={`n${niveau}`} />
              </div>
            );
          })}
        </div>

        {/* Score réalisé */}
        <div className="flex items-center text-sm">
          <CheckIcon className="h-4 inline-block mr-2" />
          <div>
            <span className="whitespace-pre-wrap">Score réalisé : </span>
            <span className="font-bold">{`${toLocaleFixed(
              Math.round(score ?? 0),
              (score ?? 0) < 0.01 ? 2 : 0,
            )} %`}</span>
          </div>
        </div>

        {/* Date de labellisation */}
        <div className="flex items-center text-sm">
          <div className="w-[24px] mr-2">
            <CalendarIcon className="h-4 inline-block ml-1" />
          </div>
          <div>
            <span className="whitespace-pre-wrap">
              Date de la labellisation :{' '}
            </span>
            <span className="font-bold">
              {dateLabel ? new Date(dateLabel).toLocaleDateString('fr') : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabellisationCarte;
