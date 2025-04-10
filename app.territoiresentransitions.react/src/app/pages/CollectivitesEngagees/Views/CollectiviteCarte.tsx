import { referentielToName } from '@/app/app/labels';
import { makeCollectiviteAccueilUrl } from '@/app/app/paths';
import { NIVEAUX } from '@/app/referentiels/tableau-de-bord/labellisation/LabellisationInfo';
import {
  GreyStar,
  RedStar,
} from '@/app/referentiels/tableau-de-bord/labellisation/Star';
import { toPercentString } from '@/app/utils/to-percent-string';
import { ReferentielId } from '@/domain/referentiels';
import { Icon } from '@/ui';
import classNames from 'classnames';
import Link from 'next/link';
import { RecherchesReferentiel } from '@/api/collectiviteEngagees';

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
export const CollectiviteCarte = ({
  collectivite,
  canUserClickCard,
}: Props) => {
  return (
    <Link
      data-test="CollectiviteCarte"
      href={
        canUserClickCard
          ? makeCollectiviteAccueilUrl({
              collectiviteId: collectivite.collectiviteId,
            })
          : '#'
      }
      className={classNames(
        'p-8 !bg-none bg-white rounded-xl border border-primary-3',
        {
          'cursor-default, pointer-events-none': !canUserClickCard,
          'hover:!bg-primary-2': canUserClickCard,
        }
      )}
    >
      <div className="mb-4 text-lg font-bold text-primary-9">
        {collectivite.collectiviteNom}
      </div>
      <div className="flex justify-between gap-4 sm:gap-8 xl:gap-8">
        <ReferentielCol
          referentiel={'cae'}
          etoiles={collectivite.etoilesCae}
          scoreRealise={collectivite.scoreFaitCae}
          scoreProgramme={collectivite.scoreProgrammeCae}
          concerne={collectivite.collectiviteType !== 'syndicat'}
        />
        <div className="w-px mx-auto flex-shrink-0 bg-gray-200"></div>
        <ReferentielCol
          referentiel={'eci'}
          etoiles={collectivite.etoilesEci}
          scoreRealise={collectivite.scoreFaitEci}
          scoreProgramme={collectivite.scoreProgrammeEci}
          concerne={true}
        />
      </div>
    </Link>
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
export const ReferentielCol = (props: TReferentielColProps) => {
  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="text-sm font-bold text-primary-7">
        {referentielToName[props.referentiel]}
      </div>
      {props.concerne ? (
        <>
          <CinqEtoiles etoiles={props.etoiles} />
          <div className="flex items-center text-xs text-grey-6">
            <Icon icon="line-chart-line" size="sm" className="mr-1.5" />
            <span className="mr-1 font-semibold">
              {toPercentString(props.scoreRealise)}
            </span>
            réalisé courant
          </div>
          <div className="flex items-center text-xs text-grey-6">
            <Icon icon="calendar-line" size="sm" className="mr-1.5" />
            <span className="mr-1 font-semibold">
              {toPercentString(props.scoreProgramme)}
            </span>
            programmé
          </div>
        </>
      ) : (
        <div className="my-auto mr-auto font-light italic text-grey-6">
          Non concerné
        </div>
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
    <div className="flex gap-2">
      {/* <div className="flex -space-x-3 first:-m-1 sm:-space-x-1 lg:-space-x-2 xl:-space-x-1"> */}
      {NIVEAUX.map((niveau) => {
        const obtenue = etoiles >= niveau;
        const Star = obtenue ? RedStar : GreyStar;
        return <Star key={niveau} className="!w-6 !h-6" />;
      })}
    </div>
  );
};
