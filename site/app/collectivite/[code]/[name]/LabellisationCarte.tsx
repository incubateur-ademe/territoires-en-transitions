import {CalendarIcon} from '@components/icones/CalendarIcon';
import ScoreDisplay from '@components/labellisation/ScoreDisplay';
import {GreenStar, GreyStar} from '@components/labellisation/Star';

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

      {/* Niveau de labellisation et détails */}
      <div className="flex flex-col gap-3 items-start justify-between mt-6">
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

        <ScoreDisplay
          score={score ?? 0}
          percent
          legend="Score réalisé"
          size="sm"
          bold="value"
        />

        <div className="flex items-center text-sm">
          <div className="w-[24px] mr-2">
            <CalendarIcon className="h-4 inline-block ml-1" />
          </div>

          <div>
            <span className="whitespace-pre-wrap">
              Date de la labellisation :{' '}
            </span>
            <span className="font-bold">{dateLabel ?? 'NA'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabellisationCarte;
