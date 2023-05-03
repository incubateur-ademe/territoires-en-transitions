import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {Referentiel} from 'types/litterals';
import {toPercentString} from 'utils/score';
import {referentielToName} from 'app/labels';
import {NIVEAUX} from 'app/pages/collectivite/TableauBord/getNiveauInfo';
import {GreyStar, GreenStar} from 'app/pages/collectivite/TableauBord/Star';
import {Card} from '@material-ui/core';
import {Link} from 'react-router-dom';
import {makeCollectiviteTableauBordUrl} from 'app/paths';
import classNames from 'classnames';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {CheckIcon} from 'ui/icons/CheckIcon';

export type TCollectiviteCarteProps = {
  collectivite: CollectiviteCarteRead;
  isCardClickable: boolean;
};

/**
 * Carte représentant une collectivité.
 * Utilisée dans la vue toutes les collectivités.
 *
 * Affiche le nom et des éléments de scores.
 * Lie vers le tableau de bord de la collectivité.
 */
export const CollectiviteCarte = (props: TCollectiviteCarteProps) => {
  const {collectivite} = props;
  const tracker = useFonctionTracker();

  return (
    <Link
      onClick={() => tracker({fonction: 'collectivite_carte', action: 'clic'})}
      to={
        props.isCardClickable
          ? makeCollectiviteTableauBordUrl({
              collectiviteId: collectivite.collectivite_id,
            })
          : '#'
      }
      className={classNames('!shadow-none', {
        'cursor-default, pointer-events-none': !props.isCardClickable,
      })}
    >
      <Card
        data-test="CollectiviteCarte"
        className={classNames(
          'flex flex-col w-full max-w-full h-full p-3 md:p-6 border border-gray-100',
          {
            'hover:bg-gray-100': props.isCardClickable,
          }
        )}
      >
        <div className="md:text-lg text-base font-bold mb-4">
          {collectivite.nom}
        </div>
        <div className="flex justify-between gap-1 sm:gap-4 mt-auto">
          <ReferentielCol
            referentiel={'cae'}
            etoiles={collectivite.etoiles_cae}
            scoreRealise={collectivite.score_fait_cae}
            scoreProgramme={collectivite.score_programme_cae}
            concerne={collectivite.type_collectivite !== 'syndicat'}
          />
          <div className="w-px bg-gray-200"></div>
          <ReferentielCol
            referentiel={'eci'}
            etoiles={collectivite.etoiles_eci}
            scoreRealise={collectivite.score_fait_eci}
            scoreProgramme={collectivite.score_programme_eci}
            concerne={true}
          />
        </div>
      </Card>
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
    <div style={{color: '#666666'}} className="flex flex-col flex-1 gap-2 ">
      <div style={{fontSize: '14px'}}>
        {referentielToName[props.referentiel]}
      </div>
      {props.concerne ? (
        <div style={{fontSize: '12px'}} className="flex flex-col gap-1">
          <CinqEtoiles etoiles={props.etoiles} />
          <div>
            {' '}
            <CheckIcon className="inline-block mr-3" />
            <span className="font-semibold">
              {toPercentString(props.scoreRealise)}
            </span>{' '}
            réalisé courant
          </div>
          <div>
            <i className="fr-icon fr-fi-calendar-line before:text-[#417DC4] mr-2"></i>{' '}
            <span className="font-semibold">
              {toPercentString(props.scoreProgramme)}
            </span>{' '}
            programmé
          </div>
        </div>
      ) : (
        <div className="my-auto mr-auto font-light italic text-center">
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
const CinqEtoiles = (props: TCinqEtoilesProps) => {
  const {etoiles} = props;

  return (
    <div className="flex -space-x-3 first:-m-1 sm:-space-x-1 lg:-space-x-2 xl:-space-x-1">
      {NIVEAUX.map(niveau => {
        const obtenue = etoiles >= niveau;
        const Star = obtenue ? GreenStar : GreyStar;
        return (
          <div className="scale-75" key={niveau}>
            <Star key={`n${niveau}`} />
          </div>
        );
      })}
    </div>
  );
};
