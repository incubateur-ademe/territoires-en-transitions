import { RecherchesReferentiel } from '@/api/collectiviteEngagees';
import { referentielToName } from '@/app/app/labels';
import { makeReferentielRootUrl } from '@/app/app/paths';
import { NIVEAUX } from '@/app/referentiels/tableau-de-bord/labellisation/LabellisationInfo';
import {
  GreyStar,
  RedStar,
} from '@/app/referentiels/tableau-de-bord/labellisation/Star';
import { toPercentString } from '@/app/utils/to-percent-string';
import { ReferentielId } from '@/domain/referentiels';
import { Card, Icon } from '@/ui';
import classNames from 'classnames';

type Props = {
  collectivite: RecherchesReferentiel;
  canUserClickCard: boolean;
};

/**
 * Carte représentant une collectivité.
 * Utilisée dans la vue collectivités engagées.
 *
 * Affiche le nom et des éléments de scores.
 * Lien vers le tableau de bord de la collectivité.
 */
export const ReferentielCarte = ({ collectivite, canUserClickCard }: Props) => {
  const {
    collectiviteId,
    collectiviteNom,
    collectiviteType,
    etoilesCae,
    scoreFaitCae,
    scoreProgrammeCae,
    etoilesEci,
    scoreFaitEci,
    scoreProgrammeEci,
  } = collectivite;

  return (
    <Card
      data-test="CollectiviteCarte"
      className={classNames('!border-primary-3 !py-5 !px-6 !gap-3', {
        'hover:!bg-primary-0': canUserClickCard,
      })}
      href={
        canUserClickCard
          ? makeReferentielRootUrl({
              collectiviteId: collectiviteId,
            })
          : undefined
      }
    >
      <div className="mb-0 text-lg font-bold text-primary-9">
        {collectiviteNom}
      </div>
      <div className="flex justify-between gap-4 sm:gap-6 xl:gap-8">
        <ReferentielCol
          referentiel={'cae'}
          etoiles={etoilesCae}
          scoreRealise={scoreFaitCae}
          scoreProgramme={scoreProgrammeCae}
          concerne={collectiviteType !== 'syndicat'}
        />
        <div className="w-[0.5px] mx-auto flex-shrink-0 bg-grey-4"></div>
        <ReferentielCol
          referentiel={'eci'}
          etoiles={etoilesEci}
          scoreRealise={scoreFaitEci}
          scoreProgramme={scoreProgrammeEci}
          concerne={true}
        />
      </div>
    </Card>
  );
};

export type TReferentielColProps = {
  referentiel: ReferentielId;
  etoiles: number;
  scoreRealise: number;
  scoreProgramme: number;
  concerne: boolean;
};

/**
 * Une colonne avec les éléments de score pour la carte collectivité.
 */
export const ReferentielCol = ({
  referentiel,
  concerne,
  etoiles,
  scoreRealise,
  scoreProgramme,
}: TReferentielColProps) => {
  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="text-sm font-bold text-primary-7">
        {referentielToName[referentiel]}
      </div>
      {concerne ? (
        <>
          <CinqEtoiles etoiles={etoiles} />
          <span className="text-xs text-grey-9 font-normal">
            <Icon icon="line-chart-line" size="sm" className="mr-1.5" />
            <span className="font-bold">
              {toPercentString(scoreRealise)}
            </span>{' '}
            réalisé courant
          </span>
          <span className="text-xs text-grey-9 font-normal">
            <Icon icon="calendar-line" size="sm" className="mr-1.5" />
            <span className="font-bold">
              {toPercentString(scoreProgramme)}
            </span>{' '}
            programmé
          </span>
        </>
      ) : (
        <span className="font-light italic text-xs text-grey-6">
          Non concerné
        </span>
      )}
    </div>
  );
};

export type TCinqEtoilesProps = {
  etoiles: number;
};

/**
 * Les étoiles affichées dans la colonne des informations relative au
 * référentiel.
 */
const CinqEtoiles = ({ etoiles }: TCinqEtoilesProps) => {
  return (
    <div className="flex gap-2 mb-1">
      {NIVEAUX.map((niveau) => {
        const obtenue = etoiles >= niveau;
        const Star = obtenue ? RedStar : GreyStar;
        return <Star key={niveau} className="!w-5 !h-5" />;
      })}
    </div>
  );
};
