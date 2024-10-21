import Link from 'next/link';
import { Referentiel } from 'types/litterals';
import { toPercentString } from 'utils/score';
import { referentielToName } from 'app/labels';
import { NIVEAUX } from 'ui/labellisation/getNiveauInfo';
import { GreyStar, RedStar } from 'ui/labellisation/Star';
import { TCollectiviteCarte } from 'app/pages/CollectivitesEngagees/data/useFilteredCollectivites';
import { useFonctionTracker } from 'core-logic/hooks/useFonctionTracker';
import { makeCollectiviteAccueilUrl } from 'app/paths';
import classNames from 'classnames';
import { Icon } from '@tet/ui';

type Props = {
  collectivite: TCollectiviteCarte;
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
  const tracker = useFonctionTracker();

  return (
    <Link
      data-test="CollectiviteCarte"
      onClick={() =>
        tracker({ fonction: 'collectivite_carte', action: 'clic' })
      }
      href={
        canUserClickCard
          ? makeCollectiviteAccueilUrl({
              collectiviteId: collectivite.collectivite_id,
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
        {collectivite.nom}
      </div>
      <div className="flex justify-between gap-4 sm:gap-8 xl:gap-8">
        <ReferentielCol
          referentiel={'cae'}
          etoiles={collectivite.etoiles_cae}
          scoreRealise={collectivite.score_fait_cae}
          scoreProgramme={collectivite.score_programme_cae}
          concerne={collectivite.type_collectivite !== 'syndicat'}
        />
        <div className="w-px mx-auto flex-shrink-0 bg-gray-200"></div>
        <ReferentielCol
          referentiel={'eci'}
          etoiles={collectivite.etoiles_eci}
          scoreRealise={collectivite.score_fait_eci}
          scoreProgramme={collectivite.score_programme_eci}
          concerne={true}
        />
      </div>
    </Link>
  );
};

export type TReferentielColProps = {
  referentiel: Referentiel;
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
