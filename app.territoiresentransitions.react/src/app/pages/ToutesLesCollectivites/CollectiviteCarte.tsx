import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {Referentiel} from 'types/litterals';
import {toPercentString} from 'utils/score';
import {referentielToName} from 'app/labels';
import {NIVEAUX} from 'app/pages/collectivite/TableauBord/getNiveauInfo';
import {GreyStar, GreenStar} from 'app/pages/collectivite/TableauBord/Star';
import {Card} from '@material-ui/core';
import {Link} from 'react-router-dom';
import {makeCollectiviteTableauBordUrl} from 'app/paths';

export type TCollectiviteCarteProps = {
  collectivite: CollectiviteCarteRead;
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

  return (
    <Link
      to={makeCollectiviteTableauBordUrl({
        collectiviteId: collectivite.collectivite_id,
      })}
      style={{boxShadow: 'none'}} // override DSFR shadow
    >
      <Card className="collectiviteCard p-6 w-full">
        <div className="text-lg font-bold h-24">{collectivite.nom}</div>
        <div className="flex justify-between gap-4">
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

const CheckIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="inline-block mr-3"
  >
    <path
      d="M11.602 13.7615L13.014 15.1735L21.48 6.70747L22.894 8.12147L13.014 18.0015L6.65 11.6375L8.064 10.2235L10.189 12.3485L11.602 13.7605V13.7615ZM11.604 10.9335L16.556 5.98047L17.966 7.39047L13.014 12.3435L11.604 10.9335ZM8.777 16.5885L7.364 18.0015L1 11.6375L2.414 10.2235L3.827 11.6365L3.826 11.6375L8.777 16.5885V16.5885Z"
      fill="#00A95F"
    />
  </svg>
);

/**
 * Une colonne avec les éléments de score pour la carte collectivité.
 */
export const ReferentielCol = (props: TReferentielColProps) => {
  return (
    <div className="flex flex-col flex-1 gap-2 ">
      <div className="text-sm">{referentielToName[props.referentiel]}</div>
      {props.concerne ? (
        <div className="flex flex-col gap-1">
          <CinqEtoiles etoiles={props.etoiles} />
          <div>
            {' '}
            <CheckIcon />
            <span className="font-semibold">
              {toPercentString(props.scoreRealise)}
            </span>{' '}
            réalisé
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
        <div className="font-light italic text-center">Non concerné</div>
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
    <div className="flex space-x-2">
      {NIVEAUX.map(niveau => {
        const obtenue = etoiles >= niveau;
        const Star = obtenue ? GreenStar : GreyStar;
        return (
          <div className="w-6 scale-75 -ml-1" key={niveau}>
            <Star key={`n${niveau}`} />
          </div>
        );
      })}
    </div>
  );
};
